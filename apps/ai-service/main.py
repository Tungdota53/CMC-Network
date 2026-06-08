from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="CampusConnect AI Assistant", version="1.0")

class AskRequest(BaseModel):
    question: str
    user_id: str

@app.get("/")
def read_root():
    return {"status": "AI Service is running"}

@app.post("/api/v1/ask")
def ask_ai(request: AskRequest):
    # Giả lập xử lý AI (Tóm tắt tài liệu, trả lời học tập, v.v.)
    # Trong thực tế, bạn sẽ tích hợp OpenAI API hoặc Langchain ở đây.
    return {
        "answer": f"Đây là câu trả lời tự động cho câu hỏi '{request.question}' của bạn.",
        "user_id": request.user_id
    }

class SummarizeRequest(BaseModel):
    text: str

@app.post("/api/v1/summarize")
def summarize_text(request: SummarizeRequest):
    # Mock AI summarization logic
    content = request.text
    if len(content) > 200:
        summary = f"[AI Tóm tắt] Tài liệu dài {len(content)} ký tự. Ý chính: {content[:150]}..."
    else:
        summary = f"[AI Tóm tắt] {content}"
    return {"summary": summary}
class ContentRequest(BaseModel):
    text: str

@app.post("/api/v1/generate-flashcards")
def generate_flashcards(request: ContentRequest):
    return {
        "flashcards": [
            {"front": "Khái niệm chính trong tài liệu này là gì?", "back": "Nội dung tổng quát của văn bản."},
            {"front": "Điểm quan trọng 1", "back": "Giải thích chi tiết điểm quan trọng 1."},
            {"front": "Điểm quan trọng 2", "back": "Giải thích chi tiết điểm quan trọng 2."}
        ]
    }

@app.post("/api/v1/generate-quiz")
def generate_quiz(request: ContentRequest):
    return {
        "questions": [
            {
                "question": "Theo tài liệu, phát biểu nào sau đây là đúng?",
                "options": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
                "correct_answer": "Lựa chọn A",
                "explanation": "Lựa chọn A đúng vì..."
            }
        ]
    }

@app.post("/api/v1/generate-study-plan")
def generate_study_plan(request: ContentRequest):
    return {
        "plan": [
            {"day": "Ngày 1", "topic": "Giới thiệu và khái niệm cơ bản", "duration": "2 giờ"},
            {"day": "Ngày 2", "topic": "Đi sâu vào chủ đề chính", "duration": "3 giờ"},
            {"day": "Ngày 3", "topic": "Ôn tập và làm bài kiểm tra", "duration": "2 giờ"}
        ]
    }
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
