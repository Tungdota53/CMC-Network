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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
