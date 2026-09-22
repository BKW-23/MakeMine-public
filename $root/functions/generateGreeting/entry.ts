import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const BKW = createClientFromRequest(req);
    const user = await BKW.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const recipient = (body.recipient || '').toString().trim().slice(0, 60);
    const relationship = (body.relationship || '').toString().trim().slice(0, 60);
    const occasion = (body.occasion || '').toString().trim().slice(0, 80);
    const hobbies = (body.hobbies || '').toString().trim().slice(0, 160);
    const keywords = (body.keywords || '').toString().trim().slice(0, 160);
    const productName = (body.productName || '').toString().trim().slice(0, 80);

    if (!recipient && !relationship && !occasion) {
      return Response.json({ error: 'Thiếu thông tin để tạo lời chúc.' }, { status: 400 });
    }

    const prompt = `Bạn là chuyên gia viết lời chúc quà tặng cá nhân hoá cho thương hiệu MakeMine (Việt Nam).
Hãy viết 3 lời chúc ngọt ngào, chân thành, phù hợp để khắc/in lên sản phẩm quà tặng${productName ? ` (sản phẩm: "${productName}")` : ''}.

Thông tin:
- Người nhận: ${recipient || "(không rõ)"}
- Mối quan hệ: ${relationship || "(không rõ)"}
- Dịp tặng: ${occasion || "(không rõ)"}
- Sở thích người nhận: ${hobbies || "(không rõ)"}
- Từ khoá/tone mong muốn: ${keywords || "(tự do)"}

Yêu cầu:
- Mỗi lời chúc 20–60 ký tự, tiếng Việt tự nhiên, có dấu.
- Mỗi lời chúc mang sắc thái khác nhau (ví dụ: dễ thương, chân thành, hài hước nhẹ).
- Không dùng emoji, không dấu ngoặc kép, không xuống dòng trong lời chúc.
- Trả về JSON theo schema.`;

    const res = await BKW.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          greetings: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["greetings"]
      }
    });

    let greetings = [];
    if (Array.isArray(res?.greetings)) greetings = res.greetings;
    else if (Array.isArray(res)) greetings = res;
    else if (typeof res === "string") {
      try { greetings = JSON.parse(res).greetings || []; } catch { greetings = []; }
    }

    greetings = greetings
      .map((g) => (typeof g === "string" ? g.trim().replace(/^["'\s]+|["'\s]+$/g, "") : ""))
      .filter(Boolean)
      .slice(0, 3);

    if (!greetings.length) {
      return Response.json({ error: 'AI không tạo được lời chúc, vui lòng thử lại.' }, { status: 502 });
    }

    return Response.json({ greetings });
  } catch (error) {
    return Response.json({ error: error.message || 'Lỗi máy chủ' }, { status: 500 });
  }
}