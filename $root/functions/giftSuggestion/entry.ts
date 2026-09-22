import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { waitUntil } from 'base44:runtime';

export default async function(req) {
  try {
    const BKW = createClientFromRequest(req);
    const body = await req.json();
    const occasion = (body.occasion || '').toString().slice(0, 300);
    const recipient = (body.recipient || '').toString().slice(0, 300);
    const budgetRaw = body.budget;
    const budget = budgetRaw && !isNaN(Number(budgetRaw)) ? Number(budgetRaw) : null;

    const products = await BKW.asServiceRole.entities.Product.list('-created_date', 60);
    const productList = products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.base_price,
      description: p.short_description || ''
    }));

    if (productList.length === 0) {
      return Response.json({ suggestions: [], message: 'Chưa có sản phẩm nào trong cửa hàng.' });
    }

    const budgetText = budget ? `ngân sách khoảng ${budget}k VND` : 'không giới hạn ngân sách';
    const prompt =
      `Bạn là trợ lý tư vấn quà tặng cho cửa hàng MakeMine (quà tặng cá nhân hoá cho học sinh, sinh viên, người trẻ). ` +
      `Dựa trên yêu cầu của khách: dịp tặng "${occasion}", người nhận "${recipient}", ${budgetText}. ` +
      `Hãy chọn 3-5 sản phẩm phù hợp nhất từ danh sách sau: ${JSON.stringify(productList)}. ` +
      `Với mỗi sản phẩm, viết lý do phù hợp trong 1 câu ngắn gọn, thân thiện, hướng tới đối tượng trẻ. ` +
      `Trả lời CHỈ bằng JSON, không kèm giải thích thêm.`;

    const llmRes = await BKW.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                product_id: { type: 'string' },
                ly_do: { type: 'string' }
              },
              required: ['product_id', 'ly_do']
            }
          }
        },
        required: ['suggestions']
      }
    });

    let suggestions = [];
    if (Array.isArray(llmRes)) suggestions = llmRes;
    else if (llmRes && Array.isArray(llmRes.suggestions)) suggestions = llmRes.suggestions;
    else if (llmRes && typeof llmRes === 'string') {
      try {
        const parsed = JSON.parse(llmRes);
        suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions || [];
      } catch (e) {
        suggestions = [];
      }
    }

    const validIds = new Set(productList.map((p) => p.id));
    suggestions = suggestions
      .filter((s) => s && s.product_id && validIds.has(s.product_id))
      .slice(0, 5);

    const userQuery = [occasion, recipient, budget ? budget + 'k' : ''].filter(Boolean).join(' | ');
    waitUntil(
      BKW.asServiceRole.entities.ChatSuggestion.create({
        user_query: userQuery,
        occasion,
        recipient,
        budget: budget || null,
        suggested_product_ids: suggestions.map((s) => s.product_id),
        suggestions
      }).catch(() => {})
    );

    return Response.json({ suggestions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}