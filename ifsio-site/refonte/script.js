const year = document.querySelector('#current-year');
if (year) year.textContent = new Date().getFullYear();

const items = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach((item) => observer.observe(item));
} else {
  items.forEach((item) => item.classList.add('is-visible'));
}

const publicNewsGrid = document.querySelector('.news-grid');
if (publicNewsGrid) {
  const showEmptyNews = () => {
    const card = document.createElement('article'); card.className = 'news-empty-state';
    const icon = document.createElement('span'); icon.className = 'news-empty-icon'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = '✳';
    const copy = document.createElement('div'); const title = document.createElement('strong'); title.textContent = 'Les nouvelles de l’IFSIO';
    const message = document.createElement('p'); message.textContent = 'Les actualités et annonces publiées par l’Institut apparaîtront dans cet espace.';
    copy.append(title, message); card.append(icon, copy); publicNewsGrid.replaceChildren(card);
  };
  fetch('/api/public/news')
    .then((response) => response.ok ? response.json() : null)
    .then((data) => {
      const news = (data?.news || []).filter((item) => !/^\s*\[d[eé]mo\]/i.test(String(item.title || ''))).slice(0, 3);
      if (!news.length) { showEmptyNews(); return; }
      const fragment = document.createDocumentFragment();
      for (const item of news) {
        const card = document.createElement('a'); card.className = 'news-card'; card.href = `page.html?view=contenu&slug=${encodeURIComponent(item.slug)}`;
        const image = document.createElement('div'); image.className = 'news-image';
        const img = document.createElement('img'); img.src = item.cover_url || 'assets/actualites.jpg'; img.alt = item.cover_url ? `Couverture : ${item.title}` : ''; img.loading = 'lazy';
        const category = document.createElement('span'); category.className = 'news-category'; category.textContent = item.category || 'IFSIO';
        image.append(img, category);
        const body = document.createElement('div'); body.className = 'news-body';
        const date = document.createElement('span'); date.className = 'news-date'; date.textContent = item.published_at ? new Date(item.published_at).toLocaleDateString('fr-FR') : 'Actualité de l’Institut';
        const title = document.createElement('h3'); title.textContent = item.title;
        const action = document.createElement('span'); action.className = 'card-link'; action.append(document.createTextNode('Lire l’information '));
        const arrow = document.createElement('b'); arrow.textContent = '→'; action.append(arrow);
        body.append(date, title, action); card.append(image, body); fragment.append(card);
      }
      publicNewsGrid.replaceChildren(fragment);
    })
    .catch(showEmptyNews);
}

// Adaptation dynamique des liens satellites du campus sur la page d'accueil
(async () => {
  const defaultHost = window.location.hostname || 'localhost';
  const defaultProtocol = window.location.protocol || 'http:';

  let resultatsUrl = `${defaultProtocol}//${defaultHost}:5174`;
  let actesUrl = `${defaultProtocol}//${defaultHost}:5173`;
  let cntrssUrl = `${defaultProtocol}//${defaultHost}:3100`;

  try {
    const res = await fetch('/api/public/config');
    if (res.ok) {
      const cfg = await res.json();
      if (cfg?.services?.resultats) resultatsUrl = cfg.services.resultats;
      if (cfg?.services?.actes) actesUrl = cfg.services.actes;
      if (cfg?.services?.cntrss) cntrssUrl = cfg.services.cntrss;
    }
  } catch (_e) {}

  // Si on est sur un réseau local / IP différente de localhost, adapter les URLs
  if (defaultHost !== 'localhost' && defaultHost !== '127.0.0.1') {
    const adapt = (url, port) => {
      try {
        const u = new URL(url);
        if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
          u.hostname = defaultHost;
          u.protocol = defaultProtocol;
        }
        return u.toString();
      } catch {
        return `${defaultProtocol}//${defaultHost}:${port}`;
      }
    };
    resultatsUrl = adapt(resultatsUrl, 5174);
    actesUrl = adapt(actesUrl, 5173);
    cntrssUrl = adapt(cntrssUrl, 3100);
  }

  // Appliquer aux cartes du hub sur index.html
  document.querySelectorAll('a[href*=":5174"]').forEach(a => a.href = resultatsUrl);
  document.querySelectorAll('a[href*=":5173/#/verifier"]').forEach(a => {
    try {
      const base = new URL(actesUrl);
      a.href = `${base.protocol}//${base.host}/#/verifier`;
    } catch {
      a.href = `${actesUrl}/#/verifier`;
    }
  });
  document.querySelectorAll('a[href*=":5173"]:not([href*="/verifier"])').forEach(a => a.href = actesUrl);
  document.querySelectorAll('a[href*=":3100"]').forEach(a => a.href = cntrssUrl);
})();
