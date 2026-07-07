import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { message } = await request.json();
  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    return NextResponse.json(
      { reply: 'Tính năng AI trợ giảng đang tạm khóa vì chưa cấu hình mã API (AI_API_KEY). Hãy liên hệ Admin để thêm mã này nhé!' },
      { status: 200 },
    );
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'Bạn là trợ lý học tập cho sinh viên CMC NetWork. Trả lời ngắn gọn, rõ ràng bằng tiếng Việt.',
        },
        { role: 'user', content: message },
      ],
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ reply: 'AI đang lỗi kết nối. Vui lòng thử lại sau.' }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json({ reply: data.choices?.[0]?.message?.content || 'AI không trả về nội dung.' });
}
