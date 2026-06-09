import { verifySession, getCookie, parseUsers } from './auth-utils.js';

function redirectToLogin(request){
  const url = new URL(request.url);
  const next = encodeURIComponent(url.pathname + url.search);
  return Response.redirect(`${url.origin}/login.html?next=${next}`, 302);
}

export async function onRequest(context){
  const env = context.env || {};
  const url = new URL(context.request.url);
  const path = url.pathname;

  // 未配置用户时放行，避免把自己锁外面。正式使用请配置 AUTH_USERS 或 AUTH_USER/AUTH_PASSWORD。
  if(!parseUsers(env).length) return context.next();

  const publicPaths = ['/login.html', '/api/login', '/api/logout'];
  if(publicPaths.includes(path)) return context.next();

  const token = getCookie(context.request, 'tc_session');
  const session = await verifySession(env, token);
  if(!session) return redirectToLogin(context.request);

  return context.next();
}
