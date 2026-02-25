// Router hash-based con guards de autenticación

import { getState } from './state.js';

const routes = [];
let notFoundHandler = null;

export function addRoute(pattern, handler, options = {}) {
  const paramNames = [];
  const regexStr = pattern.replace(/:(\w+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  routes.push({
    regex: new RegExp(`^${regexStr}$`),
    paramNames,
    handler,
    ...options,
  });
}

export function setNotFound(handler) {
  notFoundHandler = handler;
}

export function navigate(path) {
  window.location.hash = path;
}

export function getCurrentPath() {
  return window.location.hash.slice(1) || '/login';
}

function matchRoute(path) {
  for (const route of routes) {
    const match = path.match(route.regex);
    if (match) {
      const params = {};
      route.paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });
      return { route, params };
    }
  }
  return null;
}

function handleRoute() {
  const path = getCurrentPath();
  const { user } = getState();

  // Guard: si no hay usuario y no es la página de login, redirigir
  if (!user && path !== '/login') {
    navigate('/login');
    return;
  }

  // Guard: si hay usuario y está en login, redirigir según rol
  if (user && path === '/login') {
    navigate(user.role === 'leader' ? '/dashboard' : '/mi-progreso');
    return;
  }

  const result = matchRoute(path);

  if (result) {
    const { route, params } = result;

    // Guard de rol
    if (route.role && user && user.role !== route.role) {
      navigate(user.role === 'leader' ? '/dashboard' : '/mi-progreso');
      return;
    }

    route.handler(params);
  } else if (notFoundHandler) {
    notFoundHandler();
  }
}

export function startRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

export function stopRouter() {
  window.removeEventListener('hashchange', handleRoute);
}
