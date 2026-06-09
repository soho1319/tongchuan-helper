import { clearCookieHeader } from '../../auth-utils.js';

export async function onRequest(context){
  const url = new URL(context.request.url);
  return Response.redirect(`${url.origin}/login.html`, 302, { 'Set-Cookie': clearCookieHeader() });
}
