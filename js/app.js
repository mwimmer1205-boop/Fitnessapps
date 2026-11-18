/* FitLog Pro – App-Shell, Navigation & Routing */
window.FIT = window.FIT || {};

FIT.app = (() => {
  const U = FIT.util;
  const S = FIT.store;
  const UI = FIT.ui;

  const NAV = [
    { route: 'dashboard', label: 'Übersicht', icon: 'dashboard' },
    { route: 'nutrition', label: 'Ernährung', icon: 'nutrition' },
    { route: 'recipes', label: 'Rezepte', icon: 'recipes' },
    { route: 'plans', label: 'Trainingsplan', icon: 'plans' },
    { route: 'training', label: 'Trainingsmodus', icon: 'log' },
    { route: 'counters', label: 'Zähler', icon: 'counters' },
    { route: 'settings', label: 'Einstellungen', icon: 'settings' }
  ];

  const TITLES = {
    dashboard: 'Übersicht', nutrition: 'Ernährung', recipes: 'Rezepte',
    plans: 'Trainingsplan', training: 'Trainingsmodus', log: 'Trainingsmodus',
    counters: 'Zähler', settings: 'Einstellungen'
  };

  let current = 'dashboard';

  function renderNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    nav.innerHTML = NAV.map((n) =>
      '<a class="nav-link" href="#/' + n.route + '" data-route="' + n.route + '">' +
        UI.icon(n.icon) + '<span>' + n.label + '</span>' +
      '</a>'
    ).join('');
    const profile = document.getElementById('sideProfile');
    if (profile) {
      const name = S.state.profile.name || 'Dein Profil';
      profile.innerHTML = '<span class="avatar">' + U.esc((S.state.profile.name || 'F').slice(0, 1).toUpperCase()) + '</span>' +
        '<span class="side-profile-text"><strong>' + U.esc(name) + '</strong><small>lokal gespeichert</small></span>';
    }
    const sideDate = document.getElementById('sideDate');
    if (sideDate) sideDate.textContent = U.fmtDate(U.todayISO(), { weekday: true, month: 'short' });
    setActive(current);
  }

  function setActive(route) {
    document.querySelectorAll('.nav-link').forEach((a) => a.classList.toggle('active', a.dataset.route === route));
    const title = document.getElementById('pageTitle');
    if (title) title.textContent = TITLES[route] || 'FitLog Pro';
  }

  function routeFromHash() {
    const raw = (location.hash || '').replace(/^#\/?/, '').split('?')[0];
    if (raw === 'log') return 'training';
    return TITLES[raw] ? raw : 'dashboard';
  }

  function render() {
    const route = routeFromHash();
    current = route;
    setActive(route);
    const view = document.getElementById('view');
    const mod = FIT.views[route];
    if (!view || !mod) return;
    try {
      mod.render(view);
    } catch (err) {
      console.error(err);
      view.innerHTML = '<div class="empty"><div class="empty-emoji">⚠️</div><h3>Da ist etwas schiefgelaufen</h3><p>' +
        U.esc(err.message || 'Unbekannter Fehler') + '</p><button class="btn primary" onclick="location.reload()">Neu laden</button></div>';
    }
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function rerender() {
    render();
    renderNav();
  }

  function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('scrim')?.classList.remove('show');
  }

  function openSidebar() {
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('scrim')?.classList.add('show');
  }

  function setupQuickMenu() {
    const btn = document.getElementById('quickAdd');
    const menu = document.getElementById('quickMenu');
    if (!btn || !menu) return;

    const close = () => menu.classList.remove('show');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('show');
    });
    document.addEventListener('click', (e) => {
      if (menu.classList.contains('show') && !menu.contains(e.target)) close();
    });

    menu.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      close();
      if (action === 'recipe') {
        location.hash = '#/recipes';
        setTimeout(() => FIT.views.recipes.openEditor(), 60);
      } else if (action === 'meal') {
        location.hash = '#/nutrition';
        setTimeout(() => FIT.views.nutrition.openAddRecipe(null, null, U.todayISO()), 60);
      } else if (action === 'workout') {
        location.hash = '#/training';
        setTimeout(() => FIT.views.training.startWorkout({}), 60);
      } else if (action === 'checkin') {
        location.hash = '#/counters';
      }
    });
  }

  function init() {
    S.load();
    renderNav();
    setupQuickMenu();

    document.getElementById('menuBtn')?.addEventListener('click', openSidebar);
    document.getElementById('scrim')?.addEventListener('click', closeSidebar);
    document.getElementById('nav')?.addEventListener('click', (e) => {
      if (e.target.closest('.nav-link')) closeSidebar();
    });

    if (!location.hash) history.replaceState(null, '', '#/dashboard');
    window.addEventListener('hashchange', render);
    render();

    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
  }

  return { init, render, rerender, renderNav, setActive, get current() { return current; } };
})();

document.addEventListener('DOMContentLoaded', () => FIT.app.init());
