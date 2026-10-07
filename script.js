'use strict';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
if (menu && navigation) {
  const closeMenu = () => {
    menu.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('open');
    document.body.classList.remove('menu-open');
    menu.querySelector('.menu-label').textContent = 'Menu';
    document.querySelectorAll('main, .site-footer').forEach(element => { element.inert = false; });
  };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    menu.querySelector('.menu-label').textContent = open ? 'Close' : 'Menu';
    document.querySelectorAll('main, .site-footer').forEach(element => { element.inert = open; });
  });
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab' && menu.getAttribute('aria-expanded') === 'true') {
      const controls = [...document.querySelectorAll('.site-header a, .site-header button')].filter(element => element.getBoundingClientRect().width > 0);
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menu.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
  window.matchMedia('(min-width: 601px)').addEventListener('change', closeMenu);
}

// One selection links the overview diagram to the detailed, keyboard-accessible panels.
const tabs = Array.from(document.querySelectorAll('[role="tab"][data-layer]'));
const panelIds = new Set(tabs.map(tab => tab.dataset.layer));
const tablist = document.querySelector('[role="tablist"]');
if (tablist) {
  const tabLayout = window.matchMedia('(max-width: 820px)');
  const syncOrientation = () => tablist.setAttribute('aria-orientation', tabLayout.matches ? 'horizontal' : 'vertical');
  syncOrientation();
  tabLayout.addEventListener('change', syncOrientation);
}
const overviewLabels = {
  surface: 'Surface / the product people use',
  engine: 'Engine / the rules behind the product',
  money: 'Money / wallet and transaction systems',
  control: 'Control / the tools to run the business',
  scale: 'Scale / infrastructure and operation'
};
function selectLayer(key, focus = false) {
  if (!panelIds.has(key)) return;
  tabs.forEach(tab => {
    const selected = tab.dataset.layer === key;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    tab.classList.toggle('active', selected);
    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    if (panel) panel.hidden = !selected;
    if (selected && focus) tab.focus();
  });
  document.querySelectorAll('[data-system-layer]').forEach(node => {
    const selected = node.dataset.systemLayer === key;
    node.classList.toggle('is-active', selected);
    node.setAttribute('aria-pressed', String(selected));
  });
  document.querySelectorAll('[data-stack-layer]').forEach(plane => { plane.classList.toggle('is-active', plane.dataset.stackLayer === key); });
  const overview = document.querySelector('#system-selected');
  if (overview) overview.textContent = overviewLabels[key];
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectLayer(tab.dataset.layer));
  tab.addEventListener('keydown', event => {
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    selectLayer(tabs[next].dataset.layer, true);
  });
});
document.querySelectorAll('[data-system-layer]').forEach(node => {
  node.addEventListener('click', () => selectLayer(node.dataset.systemLayer));
  node.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    document.querySelectorAll('[data-stack-layer]').forEach(plane => plane.classList.toggle('is-active', plane.dataset.stackLayer === node.dataset.systemLayer));
  });
  node.addEventListener('pointerleave', () => {
    const selected = tabs.find(tab => tab.getAttribute('aria-selected') === 'true');
    if (selected) document.querySelectorAll('[data-stack-layer]').forEach(plane => plane.classList.toggle('is-active', plane.dataset.stackLayer === selected.dataset.layer));
  });
});

const stage = document.querySelector('.system-stage');
const motionButton = document.querySelector('.motion-control');
let userPaused = reducedMotion.matches;
let stageVisible = true;
function syncMotion() {
  if (!stage || !motionButton) return;
  const paused = userPaused || reducedMotion.matches || document.hidden || !stageVisible;
  stage.classList.toggle('is-paused', paused);
  motionButton.setAttribute('aria-pressed', String(userPaused || reducedMotion.matches));
  motionButton.disabled = reducedMotion.matches;
  motionButton.textContent = reducedMotion.matches ? 'Motion reduced' : userPaused ? 'Resume motion' : 'Pause motion';
}
if (stage && motionButton) {
  motionButton.addEventListener('click', () => {
    userPaused = !userPaused;
    syncMotion();
  });
  document.addEventListener('visibilitychange', syncMotion);
  reducedMotion.addEventListener('change', syncMotion);
  if ('IntersectionObserver' in window) {
    const visibilityObserver = new IntersectionObserver(entries => {
      stageVisible = entries[0].isIntersecting;
      syncMotion();
    });
    visibilityObserver.observe(stage);
  }
  syncMotion();
}

const counter = document.querySelector('#project-count');
if (counter && 'IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    let start;
    function tick(time) {
      if (start === undefined) start = time;
      const progress = Math.min((time - start) / 850, 1);
      counter.textContent = String(Math.round(30 * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1 && !reducedMotion.matches) requestAnimationFrame(tick);
      else counter.textContent = '30';
    }
    requestAnimationFrame(tick);
  }, { threshold: 0.6 });
  observer.observe(counter);
}

// Finite, layered entrances. The hero stays immediate, and all content is native HTML.
if ('IntersectionObserver' in window && Element.prototype.animate && !reducedMotion.matches) {
  const compactMotion = window.matchMedia('(max-width: 600px)');
  const running = new Set();
  const records = new Map();
  const easing = 'cubic-bezier(.16,1,.3,1)';
  function play(element, frames, duration, delay = 0) {
    const animation = element.animate(frames, { duration, delay, easing, fill: 'both' });
    running.add(animation);
    animation.finished.then(() => {
      // Resting elements hold no animation or compositor layer.
      animation.cancel();
      running.delete(animation);
    }).catch(() => running.delete(animation));
  }
  function prepare(element, type, delay = 0) {
    if (!element || records.has(element)) return;
    const record = { type, delay, words: [] };
    if (type === 'heading') {
      // Preserve <br>, whitespace and readable heading semantics at every width.
      [...element.childNodes].forEach(node => {
        if (node.nodeType !== Node.TEXT_NODE) return;
        const fragment = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(word => {
          if (!word.trim()) { fragment.append(document.createTextNode(word)); return; }
          const mask = document.createElement('span');
          mask.className = 'motion-word';
          const inner = document.createElement('span');
          inner.className = 'motion-word-inner';
          inner.textContent = word;
          mask.append(inner);
          fragment.append(mask);
          record.words.push(inner);
        });
        node.replaceWith(fragment);
      });
    }
    element.dataset.entrance = type;
    element.classList.add('motion-pending');
    records.set(element, record);
    observer.observe(element);
  }
  function enter(element, animate = true) {
    const record = records.get(element);
    if (!record || !element.classList.contains('motion-pending')) return;
    element.classList.remove('motion-pending');
    element.classList.add('motion-entered');
    observer.unobserve(element);
    if (!animate || reducedMotion.matches) return;
    const mobile = compactMotion.matches;
    const delay = mobile ? Math.min(record.delay, 90) : record.delay;
    if (record.type === 'heading') {
      record.words.forEach((word, index) => play(word, [
        { transform: 'translate3d(0,112%,0) rotate(2deg)', opacity: 0 },
        { transform: 'translate3d(0,0,0) rotate(0deg)', opacity: 1 }
      ], mobile ? 760 : 1150, delay + Math.min(index * (mobile ? 28 : 45), 270)));
    } else if (record.type === 'diagram') {
      const svg = element.querySelector('svg');
      if (svg) {
        play(svg, [{ transform: 'translate3d(0,12px,0) scale(1.045)', opacity: .25 }, { transform: 'none', opacity: 1 }], mobile ? 850 : 1400, delay);
        svg.querySelectorAll('path, rect').forEach((path, index) => {
          const length = path.getTotalLength();
          play(path, [{ strokeDasharray: `${length} ${length}`, strokeDashoffset: length, opacity: .15 }, { strokeDasharray: `${length} ${length}`, strokeDashoffset: 0, opacity: 1 }], mobile ? 900 : 1500, delay + Math.min(index * 65, 260));
        });
        svg.querySelectorAll('text,circle').forEach((detail, index) => play(detail, [{ opacity: 0 }, { opacity: 1 }], 650, delay + 140 + Math.min(index * 35, 260)));
      }
    } else if (record.type === 'label') {
      play(element, [{ opacity: 0, transform: 'translate3d(-12px,0,0)' }, { opacity: 1, transform: 'none' }], mobile ? 650 : 1000, delay);
    } else {
      play(element, [{ opacity: 0, transform: `translate3d(0,${mobile ? 16 : 28}px,0)` }, { opacity: 1, transform: 'none' }], mobile ? 720 : 1100, delay);
    }
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) enter(entry.target); });
  }, { threshold: 0, rootMargin: '0px 0px -5% 0px' });
  document.querySelectorAll('main h2:not(.tagline-section h2)').forEach(element => prepare(element, 'heading'));
  document.querySelectorAll('.section-label>span, .faq-heading>.eyebrow, .related-services>.eyebrow').forEach(element => prepare(element, 'label'));
  document.querySelectorAll('.section-intro>p, .architecture-heading>p, .faq-heading>p, .intake-copy>p, .delivery-contact, .service-content section>div:last-child, .service-contact-copy').forEach(element => prepare(element, 'copy', 120));
  document.querySelectorAll('.work-item').forEach(item => {
    prepare(item.querySelector('.work-row'), 'copy');
    prepare(item.querySelector('.scope-visual'), 'diagram', 70);
    prepare(item.querySelector('.scope-map ul'), 'copy', 160);
    item.querySelectorAll('.work-content> *').forEach((element, index) => prepare(element, 'copy', 140 + index * 80));
  });
  document.querySelectorAll('.capability-list article, .process-grid article, .service-links a').forEach(element => {
    const index = [...element.parentElement.children].indexOf(element);
    prepare(element, 'copy', Math.min(index * 100, 300));
  });
  const showAll = () => {
    observer.disconnect();
    records.forEach((_, element) => enter(element, false));
    running.forEach(animation => animation.cancel());
    running.clear();
  };
  reducedMotion.addEventListener('change', event => { if (event.matches) showAll(); });
  window.addEventListener('beforeprint', showAll);
  // Keyboard and find-in-page navigation must never land on hidden decoration.
  document.addEventListener('focusin', event => {
    const pending = event.target.closest('.motion-pending');
    if (pending) enter(pending, false);
  });
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') showAll();
  });
}
// Each word gets its own intersection trigger; the line stays readable throughout.
const taglineWords = document.querySelectorAll('.tagline-word');
if (taglineWords.length && 'IntersectionObserver' in window && !reducedMotion.matches) {
  document.documentElement.classList.add('js-tagline');
  const wordObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-lit');
      wordObserver.unobserve(entry.target);
    });
  }, { rootMargin: '-10% 0px -25% 0px', threshold: 0.2 });
  taglineWords.forEach(word => wordObserver.observe(word));
  reducedMotion.addEventListener('change', event => {
    if (event.matches) document.documentElement.classList.remove('js-tagline');
  });
}
if (navigation && 'IntersectionObserver' in window) {
  const links = Array.from(navigation.querySelectorAll('a'));
  const currentObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(link => {
        if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-20% 0px -55% 0px' });
  links.forEach(link => {
    const section = document.getElementById(link.hash.slice(1));
    if (section) currentObserver.observe(section);
  });
}

const form = document.querySelector('#intake-form');
let prepared = '';
if (form) {
  const status = document.querySelector('#form-status');
  const review = document.querySelector('#enquiry-review');
  const detailList = document.querySelector('#review-details');
  const emailLink = document.querySelector('#open-email');
  const fields = ['platform', 'budget', 'name', 'email', 'brief'];
  function buildReview(moveFocus) {
    const values = {};
    fields.forEach(name => { values[name] = String(form.elements.namedItem(name).value).trim(); });
    prepared = `KNWLY PROJECT ENQUIRY\n\nPlatform: ${values.platform}\nIndicative budget: ${values.budget}\nName: ${values.name}\nEmail: ${values.email}\n\nProject context:\n${values.brief}`;
    detailList.replaceChildren();
    [['Platform', values.platform], ['Indicative budget', values.budget], ['Contact', values.name + ' · ' + values.email], ['Project context', values.brief]].forEach(([label, value]) => {
      const term = document.createElement('dt');
      const definition = document.createElement('dd');
      term.textContent = label;
      definition.textContent = value;
      detailList.append(term, definition);
    });
    emailLink.href = 'mailto:knwly.dev@gmail.com?subject=' + encodeURIComponent('KNWLY project enquiry — ' + values.platform) + '&body=' + encodeURIComponent(prepared);
    review.hidden = false;
    const fallback = document.querySelector('#prepared-copy');
    if (fallback) fallback.value = prepared;
    if (moveFocus) {
      status.textContent = 'Your enquiry is ready to review. Open an email draft or copy the text; nothing has been sent.';
      document.querySelector('#review-title').focus({ preventScroll: true });
      review.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'nearest' });
    }
  }
  form.addEventListener('input', event => {
    if (event.target.matches('input,textarea')) event.target.setCustomValidity('');
    if (!review.hidden) {
      // Invalidate a stale summary while details are being edited.
      review.hidden = true;
      prepared = '';
      status.textContent = 'Details changed. Review the updated enquiry before continuing.';
      document.querySelector('#prepared-fallback')?.remove();
    }
  });
  form.addEventListener('change', () => {
    if (!review.hidden) { review.hidden = true; prepared = ''; document.querySelector('#prepared-fallback')?.remove(); status.textContent = 'Details changed. Review the updated enquiry before continuing.'; }
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    ['name', 'email', 'brief'].forEach(name => {
      const field = form.elements.namedItem(name);
      field.value = field.value.trim();
      field.setCustomValidity(field.value ? '' : 'Please complete this field.');
    });
    if (!form.reportValidity()) return;
    buildReview(true);
  });
  document.querySelector('#copy-brief').addEventListener('click', async () => {
    if (!prepared) return;
    try {
      await navigator.clipboard.writeText(prepared);
      status.textContent = 'Enquiry copied. Paste it into an email to knwly.dev@gmail.com.';
    } catch {
      status.textContent = 'Select and copy the enquiry below, then email it to knwly.dev@gmail.com.';
      let box = document.querySelector('#prepared-copy');
      if (!box) {
        const label = document.createElement('label');
        label.htmlFor = 'prepared-copy';
        label.textContent = 'Your prepared enquiry';
        box = document.createElement('textarea');
        box.id = 'prepared-copy';
        box.readOnly = true;
        const fallback = document.createElement('div');
        fallback.id = 'prepared-fallback';
        fallback.append(label, box);
        review.append(fallback);
      }
      box.value = prepared;
      box.focus();
      box.select();
    }
  });
}
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
