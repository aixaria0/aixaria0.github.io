const fa = document.documentElement.lang === 'fa';
const label = (en, persian) => fa ? persian : en;
const entries = [...document.querySelectorAll('.directory-entry')];
const input = document.querySelector('#repo-search');
const scope = document.querySelector('#repo-scope');
const more = document.querySelector('#directory-more');
const count = document.querySelector('#directory-count');
let showAll = false;
function filterDirectory() {
  const query = input.value.trim().toLocaleLowerCase();
  const matches = entries.filter(entry =>
    (!query || entry.dataset.repoSearch.includes(query)) &&
    (scope.value === 'all' || entry.dataset.language === scope.value)
  );
  const filtered = Boolean(query) || scope.value !== 'all';
  const visible = new Set(filtered || showAll ? matches : matches.slice(0, 9));
  for (const entry of entries) entry.hidden = !visible.has(entry);
  const n = matches.length.toLocaleString(fa ? 'fa-IR' : 'en-GB');
  count.textContent = label(`${n} ${matches.length === 1 ? "repository" : "repositories"}`, `${n} مخزن`);
  more.hidden = filtered || matches.length <= 9;
  more.textContent = showAll ? label('Show fewer ↑', 'نمایش کمتر ↑') : label(`Show all ${n} repositories ↓`, `نمایش هر ${n} مخزن ↓`);
  more.setAttribute('aria-expanded', String(showAll));
  document.querySelector('#directory-empty').hidden = matches.length !== 0;
}
if (input && entries.length) {
  input.addEventListener('input', filterDirectory);
  scope.addEventListener('change', filterDirectory);
  more.addEventListener('click', () => { showAll = !showAll; filterDirectory(); });
  filterDirectory();
  document.querySelectorAll('.directory-tools[data-js-only]').forEach(el => el.hidden = false);
}

const dialog = document.querySelector('#art-dialog');
let artTrigger;
if (dialog && typeof dialog.showModal === 'function') {
  const image = dialog.querySelector('img');
  const title = dialog.querySelector('h2');
  for (const link of document.querySelectorAll('[data-artwork]')) {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      artTrigger = link;
      const source = link.querySelector('img');
      image.src = link.href;
      image.alt = source.alt;
      image.width = source.width;
      image.height = source.height;
      title.textContent = link.dataset.artTitle;
      dialog.showModal();
    });
  }
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => artTrigger?.focus());
}

const motionButton = document.querySelector('.motion-toggle');
if (motionButton) {
  let paused = false;
  try { paused = localStorage.getItem('sunaria-motion') === 'paused'; } catch {}
  function setMotion() {
    document.documentElement.dataset.motion = paused ? 'paused' : 'running';
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.textContent = paused ? label('Resume motion', 'ادامهٔ حرکت‌ها') : label('Pause motion', 'توقف حرکت‌ها');
    document.dispatchEvent(new Event('sunaria:motion'));
  }
  setMotion();
  motionButton.hidden = false;
  motionButton.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('sunaria-motion', paused ? 'paused' : 'running'); } catch {}
    setMotion();
  });
}
