import { verifyUser, createSession, cookieHeader } from '../../auth-utils.js';

function json(data, status=200, headers={}){
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type':'application/json; charset=utf-8', ...headers } });
}

export async function onRequestPost(context){
  const env = context.env || {};
  const body = await context.request.json().catch(()=>({}));
  const username = String(body.username || '').trim();
  const password = String(body.password || '').trim();
  const result = verifyUser(env, username, password);
  if(!result.ok) return json({ error: '账号或密码错误' }, 401);
  const token = await createSession(env, result.username);
  return json({ ok: true, username: result.username }, 200, { 'Set-Cookie': cookieHeader(token, env) });
}
