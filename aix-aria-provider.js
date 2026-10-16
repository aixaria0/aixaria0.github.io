export const MODEL_NAME = 'Qwen3 0.6B · ONNX Community';
export const MODEL_ID = 'onnx-community/Qwen3-0.6B-DQ-ONNX';
export const MODEL_DOWNLOAD = 'about 370 MB';
export const modelAvailable = true;

export class AIXProviderError extends Error {
  constructor(message, code = 'MODEL_ERROR') {
    super(message);
    this.name = 'AIXProviderError';
    this.code = code;
  }
}

let generatorPromise;

async function loadGenerator(onProgress) {
  if (!globalThis.navigator?.gpu) {
    throw new AIXProviderError('This browser does not expose WebGPU.', 'WEBGPU_UNAVAILABLE');
  }
  if (!generatorPromise) {
    generatorPromise = (async () => {
      const {pipeline, env} = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1');
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      return pipeline('text-generation', MODEL_ID, {
        device: 'webgpu',
        dtype: 'q4f16',
        progress_callback: event => {
          if (event?.status === 'progress' && Number.isFinite(event.progress)) {
            onProgress?.(Math.max(0, Math.min(100, Math.round(event.progress))));
          }
        },
      });
    })().catch(error => {
      generatorPromise = null;
      throw new AIXProviderError(error?.message || 'The local model could not be loaded.', 'MODEL_LOAD_FAILED');
    });
  }
  return generatorPromise;
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

export async function generateWithLocalModel({history = [], prompt, context = '', language = 'en', signal, onProgress}) {
  if (signal?.aborted) throw new AIXProviderError('The request was cancelled.', 'ABORTED');
  const generator = await loadGenerator(onProgress);
  if (signal?.aborted) throw new AIXProviderError('The request was cancelled.', 'ABORTED');
  let output;
  try {
    output = await generator(makeMessages({history, prompt, context, language}), {
      max_new_tokens: 240,
      do_sample: true,
      temperature: 0.45,
      top_p: 0.82,
      repetition_penalty: 1.08,
    });
  } catch (error) {
    throw new AIXProviderError(error?.message || 'Local generation failed.', 'GENERATION_FAILED');
  }
  const result = output?.[0]?.generated_text;
  const text = (Array.isArray(result) ? result.at(-1)?.content : result)?.trim?.();
  const cleaned = typeof text === 'string' ? text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim() : '';
  if (!cleaned) throw new AIXProviderError('No answer was returned by the local model.', 'EMPTY_RESPONSE');
  return cleaned.slice(0, 5000);
}
