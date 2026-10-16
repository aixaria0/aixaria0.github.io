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
  placeholder: t('Ask about a project, architecture, or Aria…', 'دربارهٔ پروژه، معماری یا آریا بپرس…'),
  send: t('Send', 'ارسال'),
  status: t('AIX Core · always available', 'هستهٔ AIX · همیشه در دسترس'),
  loading: t('Reading the Sunaria knowledge map…', 'دارم نقشهٔ دانش ساناریا را می‌خوانم…'),
  welcome: t(
    'I’m AIX Aria — Sunaria’s project intelligence. Ask me about the architecture, project relationships, research boundaries, or Aria’s public technical background.',
    'من AIX Aria هستم؛ رابط دانش پروژه‌های Sunaria. دربارهٔ معماری، رابطهٔ پروژه‌ها، مرزهای پژوهش یا پیشینهٔ فنی عمومی آریا ازم بپرس.'
  ),
  error: t('The local knowledge pack could not be loaded. The site itself is still available.', 'بستهٔ دانش محلی بارگذاری نشد. خود سایت همچنان در دسترس است.'),
  unknown: t(
    'I don’t have enough verified public context to answer that confidently. Try naming a project, architecture, or technical domain from this site.',
    'برای جواب مطمئن، زمینهٔ عمومیِ تأییدشدهٔ کافی ندارم. اسم یک پروژه، معماری یا حوزهٔ فنی همین سایت را بگو.'
  ),
};

const quickPrompts = isFa ? [
  'RCHAIN-COMPLIER دقیقاً چه می‌کند؟',
  'CHIMERA-OMEGA و CHIMERA-ONE چه فرقی دارند؟',
  'آریا روی چه حوزه‌هایی کار می‌کند؟',
  'پروژه‌های کوانتومی را توضیح بده',
] : [
  'What exactly does RCHAIN-COMPLIER do?',
  'CHIMERA-OMEGA vs CHIMERA-ONE?',
  'What does Aria work on?',
  'Explain the quantum projects',
];

let memory = null;
let registry = null;
let knowledge = [];
let lastMatches = [];
let answerFa = isFa;

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
    .replace(/[–—_/:|()[\]{}.,!?؟؛،+*#@"'`~\\]/g, ' ')
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
  const privateSafe = (registry?.private_projects || []).filter(x => x?.id && !seen.has(x.id)).map(x => ({
    id: x.id,
    title: x.name || x.id,
    status: x.status || 'private research index',
    family: x.family || '',
    relation: x.relation || '',
    aliases: [x.name, x.id].filter(Boolean),
    summary_en: `A private project identity indexed by Sunaria. Public details are intentionally limited to its family, relation, and status.`,
    summary_fa: `یک هویت پروژهٔ خصوصی در فهرست Sunaria. جزئیات عمومی عمداً به خانواده، رابطه و وضعیت پروژه محدود شده‌اند.`,
    technologies: [],
    repository_url: null,
    live_url: x.live_url || null,
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
  return {text:answerFa ? 'برای جواب مطمئن، زمینهٔ عمومیِ تأییدشدهٔ کافی ندارم. اسم یک پروژه، معماری یا حوزهٔ فنی همین سایت را بگو.' : 'I don’t have enough verified public context to answer that confidently. Try naming a project, architecture, or technical domain from this site.', refs:[]};
}

function element(tag, className, text) {
  const el = doc.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function addMessage(role, text, refs=[]) {
  const wrap = element('div', `aix-message ${role}`);
  wrap.dir = /[\u0600-\u06ff]/.test(text) ? 'rtl' : 'ltr';
  const label = element('span', 'aix-message-label', role === 'user' ? t('You','تو') : 'AIX Aria');
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
const headCopy = element('div','aix-head-copy'); headCopy.append(element('b','',strings.label), element('small','',strings.status));
const close = element('button','aix-close','×'); close.type='button'; close.setAttribute('aria-label',strings.close);
head.append(headAvatar, headCopy, close);

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
const foot = element('div','aix-foot'); foot.append(element('span','',t('Verified public context only','فقط زمینهٔ عمومیِ تأییدشده')), element('span','aix-online',t('AIX CORE','هستهٔ AIX')));
panel.append(head,messages,quick,form,foot);

doc.body.append(launcher,panel);

function setOpen(open) {
  panel.hidden = !open;
  launcher.setAttribute('aria-expanded',String(open));
  launcher.setAttribute('aria-label',open?strings.close:strings.open);
  if (open) { if (!messages.childElementCount) addMessage('assistant',strings.welcome); setTimeout(()=>input.focus({preventScroll:true}),30); }
  else launcher.focus({preventScroll:true});
}
launcher.addEventListener('click',()=>setOpen(panel.hidden));
close.addEventListener('click',()=>setOpen(false));
doc.addEventListener('keydown',event=>{ if(event.key==='Escape'&&!panel.hidden)setOpen(false); });
input.addEventListener('keydown',event=>{ if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();form.requestSubmit();} });

async function submit(forced) {
  const query = (forced || input.value).trim();
  if (!query) return;
  input.value='';
  quick.hidden=true;
  addMessage('user',query);
  typing(true);
  await new Promise(resolve=>setTimeout(resolve,120));
  const answer = localAnswer(query);
  typing(false);
  addMessage('assistant',answer.text,answer.refs);
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
loadKnowledge();
