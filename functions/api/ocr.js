// Cloudflare Pages Function: POST /api/ocr
// Accepts game screenshot, returns parsed item prices via Gemini Flash

const RATE_LIMIT_WINDOW = 60; // seconds
const RATE_LIMIT_MAX = 5; // requests per window

// Rate limiting using CF KV (fallback: in-memory per isolate)
const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW * 1000;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const timestamps = rateLimitMap.get(ip).filter(t => t > windowStart);
  rateLimitMap.set(ip, timestamps);

  if (timestamps.length >= RATE_LIMIT_MAX) {
    return false;
  }

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

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const headers = corsHeaders();
  headers['Content-Type'] = 'application/json';

  // Auth check
  const testToken = env.TEST_TOKEN;
  const providedToken = request.headers.get('X-Test-Token');

  if (!testToken || providedToken !== testToken) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers }
    );
  }

  // Rate limit
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Try again in 1 minute.' }),
      { status: 429, headers }
    );
  }

  // Parse request
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers }
    );
  }

  const { image, lang = 'en' } = body;

  if (!image) {
    return new Response(
      JSON.stringify({ error: 'Missing "image" field (base64)' }),
      { status: 400, headers }
    );
  }

  // Validate base64 size (~1MB limit after encoding)
  if (image.length > 1_400_000) {
    return new Response(
      JSON.stringify({ error: 'Image too large. Max 1MB.' }),
      { status: 413, headers }
    );
  }

  // Gemini API call
  const geminiKey = env.GEMINI_API_KEY;
  if (!geminiKey) {
    return new Response(
      JSON.stringify({ error: 'Server misconfiguration: missing API key' }),
      { status: 500, headers }
    );
  }

  const langHints = {
    ko: '한국어 게임 UI입니다. 아이템명을 한국어로 추출하세요.',
    en: 'English game UI. Extract item names in English.',
    ja: '日本語のゲームUIです。アイテム名を日本語で抽出してください。',
    zh: '中文游戏UI。请用中文提取物品名称。',
  };

  const langHint = langHints[lang] || langHints.en;

  const prompt = `You are an OCR assistant for the game "Arknights: Endfield".
${langHint}

Extract ALL tradeable items visible in this trading post / shop screenshot.
For each item, extract:
- "name": the item name as shown in the UI
- "buyPrice": the purchase/cost price (number only, no currency symbols)
- "sellPrice": the sell price if visible (number only), or null if not shown

Return ONLY valid JSON, no markdown fences, no explanation:
{"items": [{"name": "...", "buyPrice": 123, "sellPrice": 456}, ...]}

If no items are found or the image is not a game screenshot, return:
{"items": [], "error": "No tradeable items found"}`;

  // Detect mime type from base64 header or default to png
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
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
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
      return new Response(
        JSON.stringify({ error: 'Gemini API error', detail: geminiResponse.status }),
        { status: 502, headers }
      );
    }

    const geminiData = await geminiResponse.json();

    // Extract text from Gemini response
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response (strip markdown fences if present)
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Failed to parse Gemini response', raw: cleaned }),
        { status: 500, headers }
      );
    }

    return new Response(
      JSON.stringify(parsed),
      { status: 200, headers }
    );

  } catch (err) {
    console.error('OCR processing error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: err.message }),
      { status: 500, headers }
    );
  }
}
