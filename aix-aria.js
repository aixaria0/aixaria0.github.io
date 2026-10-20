const providerUrl = new URL('./aix-aria-provider.js', import.meta.url);
providerUrl.search = new URL(import.meta.url).search;
const {MODEL_NAME, modelAvailable, generateWithAI, AIXProviderError} = await import(providerUrl.href);
const doc = document;
const root = doc.documentElement;
const isFa = root.lang === 'fa';
const base = isFa ? '../' : './';
const t = (en, fa) => isFa ? fa : en;
const faDigits = value => new Intl.NumberFormat('fa-IR').format(value);

const strings = {
  label: t('AIX Aria', 'AIX Aria'),
  subtitle: t('Sunaria intelligence', 'هوش ساناریا'),
  open: t('Ask AIX Aria', 'از AIX Aria بپرس'),
  close: t('Close AIX Aria', 'بستن AIX Aria'),
  placeholder: t('Ask me anything — about the projects or beyond…', 'هر سؤالی داری بپرس؛ دربارهٔ پروژه‌ها یا هر موضوع دیگر…'),
  send: t('Send', 'ارسال'),
  status: t('AIX Aria', 'AIX Aria'),
  loading: t('Reading the Sunaria knowledge map…', 'دارم نقشهٔ دانش ساناریا را می‌خوانم…'),
  welcome: t(
    'I’m AIX Aria. Ask me anything. I can also explain Sunaria’s projects using their published evidence and scope.',
    'من AIX Aria هستم. هر سؤالی داری بپرس. پروژه‌های ساناریا را هم با تکیه بر شواهد و دامنهٔ منتشرشده‌شان توضیح می‌دهم.'
  ),
  error: t('The local knowledge pack could not be loaded. The site itself is still available.', 'بستهٔ دانش محلی بارگذاری نشد. خود سایت همچنان در دسترس است.'),
  unknown: t(
    'The AI service is temporarily unavailable. I can still explain Sunaria’s published projects.',
    'سرویس هوش مصنوعی موقتاً در دسترس نیست؛ پروژه‌های منتشرشدهٔ ساناریا را همچنان می‌توانم توضیح بدهم.'
  ),
  settings: t('About AIX Aria', 'دربارهٔ AIX Aria'),
  settingsTitle: t('How AIX Aria answers', 'AIX Aria چطور پاسخ می‌دهد'),
  settingsIntro: t('Ask general questions freely. For Sunaria projects, answers use only the published project context and distinguish research from production.', 'هر سؤال عمومی را راحت بپرس. دربارهٔ پروژه‌های ساناریا، پاسخ به اطلاعات عمومی منتشرشده متکی است و پژوهش را از محصول عملیاتی جدا می‌کند.'),
  privacy: t('Your question, up to eight recent messages, and relevant public project context are sent to Pollinations for AI answers. No account, API key, or model download is required. Avoid sending sensitive information. The project guide remains available if the public service is busy.', 'پرسش، حداکثر هشت پیام اخیر و زمینهٔ عمومیِ مرتبط با پروژه برای پاسخ‌گویی به Pollinations فرستاده می‌شوند. به حساب، کلید یا دریافت مدل نیاز نداری. اطلاعات حساس نفرست. اگر سرویس عمومی مشغول باشد، راهنمای پروژه‌ها همچنان در دسترس است.'),
  coreStatus: t('AIX Core · always available', 'هستهٔ AIX · همیشه در دسترس'),
  extendedStatus: t('AIX Aria · online AI', 'AIX Aria · هوش آنلاین'),
  fallbackStatus: t('Project guide · AI temporarily unavailable', 'راهنمای پروژه‌ها · هوش آنلاین موقتاً قطع است'),

};

const quickPrompts = isFa ? [
  'RCHAIN-COMPLIER دقیقاً چه می‌کند؟',
  'CHIMERA-OMEGA و CHIMERA-ONE چه فرقی دارند؟',
  'آریا روی چه حوزه‌هایی کار می‌کند؟',
  'پروژه‌های کوانتومی را توضیح بده',
  'برای یادگیری سامانه‌های توزیع‌شده از کجا شروع کنم؟',
] : [
  'What exactly does RCHAIN-COMPLIER do?',
  'CHIMERA-OMEGA vs CHIMERA-ONE?',
  'What does Aria work on?',
  'Explain the quantum projects',
  'How should I start learning distributed systems?',
];

let memory = null;
let registry = null;
let knowledge = [];
let lastMatches = [];
let answerFa = isFa;
let knowledgeReady;
let conversation = [];
let generationBusy = false;

const faStop = new Set('از به در با برای که این آن را رو و یا یک چه چی چیه چیست کی چرا چطور چگونه میشه می شود میکند میکنه کرده کن درباره راجع توضیح بده بگو لطفا پروژه پروژه‌ها پروژه ها کار سیستم سامانه'.split(/\s+/));
const enStop = new Set('a an the and or of to in on for with about what which who why how is are was were does do did explain tell me project projects system systems please'.split(/\s+/));

function normalize(value='') {
  return String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ۀة]/g, 'ه')
    .replace(/[ًٌٍَُِّْـ]/g, '')
    .replace(/[-–—_/:|()[\]{}.,!?؟؛،+*#@"'`~\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const synonymSets = [
  ['rchain','رچین','آرچین'],
  ['rchain-complier','complier','کامپلایر','کامپلیر','کمپلایر'],
  ['rchain-sentinel','sentinel','سنتینل'],
  ['rholox','رولوکس'],
  ['chimera','چیمرا'],
  ['chimera-omega','omega','امگا'],
  ['chimera-one','چیمرا وان'],
  ['aether-runtime','aether','اتر','ایتر'],
  ['sovereign-lattice','pbft','سوورین'],
  ['nexus-quantum','nexus','نکسوس'],
  ['vqe','vqe-analyzer','وی کیو ای','وی‌کیو‌ای'],
  ['formal verification','formal methods','lean 4','اثبات صوری','روش صوری','صوری'],
  ['quantum','کوانتوم','کوانتومی','qiskit'],
  ['distributed systems','distributed','سیستم توزیع شده','سامانه توزیع شده','توزیع شده'],
  ['security','cybersecurity','امنیت','سایبری','red team','رد تیم'],
  ['osint','اوسینت','omni','اومنی'],
  ['aria','aria fani','aix aria','آریا','آریا فانی'],
  ['intelligence lattice','هوش جمعی','شبکه هوش','لتیس هوش'],
  ['shahnameh','shahnameh-lite','شاهنامه','شاهنامه لایت'],
];

function tokens(value) {
  const norm = normalize(value);
  const raw = norm.split(/\s+/).filter(Boolean);
  const stop = /[\u0600-\u06ff]/.test(norm) ? faStop : enStop;
  const out = new Set(raw.filter(x => x.length > 1 && !stop.has(x)));
  for (const group of synonymSets) {
    if (group.some(term => norm.includes(normalize(term)))) {
      for (const term of group) for (const token of normalize(term).split(' ')) if (token.length > 1) out.add(token);
    }
  }
  return out;
}

function safeUrl(value) {
  try {
    const u = new URL(value);
    if (u.protocol === 'https:' && ['github.com','sunaria.si','www.sunaria.si'].includes(u.hostname)) return u.href;
  } catch {}
  return null;
}

function mergeManualWithRegistry(item, byId) {
  const live = byId.get(item.id) || {};
  const tech = live.technologies || live.technology || live.languages || [];
  return {
    ...item,
    family: live.family || item.family || '',
    relation: live.relation || item.relation || '',
    status: live.status || item.status || '',
    technologies: Array.isArray(tech) ? tech.slice(0, 8) : [],
    repository_url: live.repository_url || item.repository_url || null,
    live_url: live.live_url || item.live_url || null,
    registry_description: live.description || live.summary || live.positioning || '',
  };
}

function buildKnowledge() {
  const publicCatalog = registry?.public_catalog || [];
  const siteProjects = registry?.projects || [];
  const siteById = new Map(siteProjects.map(x => [x.id, x]));
  const byId = new Map([...publicCatalog, ...siteProjects].map(x => [x.id, x]));
  const manual = [...(memory?.directions || []), ...(memory?.project_context || [])].map(x => mergeManualWithRegistry(x, byId));
  const seen = new Set(manual.map(x => x.id));
  const auto = publicCatalog.filter(x => x?.id && !seen.has(x.id)).map(x => {
    const detail = siteById.get(x.id) || {};
    return {
      id: x.id,
      title: detail.name || x.name || x.display_name || x.id,
      status: detail.status || x.status || '',
      family: detail.family || x.family || '',
      relation: detail.relation || x.relation || '',
      aliases: [detail.name, x.name, x.display_name, x.id].filter(Boolean),
      summary_en: detail.summary || detail.positioning || detail.description || x.description || x.note || '',
      summary_fa: detail.summary_fa || detail.summary || detail.positioning || detail.description || x.description || x.note || '',
      technologies: detail.technologies || detail.technology || x.languages || [],
      repository_url: detail.repository_url || x.repository_url || null,
      live_url: detail.live_url || x.live_url || null,
    };
  });
  const privateSafe = (registry?.private_projects || []).filter(x => x?.name).map(x => ({
    title: x.name,
    status: x.status,
    family: x.family,
    summary_en: x.description?.en || '',
    summary_fa: x.description?.fa || '',
  }));
  const identity = {
    id: 'aria-profile',
    title: memory?.profile?.name || 'Aria Fani',
    status: 'public technical profile',
    aliases: ['Aria','Aria Fani','AIX Aria','آریا','آریا فانی'],
    summary_en: memory?.profile?.summary_en || '',
    summary_fa: memory?.profile?.summary_fa || '',
    technologies: [],
    family: 'profile',
    relation: 'person',
  };
  knowledge = [identity, ...manual, ...auto, ...privateSafe].map(item => {
    const searchable = [item.id,item.title,item.status,item.family,item.relation,item.summary_en,item.summary_fa,item.registry_description,...(item.aliases||[]),...(item.technologies||[])].filter(Boolean).join(' ');
    return {...item, _norm: normalize(searchable), _tokens: tokens(searchable)};
  });
}

function scoreItem(item, query, qTokens) {
  const q = normalize(query);
  let score = 0;
  const title = normalize(item.title);
  const id = normalize(item.id);
  if (title && q.includes(title)) score += 28;
  if (id && q.includes(id)) score += 30;
  for (const alias of item.aliases || []) {
    const a = normalize(alias);
    if (a && q.includes(a)) score += 24 + Math.min(8, a.length / 5);
  }
  for (const token of qTokens) {
    if (item._tokens.has(token)) score += token.length > 5 ? 3.2 : 2;
    else if (item._norm.includes(token)) score += 1;
  }
  if (item.id === 'aria-profile' && /\b(who|aria|profile|background|engineer|researcher)\b/.test(q)) score += 7;
  if (item.id === 'aria-profile' && /آریا|کیه|کیست|پیشینه|رزومه|حوزه/.test(q)) score += 7;
  return score;
}

function rank(query, limit=5) {
  const qTokens = tokens(query);
  return knowledge
    .map(item => ({item, score: scoreItem(item, query, qTokens)}))
    .filter(x => x.score > 0)
    .sort((a,b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, limit);
}

function fmtStatus(item) {
  if (!item.status) return '';
  return answerFa ? `وضعیت: ${item.status}` : `Status: ${item.status}`;
}

function fmtTech(item) {
  if (!item.technologies?.length) return '';
  return answerFa ? `فناوری‌ها: ${item.technologies.join(' · ')}` : `Technologies: ${item.technologies.join(' · ')}`;
}

function projectAnswer(item) {
  const summary = answerFa ? item.summary_fa || item.summary_en : item.summary_en || item.summary_fa;
  const lines = [`${item.title}${item.status ? ` — ${item.status}` : ''}`, summary];
  const tech = fmtTech(item);
  if (tech) lines.push(tech);
  if (item.family && item.family !== 'profile') lines.push(answerFa ? `خانواده: ${item.family}` : `Family: ${item.family}`);
  return lines.filter(Boolean).join('\n\n');
}

function compareAnswer(a, b) {
  const as = answerFa ? a.summary_fa || a.summary_en : a.summary_en || a.summary_fa;
  const bs = answerFa ? b.summary_fa || b.summary_en : b.summary_en || b.summary_fa;
  if (answerFa) {
    return `تفاوت اصلی این دو در نقش معماری‌شان است:\n\n${a.title} — ${a.status || 'project'}\n${as}\n\n${b.title} — ${b.status || 'project'}\n${bs}\n\nاگر بخواهم خیلی فشرده بگویم: ${a.title} بیشتر در نقش «${a.relation || a.status || 'یک جزء مشخص'}» دیده می‌شود، درحالی‌که ${b.title} نقش «${b.relation || b.status || 'جزء دیگری از سیستم'}» را دارد.`;
  }
  return `The main difference is their architectural role:\n\n${a.title} — ${a.status || 'project'}\n${as}\n\n${b.title} — ${b.status || 'project'}\n${bs}\n\nIn short: ${a.title} is closer to “${a.relation || a.status || 'one system role'},” while ${b.title} is closer to “${b.relation || b.status || 'another system role'}.”`;
}

function profileAnswer() {
  const p = memory.profile;
  const summary = answerFa ? p.summary_fa : p.summary_en;
  const domains = p.domains.slice(0, 7).join(' · ');
  return answerFa
    ? `${summary}\n\nحوزه‌های اصلی: ${domains}\n\nشیوهٔ کار: ${p.communication_fa}`
    : `${summary}\n\nPrimary domains: ${domains}\n\nWorking style: ${p.communication_en}`;
}

function selfAnswer() {
  return answerFa
    ? `من AIX Aria هستم؛ رابط دانش Sunaria. پاسخ‌ها را از registry عمومی پروژه‌ها و یک بستهٔ background عمومی و پالایش‌شده می‌سازم. به مموری خصوصی ChatGPT، پیام‌های شخصی، credentialها یا اطلاعات حساس دسترسی ندارم و چیزی را که در زمینهٔ تأییدشده نیست حدس نمی‌زنم.`
    : `I’m AIX Aria, Sunaria’s knowledge interface. I answer from the public project registry and a curated public-safe background pack. I do not have access to private ChatGPT memory, private messages, credentials, or sensitive personal data, and I do not invent facts that are outside the verified context.`;
}

function projectsOverview(query) {
  const rows = (registry?.projects || []).filter(p => p.resume_priority < 999).sort((a,b) => a.resume_priority - b.resume_priority).slice(0, 6);
  const names = rows.length ? rows.map(p => p.name || p.id) : knowledge.filter(x => x.id !== 'aria-profile').slice(0, 6).map(x => x.title);
  const domain = normalize(query);
  let intro = answerFa ? 'برای شروع، این‌ها از پروژه‌های محوری Sunaria هستند:' : 'A good starting set of Sunaria projects is:';
  if (/quantum|کوانتوم|vqe|lean/.test(domain)) intro = answerFa ? 'محور کوانتوم و formal methods بیشتر دور این پروژه‌هاست:' : 'The quantum + formal-methods axis is concentrated around:';
  return `${intro}\n\n${names.map((name, i) => `${answerFa ? faDigits(i+1) : i+1}. ${name}`).join('\n')}\n\n${answerFa ? 'اسم هرکدام را بفرست تا دقیق‌تر بازش کنم.' : 'Name any one of them and I’ll break it down more precisely.'}`;
}

function localAnswer(query) {
  const q = normalize(query);
  const hasFa = /[\u0600-\u06ff]/.test(query);
  const hasLatin = /[A-Za-z]{2,}/.test(query);
  answerFa = hasFa || (!hasLatin && isFa);
  if (/تو کی هستی|تو چی هستی|خودت کی|what are you|who are you|aix aria چیست|aix aria چیه/.test(q)) {
    lastMatches = [];
    return {text:selfAnswer(), refs:[]};
  }
  if (/آریا کی|آریا چیست|درباره آریا|پیشینه آریا|aria fani|who is aria|about aria|aria background|what does aria work/.test(q)) {
    const item = knowledge.find(x => x.id === 'aria-profile');
    lastMatches = item ? [item] : [];
    return {text:profileAnswer(), refs:lastMatches};
  }

  const ranked = rank(query, 6);
  lastMatches = ranked.map(x => x.item);
  const compare = /تفاوت|فرق|مقایسه|در برابر| versus | vs |compare/.test(` ${q} `);
  if (compare && ranked.length >= 2 && ranked[1].score >= 6) return {text:compareAnswer(ranked[0].item, ranked[1].item), refs:ranked.slice(0,2).map(x=>x.item)};

  if (/پروژه ها|پروژه‌ها|همه پروژه|چه پروژه|projects|portfolio|what has aria built|کارها/.test(q) && (!ranked.length || ranked[0].score < 15)) {
    return {text:projectsOverview(query), refs:ranked.slice(0,3).map(x=>x.item)};
  }

  if (ranked.length && ranked[0].score >= 7) {
    const first = ranked[0].item;
    if (ranked.length > 1 && ranked[1].score >= ranked[0].score * .78 && ranked[1].score >= 9 && !q.includes(normalize(first.title))) {
      const intro = answerFa ? 'دو بخش از دانش Sunaria به سؤال تو نزدیک‌اند:' : 'Two Sunaria knowledge nodes are especially close to your question:';
      return {text:`${intro}\n\n${projectAnswer(first)}\n\n—\n\n${projectAnswer(ranked[1].item)}`, refs:ranked.slice(0,2).map(x=>x.item)};
    }
    return {text:projectAnswer(first), refs:[first]};
  }
  return {text:strings.unknown, refs:[]};
}

function verifiedIds(query, local) {
  const ids = [...rank(query, 6).map(x => x.item.id), ...(local?.refs || []).map(x => x.id)];
  if (/آریا|aria|profile|background|رزومه|پیشینه/.test(normalize(query))) ids.push('aria-profile');
  return [...new Set(ids.filter(Boolean))].slice(0, 6);
}

function providerErrorText(error) {
  const limited = error instanceof AIXProviderError && error.code === 'RATE_LIMITED';
  return answerFa
    ? (limited ? 'سرویس رایگان فعلاً شلوغ است؛ کمی بعد دوباره امتحان کن. راهنمای پروژه‌ها همچنان کار می‌کند.' : 'پاسخ‌گویی آنلاین فعلاً در دسترس نیست؛ کمی بعد دوباره امتحان کن. راهنمای پروژه‌ها همچنان کار می‌کند.')
    : (limited ? 'The free service is busy. Please try again shortly. The project guide still works.' : 'Online AI is temporarily unavailable. Please try again shortly. The project guide still works.');
}

function verifiedContext(query, local) {
  const ids = verifiedIds(query, local);
  const items = ids.map(id => knowledge.find(item => item.id === id)).filter(Boolean).slice(0, 5);
  return items.map(item => {
    const summary = answerFa ? item.summary_fa || item.summary_en : item.summary_en || item.summary_fa;
    return [
      `PROJECT: ${String(item.title || item.id).slice(0,120)}`,
      item.status ? `STATUS: ${String(item.status).slice(0,120)}` : '',
      summary ? `SUMMARY: ${String(summary).slice(0,900)}` : '',
      item.technologies?.length ? `TECHNOLOGIES: ${item.technologies.slice(0,8).join(', ')}` : '',
    ].filter(Boolean).join('\n');
  }).join('\n\n').slice(0, 4500);
}

async function extendedAnswer(query, local) {
  const controller = new AbortController();
  const text = await generateWithAI({
    history: conversation,
    prompt: query,
    context: verifiedContext(query, local),
    language: answerFa ? 'fa' : 'en',
    signal: controller.signal,
  });
  return {text, refs:local.refs || [], extended:true};
}

function setProviderStatus(mode, detail='') {
  if (!headStatus || !footMode) return;
  if (mode === 'extended') {
    headStatus.textContent = strings.extendedStatus;
    footMode.textContent = t('AIX EXTENDED','AIX توسعه‌یافته');
    footMode.dataset.mode = 'extended';
  } else if (mode === 'fallback') {
    headStatus.textContent = strings.fallbackStatus;
    footMode.textContent = t('CORE FALLBACK','هستهٔ جایگزین');
    footMode.dataset.mode = 'fallback';
  } else {
    headStatus.textContent = strings.coreStatus;
    footMode.textContent = t('AIX CORE','هستهٔ AIX');
    footMode.dataset.mode = 'core';
  }
  if (detail) providerNote.textContent = detail;
}

function element(tag, className, text) {
  const el = doc.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function addMessage(role, text, refs=[], mode='') {
  const wrap = element('div', `aix-message ${role}`);
  wrap.dir = /[\u0600-\u06ff]/.test(text) ? 'rtl' : 'ltr';
  const assistantLabel = mode === 'extended' ? 'AIX Aria · online AI' : mode === 'core' ? t('AIX Aria · project guide','AIX Aria · راهنمای پروژه‌ها') : 'AIX Aria';
  const label = element('span', 'aix-message-label', role === 'user' ? t('You','تو') : assistantLabel);
  const body = element('p', 'aix-message-body', text);
  wrap.append(label, body);
  if (refs.length) {
    const row = element('div', 'aix-message-refs');
    for (const item of refs.slice(0,3)) {
      const href = safeUrl(item.live_url) || safeUrl(item.repository_url);
      if (href) {
        const a = element('a', '', item.title);
        a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
        row.append(a);
      } else {
        const button = element('button', '', item.title);
        button.type = 'button';
        button.addEventListener('click', () => {
          const card = doc.querySelector(`[data-project="${CSS.escape(item.id)}"]`);
          if (card) { panel.hidden = true; launcher.setAttribute('aria-expanded','false'); card.scrollIntoView({behavior:'smooth',block:'center'}); }
        });
        row.append(button);
      }
    }
    wrap.append(row);
  }
  messages.append(wrap);
  messages.scrollTop = messages.scrollHeight;
}

function typing(on) {
  let node = messages.querySelector('.aix-typing');
  if (on && !node) {
    node = element('div', 'aix-message assistant aix-typing');
    node.append(element('span','aix-message-label','AIX Aria'));
    const dots = element('div','aix-dots'); dots.append(element('i'),element('i'),element('i')); node.append(dots);
    messages.append(node); messages.scrollTop = messages.scrollHeight;
  }
  if (!on && node) node.remove();
}

const launcher = element('button','aix-launcher');
launcher.type = 'button';
launcher.setAttribute('aria-expanded','false');
launcher.setAttribute('aria-controls','aix-aria-panel');
launcher.setAttribute('aria-label',strings.open);
const launchImg = element('img','aix-launcher-avatar');
launchImg.src = `${base}aix-aria-avatar.webp`; launchImg.alt=''; launchImg.width=54; launchImg.height=54;
const launchText = element('span','aix-launcher-copy'); launchText.append(element('b','',strings.label), element('small','',strings.subtitle));
const launchPulse = element('i','aix-launcher-pulse');
launcher.append(launchImg, launchText, launchPulse);

const panel = element('section','aix-panel');
panel.id = 'aix-aria-panel'; panel.hidden = true; panel.setAttribute('aria-label','AIX Aria');
const head = element('header','aix-head');
const headAvatar = element('img','aix-head-avatar'); headAvatar.src=`${base}aix-aria-avatar.webp`; headAvatar.alt=''; headAvatar.width=46; headAvatar.height=46;
const headCopy = element('div','aix-head-copy');
const headStatus = element('small','',strings.coreStatus);
headCopy.append(element('b','',strings.label), headStatus);
const settingsButton = element('button','aix-head-action'); settingsButton.type='button'; settingsButton.setAttribute('aria-label',strings.settings); settingsButton.setAttribute('aria-expanded','false');
settingsButton.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8 3.5-2.1-.8a7 7 0 0 0-.7-1.7l.9-2-1.6-1.6-2 .9a7 7 0 0 0-1.7-.7L12 4h-2l-.8 2.1a7 7 0 0 0-1.7.7l-2-.9-1.6 1.6.9 2a7 7 0 0 0-.7 1.7L2 12v2l2.1.8a7 7 0 0 0 .7 1.7l-.9 2 1.6 1.6 2-.9a7 7 0 0 0 1.7.7L10 20h2l.8-2.1a7 7 0 0 0 1.7-.7l2 .9 1.6-1.6-.9-2a7 7 0 0 0 .7-1.7L20 14v-2Z"/></svg>';
const close = element('button','aix-close','×'); close.type='button'; close.setAttribute('aria-label',strings.close);
head.append(headAvatar, headCopy, settingsButton, close);

const settingsPane = element('section','aix-settings'); settingsPane.hidden=true; settingsPane.setAttribute('aria-label',strings.settings);
const settingsTop = element('div','aix-settings-top');
settingsTop.append(element('p','aix-settings-kicker',t('AIX / MODEL LAYER','AIX / لایهٔ مدل')), element('h3','',strings.settingsTitle), element('p','aix-settings-intro',strings.settingsIntro));
const modelRow = element('div','aix-model-row'); modelRow.append(element('span','',t('Model','مدل')), element('b','',MODEL_NAME), element('em','',t('Free online service','سرویس آنلاین رایگان')));
const providerNote = element('p','aix-provider-note',t('Ask directly. No signup, API key, or model download.','مستقیم سؤال بپرس؛ بدون ثبت‌نام، کلید یا دریافت مدل.'));
const privacy = element('p','aix-settings-privacy',strings.privacy);
settingsPane.append(settingsTop,modelRow,providerNote,privacy);

const messages = element('div','aix-messages'); messages.setAttribute('aria-live','polite');
const quick = element('div','aix-quick');
for (const prompt of quickPrompts) {
  const chip = element('button','aix-chip',prompt); chip.type='button';
  chip.addEventListener('click',()=>{ input.value=prompt; submit(prompt); });
  quick.append(chip);
}
const form = element('form','aix-form');
const input = doc.createElement('textarea'); input.rows=2; input.maxLength=700; input.placeholder=strings.placeholder; input.setAttribute('aria-label',strings.placeholder);
const send = element('button','aix-send'); send.type='submit'; send.setAttribute('aria-label',strings.send);
send.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12 20 4l-5 16-3.5-6.5L4 12Zm7.5 1.5L20 4"/></svg>';
form.append(input,send);
const foot = element('div','aix-foot');
const footMode = element('span','aix-online','AIX ARIA');
footMode.dataset.mode = 'core';
foot.append(element('span','',t('Online AI via Pollinations · Public project context','هوش آنلاین با Pollinations · زمینهٔ عمومی پروژه‌ها')), footMode);
panel.append(head,settingsPane,messages,quick,form,foot);

doc.body.append(launcher,panel);

function setSettingsOpen(open) {
  settingsPane.hidden = !open;
  settingsButton.setAttribute('aria-expanded',String(open));
  if (open) {
    settingsButton.focus({preventScroll:true});
  } else setTimeout(()=>input.focus({preventScroll:true}),30);
}

function setOpen(open) {
  panel.hidden = !open;
  launcher.setAttribute('aria-expanded',String(open));
  launcher.setAttribute('aria-label',open?strings.close:strings.open);
  if (open) {
    if (!messages.childElementCount) addMessage('assistant',strings.welcome);
    setTimeout(()=>input.focus({preventScroll:true}),30);
  } else {
    settingsPane.hidden = true;
    settingsButton.setAttribute('aria-expanded','false');
    launcher.focus({preventScroll:true});
  }
}
launcher.addEventListener('click',()=>setOpen(panel.hidden));
settingsButton.addEventListener('click',()=>setSettingsOpen(settingsPane.hidden));
close.addEventListener('click',()=>setOpen(false));
doc.addEventListener('keydown',event=>{
  if (event.key !== 'Escape' || panel.hidden) return;
  if (!settingsPane.hidden) setSettingsOpen(false); else setOpen(false);
});
input.addEventListener('keydown',event=>{ if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();form.requestSubmit();} });

async function submit(forced) {
  const query = (forced || input.value).trim();
  if (!query || generationBusy) return;
  generationBusy = true;
  input.value='';
  input.disabled=true;
  send.disabled=true;
  quick.hidden=true;
  addMessage('user',query);
  typing(true);
  await knowledgeReady;
  await new Promise(resolve=>setTimeout(resolve,100));
  const local = localAnswer(query);
  let answer = local;
  let mode = 'core';
  try {
    if (modelAvailable) {
      answer = await extendedAnswer(query,local);
      mode = 'extended';
      setProviderStatus('extended');
    } else setProviderStatus('core');
  } catch (error) {
    console.warn('AIX Aria extended mode fallback',error?.code || error?.message || error);
    answer = local.refs?.length ? local : {text: providerErrorText(error), refs: []};
    mode = 'core';
    setProviderStatus('fallback',providerErrorText(error));
  } finally {
    typing(false);
    addMessage('assistant',answer.text,answer.refs,mode);
    conversation.push({role:'user',text:query},{role:'model',text:answer.text});
    if (conversation.length > 10) conversation = conversation.slice(-10);
    generationBusy=false;
    input.disabled=false;
    send.disabled=false;
    input.focus({preventScroll:true});
  }
}
form.addEventListener('submit',event=>{event.preventDefault();submit();});

async function loadKnowledge() {
  try {
    const [m,r] = await Promise.all([
      fetch(`${base}data/aix-aria.public.json`,{credentials:'omit',cache:'no-cache'}).then(x=>{if(!x.ok)throw Error('memory '+x.status);return x.json()}),
      fetch(`${base}data/registry.json`,{credentials:'omit',cache:'no-cache'}).then(x=>{if(!x.ok)throw Error('registry '+x.status);return x.json()}),
    ]);
    memory=m; registry=r; buildKnowledge();
  } catch (error) {
    console.error('AIX Aria knowledge load failed',error);
    memory={profile:{summary_en:'',summary_fa:'',domains:[],communication_en:'',communication_fa:''},directions:[],project_context:[]};
    registry={projects:[]}; knowledge=[];
    if (!messages.childElementCount) addMessage('assistant',strings.error);
  }
}
knowledgeReady = loadKnowledge();
