export const MODEL_NAME = 'GPT-OSS 20B · Pollinations';
export const API_URL = 'https://text.pollinations.ai/openai';
export const modelAvailable = true;

export class AIXProviderError extends Error {
  constructor(message, code = 'PROVIDER_ERROR') {
    super(message);
    this.name = 'AIXProviderError';
    this.code = code;
  }
}

export function makeMessages({history = [], prompt, context = '', language = 'en'}) {
  const persian = language === 'fa';
  const system = persian
    ? `تو AIX Aria هستی، دستیار عمومی سایت Sunaria. پرسش‌های عمومی را مستقیم و مفید پاسخ بده. به فارسی روان و طبیعی پاسخ بده و شناسه‌های فنی و نام پروژه‌ها را دقیق نگه دار. دربارهٔ آریا، ساناریا یا پروژه‌هایشان فقط از بخش «زمینهٔ عمومیِ تأییدشده» استفاده کن؛ اگر اطلاعات کافی نیست، روشن بگو که دادهٔ عمومیِ تأییدشده در دسترس نیست و حدس نزن. ادعای پژوهش، نمونهٔ اولیه و محصول عملیاتی را با هم یکی نکن. به اطلاعات خصوصی یا حافظهٔ خصوصی دسترسی نداری. کوتاه، دقیق و دوستانه پاسخ بده. استدلال پنهان را نمایش نده.\n\nزمینهٔ عمومیِ تأییدشده:\n${context || 'برای این پرسش، زمینهٔ تأییدشده‌ای از پروژه‌های سایت وجود ندارد.'}`
    : `You are AIX Aria, the general assistant on Sunaria. Answer general questions directly and usefully. For facts about Aria, Sunaria, or their projects, use only the VERIFIED PUBLIC CONTEXT below; if it is insufficient, say so and do not guess. Keep research, prototypes, and production systems distinct. You have no access to private information or private memory. Be concise, accurate, and conversational. Do not reveal hidden reasoning.\n\nVERIFIED PUBLIC CONTEXT:\n${context || 'No verified Sunaria project context applies to this question.'}`;
  const turns = history.slice(-8).filter(turn => turn && ['user','assistant','model'].includes(turn.role) && typeof turn.text === 'string')
    .map(turn => ({role: turn.role === 'model' ? 'assistant' : turn.role, content: turn.text.slice(0, 800)}));
  turns.push({role: 'user', content: String(prompt || '').slice(0, 700)});
  return [{role:'system',content:system}, ...turns];
}

export async function generateWithAI({history = [], prompt, context = '', language = 'en', signal}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, {once:true});
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 35000);
  try {
    const response = await fetch(API_URL, {
      method:'POST', mode:'cors', credentials:'omit', cache:'no-store',
      referrerPolicy:'no-referrer', signal:controller.signal,
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'openai-fast', messages:makeMessages({history,prompt,context,language}),
        stream:false, temperature:0.4, max_tokens:800,
      }),
    });
    if (!response.ok) throw new AIXProviderError('The public AI service is unavailable.', response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) throw new AIXProviderError('The AI service returned no answer.', 'EMPTY_RESPONSE');
    return text.trim().slice(0,7000);
  } catch (error) {
    if (error instanceof AIXProviderError) throw error;
    throw new AIXProviderError('The public AI service could not be reached.', controller.signal.aborted ? 'TIMEOUT' : 'NETWORK_ERROR');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
