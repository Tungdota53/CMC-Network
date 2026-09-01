import io
import re
import json
import base64
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
import pymupdf as fitz

MAX_BATCH_CHARS = 12000
MAX_BATCH_WORKERS = 3
PDF_FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def build_translated_pdf(doc: fitz.Document, translation: dict) -> bytes:
    """Replace translated text blocks while preserving each source PDF page."""
    output = fitz.open(stream=doc.tobytes(), filetype="pdf")
    for page_data in translation["pages"]:
        page = output[page_data["pageNumber"] - 1]
        blocks = page_data["blocks"]
        for block in blocks:
            page.add_redact_annot(fitz.Rect(block["bbox"]), fill=(1, 1, 1))
        if blocks:
            page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)

        font_name = "helv"
        try:
            page.insert_font(fontname="translation", fontfile=PDF_FONT_PATH)
            font_name = "translation"
        except (RuntimeError, ValueError):
            pass

        for block in blocks:
            rect = fitz.Rect(block["bbox"])
            text = block["translated"].strip()
            font_size = min(11.0, max(6.0, rect.height / max(1, text.count("\n") + 1) * 0.65))
            while font_size >= 5.0:
                remaining = page.insert_textbox(
                    rect,
                    text,
                    fontname=font_name,
                    fontsize=font_size,
                    color=(0, 0, 0),
                    lineheight=1.05,
                )
                if remaining >= 0:
                    break
                font_size -= 0.5

    return output.tobytes(garbage=4, deflate=True)


def parse_chat_completion_response(raw_body: bytes) -> str:
    body = raw_body.decode("utf-8").strip()
    if not body:
        raise ValueError("AI router returned an empty response")

    if not body.startswith("data:"):
        data = json.loads(body)
        return data["choices"][0]["message"]["content"].strip()

    chunks = []
    for line in body.splitlines():
        if not line.startswith("data:"):
            continue
        payload = line.removeprefix("data:").strip()
        if not payload or payload == "[DONE]":
            continue
        event = json.loads(payload)
        choice = (event.get("choices") or [{}])[0]
        content = (choice.get("delta") or {}).get("content")
        if content:
            chunks.append(content)

    result = "".join(chunks).strip()
    if not result:
        raise ValueError("AI router SSE response contained no translated text")
    return result

def translate_text_with_engine(text: str, target_lang="vi", source_lang="auto", api_key: str = None, base_url: str = None, model: str = None) -> str:
    """
    Dịch text với cơ chế fallback:
    1. Nếu có OpenAI/LLM API key thì dịch qua LLM để văn phong học thuật chuẩn nhất.
    2. Nếu không, dịch qua Google Translate endpoint với headers giả lập browser chuẩn và retry.
    """
    if not text or not text.strip():
        return text
    
    clean_text = text.strip()
    if re.match(r"^[\d\W_]+$", clean_text):
        return text

    # Cách 1: Thử dịch qua LLM nếu có API key
    if api_key and base_url:
        try:
            url = f"{base_url.rstrip('/')}/chat/completions"
            payload = json.dumps({
                "model": model or "gpt-3.5-turbo",
                "messages": [
                    {
                        "role": "system", 
                        "content": "Bạn là chuyên gia dịch thuật tài liệu đại học sang tiếng Việt chuẩn xác, giữ nguyên thuật ngữ chuyên ngành và tuyệt đối bảo toàn nguyên vẹn các token dạng <b0>, <b1>, <b2>... Không giải thích thêm, chỉ trả lời bản dịch."
                    },
                    {"role": "user", "content": f"Dịch sang tiếng Việt:\n{clean_text}"}
                ],
                "temperature": 0.2,
                "max_tokens": 1500,
                "stream": False,
            }).encode("utf-8")
            
            req = urllib.request.Request(
                url,
                data=payload,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": f"Bearer {api_key}",
                    "User-Agent": "CMCNetworkAIAssistant/1.0",
                }
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                return parse_chat_completion_response(resp.read())
        except Exception as exc:
            print(f"[PDF Translator] LLM translate failed: {exc}, fallbacking...", flush=True)

    # Cách 2: Google Translate API
    for client in ["gtx", "dict-chrome-ex"]:
        try:
            encoded_text = urllib.parse.quote(clean_text)
            url = (
                f"https://translate.googleapis.com/translate_a/single"
                f"?client={client}&sl={source_lang}&tl={target_lang}&dt=t&q={encoded_text}"
            )
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                    "Referer": "https://translate.google.com/",
                }
            )
            with urllib.request.urlopen(req, timeout=8) as response:
                result = json.loads(response.read().decode("utf-8"))
                if result and isinstance(result, list) and len(result) > 0:
                    translated_parts = [item[0] for item in result[0] if item and item[0]]
                    if translated_parts:
                        return "".join(translated_parts)
        except Exception:
            pass

    # Cách 3: MyMemory free translation API fallback
    try:
        encoded_text = urllib.parse.quote(clean_text[:500])
        url = f"https://api.mymemory.translated.net/get?q={encoded_text}&langpair=en|vi"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data and "responseData" in data and data["responseData"].get("translatedText"):
                return data["responseData"]["translatedText"]
    except Exception:
        pass

    return clean_text


def translate_text_batch(texts: list[str], target_lang="vi", api_key: str = None, base_url: str = None, model: str = None) -> list[str]:
    if not texts:
        return []
    if len(texts) == 1:
        return [translate_text_with_engine(texts[0], target_lang=target_lang, api_key=api_key, base_url=base_url, model=model)]

    if api_key and base_url:
        try:
            url = f"{base_url.rstrip('/')}/chat/completions"
            payload = json.dumps({
                "model": model or "gpt-3.5-turbo",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "Dịch từng phần tử JSON sang tiếng Việt học thuật. Giữ nguyên thứ tự, số phần tử, "
                            "thuật ngữ chuyên ngành và token dạng <b0>. Chỉ trả về một JSON array gồm các chuỗi đã dịch."
                        ),
                    },
                    {"role": "user", "content": json.dumps(texts, ensure_ascii=False)},
                ],
                "temperature": 0.1,
                "max_tokens": 6000,
                "stream": False,
            }, ensure_ascii=False).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=payload,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": f"Bearer {api_key}",
                    "User-Agent": "CMCNetworkAIAssistant/1.0",
                },
            )
            with urllib.request.urlopen(req, timeout=75) as resp:
                content = parse_chat_completion_response(resp.read())
            json_match = re.search(r"\[.*\]", content, flags=re.DOTALL)
            translated = json.loads(json_match.group(0) if json_match else content)
            if isinstance(translated, list) and len(translated) == len(texts) and all(isinstance(item, str) for item in translated):
                return translated
            raise ValueError("AI router returned an invalid translation batch")
        except Exception as exc:
            print(f"[PDF Translator] LLM batch failed: {exc}, fallbacking...", flush=True)

    return [translate_text_with_engine(text, target_lang=target_lang) for text in texts]


def create_batches(items: list[dict]) -> list[list[dict]]:
    batches = []
    current = []
    current_chars = 0
    for item in items:
        text_chars = len(item["masked"])
        if current and current_chars + text_chars > MAX_BATCH_CHARS:
            batches.append(current)
            current = []
            current_chars = 0
        current.append(item)
        current_chars += text_chars
    if current:
        batches.append(current)
    return batches

def mask_special_tokens(text: str):
    """
    Mask equations, formulas, URLs into <b0>, <b1> tokens.
    """
    token_map = {}
    counter = 0

    # Pattern for URLs
    url_pattern = r'https?://[^\s)\]]+'
    def replace_url(match):
        nonlocal counter
        tok = f"<b{counter}>"
        token_map[tok] = match.group(0)
        counter += 1
        return tok
    text = re.sub(url_pattern, replace_url, text)

    # Pattern for inline formulas / LaTeX $...$
    math_pattern = r'\$([^\$]+)\$'
    def replace_math(match):
        nonlocal counter
        tok = f"<b{counter}>"
        token_map[tok] = match.group(0)
        counter += 1
        return tok
    text = re.sub(math_pattern, replace_math, text)

    return text, token_map

def unmask_special_tokens(translated_text: str, token_map: dict) -> str:
    """
    Restore masked tokens back to their original formulas/URLs.
    """
    result = translated_text
    for token, original in token_map.items():
        token_num = token.replace("<b", "").replace(">", "")
        pattern = rf"<\s*b\s*{token_num}\s*>"
        result = re.sub(pattern, original, result, flags=re.IGNORECASE)
    return result

def extract_and_translate_segments(doc: fitz.Document, max_pages: int = 15, target_lang: str = "vi", api_key: str = None, base_url: str = None, model: str = None):
    """
    Trích xuất từng trang và các khối văn bản (blocks) kèm toạ độ và nội dung dịch song ngữ.
    """
    pages_data = []
    total_pages = min(len(doc), max_pages)

    page_items = []
    all_items = []
    for page_idx in range(total_pages):
        page = doc[page_idx]
        page_rect = page.rect
        blocks = page.get_text("blocks")  # (x0, y0, x1, y1, text, block_no, block_type)
        items = []
        for b in blocks:
            if b[6] == 0:  # text block
                original_text = b[4].strip()
                if not original_text:
                    continue
                masked_text, token_map = mask_special_tokens(original_text)
                item = {
                    "bbox": [round(b[0], 2), round(b[1], 2), round(b[2], 2), round(b[3], 2)],
                    "original": original_text,
                    "masked": masked_text,
                    "token_map": token_map,
                }
                items.append(item)
                all_items.append(item)
        page_items.append(items)
        pages_data.append({
            "pageNumber": page_idx + 1,
            "width": round(page_rect.width, 2),
            "height": round(page_rect.height, 2),
            "blocks": [],
        })

    batches = create_batches(all_items)
    def translate_batch(batch):
        return translate_text_batch(
            [item["masked"] for item in batch],
            target_lang=target_lang,
            api_key=api_key,
            base_url=base_url,
            model=model,
        )

    with ThreadPoolExecutor(max_workers=min(MAX_BATCH_WORKERS, len(batches) or 1)) as executor:
        translated_batches = list(executor.map(translate_batch, batches))

    for batch, translated_batch in zip(batches, translated_batches):
        for item, translated_raw in zip(batch, translated_batch):
            item["translated"] = unmask_special_tokens(translated_raw, item["token_map"])

    for page, items in zip(pages_data, page_items):
        page["blocks"] = [
            {"bbox": item["bbox"], "original": item["original"], "translated": item["translated"]}
            for item in items
        ]

    return {
        "totalPages": len(doc),
        "processedPages": total_pages,
        "pages": pages_data,
    }

