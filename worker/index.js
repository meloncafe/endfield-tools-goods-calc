// Worker entry point: handles /api/ocr + static assets fallback

const RATE_LIMIT_WINDOW = 60_000; // 1 minute in ms
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const timestamps = rateLimitMap.get(ip).filter(t => t > windowStart);
  rateLimitMap.set(ip, timestamps);

  if (timestamps.length >= RATE_LIMIT_MAX) return false;
  timestamps.push(now);
  return true;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Test-Token',
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}

async function handleOcr(request, env) {
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Auth
  const testToken = env.TEST_TOKEN;
  const providedToken = request.headers.get('X-Test-Token');
  if (!testToken || providedToken !== testToken) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // Rate limit
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!checkRateLimit(ip)) {
    return jsonResponse({ error: 'Rate limit exceeded. Try again in 1 minute.' }, 429);
  }

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { image, lang = 'en' } = body;
  if (!image) {
    return jsonResponse({ error: 'Missing "image" field (base64)' }, 400);
  }

  // ~1MB base64 limit
  if (image.length > 1_400_000) {
    return jsonResponse({ error: 'Image too large. Max 1MB.' }, 413);
  }

  const geminiKey = env.GEMINI_API_KEY;
  if (!geminiKey) {
    return jsonResponse({ error: 'Server misconfiguration: missing API key' }, 500);
  }

  // Language hints
  const langHints = {
    ko: '한국어 게임 UI입니다. 아이템명을 한국어로 추출하세요.',
    en: 'English game UI. Extract item names in English.',
    ja: '日本語のゲームUIです。アイテム名を日本語で抽出してください。',
    zh: '中文游戏UI。请用中文提取物品名称。',
  };

  const prompt = `You are an OCR assistant for the game "Arknights: Endfield".
${langHints[lang] || langHints.en}

Extract ALL tradeable items visible in this trading post / shop screenshot.
For each item, extract:
- "name": the item name as shown in the UI
- "buyPrice": the purchase/cost price (number only, no currency symbols)
- "sellPrice": the sell price if visible (number only), or null if not shown

Return ONLY valid JSON, no markdown fences, no explanation:
{"items": [{"name": "...", "buyPrice": 123, "sellPrice": 456}, ...]}

If no items are found or the image is not a game screenshot, return:
{"items": [], "error": "No tradeable items found"}`;

  // Parse mime type
  let mimeType = 'image/png';
  let base64Data = image;
  if (image.startsWith('data:')) {
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    }
  }

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64Data } },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API error:', errText);
      return jsonResponse({ error: 'Gemini API error', detail: geminiResponse.status }, 502);
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return jsonResponse({ error: 'Failed to parse Gemini response', raw: cleaned }, 500);
    }

    return jsonResponse(parsed);
  } catch (err) {
    console.error('OCR error:', err);
    return jsonResponse({ error: 'Internal server error', detail: err.message }, 500);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API routes
    if (url.pathname === '/api/ocr') {
      return handleOcr(request, env);
    }

    // Everything else: static assets
    return env.ASSETS.fetch(request);
  },
};
