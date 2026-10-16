export const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export class AIXProviderError extends Error {
  constructor(message, status = 0, code = 'PROVIDER_ERROR') {
    super(message);
    this.name = 'AIXProviderError';
    this.status = status;
    this.code = code;
  }
}

function extractText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map(part => typeof part?.text === 'string' ? part.text : '').join('').trim();
}

function providerCode(status, payload) {
  const reason = payload?.error?.details?.find?.(item => item?.reason)?.reason;
  if (reason) return reason;
  if (status === 429) return 'QUOTA_EXHAUSTED';
  if (status === 401 || status === 403) return 'NOT_AUTHORIZED';
  if (status === 400) return 'INVALID_REQUEST';
  return `HTTP_${status || 0}`;
}

export async function generateWithGemini({apiKey, systemInstruction, history = [], prompt, signal}) {
  const key = String(apiKey || '').trim();
  if (!key) throw new AIXProviderError('No Gemini API key is configured.', 0, 'NO_KEY');

  const contents = history.slice(-6).map(turn => ({
    role: turn.role === 'model' ? 'model' : 'user',
    parts: [{text: String(turn.text || '').slice(0, 5000)}],
  }));
  contents.push({role:'user', parts:[{text:String(prompt || '').slice(0, 14000)}]});

  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify({
        systemInstruction: {parts:[{text:String(systemInstruction || '').slice(0, 12000)}]},
        contents,
        generationConfig: {
          temperature: 0.35,
          topP: 0.9,
          maxOutputTokens: 800,
        },
      }),
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw new AIXProviderError('The model request timed out.', 0, 'TIMEOUT');
    throw new AIXProviderError('The model service could not be reached.', 0, 'NETWORK_ERROR');
  }

  let payload = null;
  try { payload = await response.json(); } catch {}
  if (!response.ok) {
    const message = payload?.error?.message || `Gemini returned HTTP ${response.status}.`;
    throw new AIXProviderError(message, response.status, providerCode(response.status, payload));
  }

  const text = extractText(payload);
  if (!text) {
    const finish = payload?.candidates?.[0]?.finishReason;
    throw new AIXProviderError(`No text response was returned${finish ? ` (${finish})` : ''}.`, response.status, 'EMPTY_RESPONSE');
  }
  return text;
}
