import unittest
from unittest.mock import patch
import base64

import pymupdf as fitz
from unittest.mock import Mock

from pdf_translator import build_translated_pdf
from pdf2zh.translator import AITranslator, placeholders
from pdf2zh.high_level import translate_stream
import main


class BuildTranslatedPdfTest(unittest.TestCase):
    def test_returns_pdf_with_translated_text_and_original_page_size(self):
        source = fitz.open()
        page = source.new_page(width=400, height=300)
        page.insert_textbox((40, 40, 360, 100), "Original English text", fontsize=12)
        result = {
            "pages": [{
                "pageNumber": 1,
                "width": 400,
                "height": 300,
                "blocks": [{
                    "bbox": [40, 40, 360, 100],
                    "original": "Original English text",
                    "translated": "Nội dung tiếng Việt đã dịch",
                }],
            }],
        }

        output = build_translated_pdf(source, result)
        translated = fitz.open(stream=output, filetype="pdf")

        self.assertEqual(len(translated), 1)
        self.assertEqual(translated[0].rect, source[0].rect)
        page_text = translated[0].get_text()
        self.assertIn("Nội dung tiếng Việt đã dịch", page_text)
        self.assertNotIn("Original English text", page_text)
        self.assertTrue(output.startswith(b"%PDF"))

class AITranslatorTest(unittest.TestCase):
    def make_translator(self):
        return AITranslator(
            "auto",
            "vi",
            "test-model",
            ignore_cache=True,
            envs={"api_key": "secret", "base_url": "https://router.example/v1"},
        )

    def test_preserves_formula_placeholders_in_exact_order(self):
        source = "The result <b0></b0> follows from <b1>n + 1</b1>."
        translated = "Kết quả <b0></b0> suy ra từ <b1>n + 1</b1>."
        with patch("pdf2zh.translator._request_ai_translation", return_value=translated):
            result = self.make_translator().do_translate(source)

        self.assertEqual(result, translated)
        self.assertEqual(placeholders(result), placeholders(source))

    def test_rejects_translation_with_missing_formula_placeholder(self):
        source = "The result <b0></b0> is stable."
        with patch("pdf2zh.translator._request_ai_translation", return_value="Kết quả ổn định."):
            result = self.make_translator().do_translate(source)

        self.assertEqual(result, source)

class TranslatePdfEndpointTest(unittest.TestCase):
    def test_returns_mono_pdf_from_preservation_core(self):
        source = fitz.open()
        source.new_page(width=400, height=300).insert_text((40, 40), "Source prose")
        source_bytes = source.tobytes()
        translated_bytes = b"%PDF-1.7\ntranslated"
        request = main.TranslatePdfRequest(
            fileBase64=base64.b64encode(source_bytes).decode("ascii"),
            fileName="lecture.pdf",
            maxPages=1,
        )

        with (
            patch.object(main, "OPENAI_API_KEY", "secret"),
            patch.object(main, "get_pdf_layout_model", return_value="layout-model"),
            patch(
                "pdf2zh.high_level.translate_stream",
                return_value=(translated_bytes, b"dual", []),
            ) as translate_stream,
        ):
            response = main.translate_pdf_endpoint(request)

        self.assertEqual(response.body, translated_bytes)
        self.assertEqual(response.media_type, "application/pdf")
        self.assertIn("lecture-tieng-viet.pdf", response.headers["content-disposition"])
        _, kwargs = translate_stream.call_args
        self.assertEqual(kwargs["pages"], [0])
        self.assertEqual(kwargs["service"], f"ai:{main.AI_MODEL}")
        self.assertEqual(kwargs["envs"]["api_key"], "secret")

class PreservationCoreIntegrationTest(unittest.TestCase):
    def test_translates_prose_but_keeps_formula_text_and_page_geometry(self):
        source = fitz.open()
        page = source.new_page(width=420, height=320)
        page.insert_text((40, 60), "Original prose sentence.", fontname="helv", fontsize=12)
        page.insert_text((40, 100), "x + y = 1", fontname="cour", fontsize=12)
        source_bytes = source.tobytes()
        layout_result = Mock()
        layout_result.boxes = []
        layout_result.names = {}
        layout_model = Mock()
        layout_model.predict.return_value = [layout_result]

        def translate_segment(text, **_kwargs):
            return text.replace("Original prose sentence.", "Translated prose sentence.")

        with (
            patch("pdf2zh.high_level.download_remote_fonts", return_value="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
            patch("pdf2zh.translator._request_ai_translation", side_effect=translate_segment) as ai_translate,
        ):
            translated_bytes, _dual, failures = translate_stream(
                source_bytes,
                pages=[0],
                lang_in="auto",
                lang_out="vi",
                service="ai:test-model",
                thread=1,
                model=layout_model,
                envs={"api_key": "secret", "base_url": "https://router.example/v1"},
                ignore_cache=True,
            )

        translated = fitz.open(stream=translated_bytes, filetype="pdf")
        output_text = translated[0].get_text()
        translated_inputs = [call.args[0] for call in ai_translate.call_args_list]
        self.assertEqual(failures, [])
        self.assertEqual(len(translated), 1)
        self.assertEqual(translated[0].rect, source[0].rect)
        self.assertIn("Translated prose sentence.", output_text)
        self.assertIn("x + y = 1", output_text)
        self.assertFalse(any("x + y = 1" in text for text in translated_inputs))

    def test_rejects_translation_with_reordered_formula_placeholders(self):
        source = "Compare <b0></b0> and <b1></b1>."
        malformed = "So sánh <b1></b1> và <b0></b0>."
        with patch("pdf2zh.translator._request_ai_translation", return_value=malformed):
            result = AITranslatorTest().make_translator().do_translate(source)

        self.assertEqual(result, source)


if __name__ == "__main__":
    unittest.main()
