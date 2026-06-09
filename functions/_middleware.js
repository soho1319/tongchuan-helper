function unauthorized(){
  return new Response('需要登录后访问 Tongchuan Helper', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Tongchuan Helper", charset="UTF-8"',
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}

function timingSafeEqual(a, b){
  if(a.length !== b.length) return false;
  let out = 0;
  for(let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function onRequest(context){
  const env = context.env || {};
  const expectedUser = String(env.AUTH_USER || env.BASIC_AUTH_USER || '').trim();
  const expectedPass = String(env.AUTH_PASSWORD || env.BASIC_AUTH_PASSWORD || '').trim();

  // 未配置账号密码时放行，避免部署后把自己锁在外面。
  // 正式使用请在 Cloudflare Pages 环境变量中配置 AUTH_USER / AUTH_PASSWORD。
  if(!expectedUser || !expectedPass){
    return context.next();
  }

  const auth = context.request.headers.get('Authorization') || '';
  if(!auth.startsWith('Basic ')) return unauthorized();

  let decoded = '';
  try{
    decoded = atob(auth.slice(6));
  }catch(e){
    return unauthorized();
  }

  const splitAt = decoded.indexOf(':');
  if(splitAt < 0) return unauthorized();

  const user = decoded.slice(0, splitAt);
  const pass = decoded.slice(splitAt + 1);

  if(!timingSafeEqual(user, expectedUser) || !timingSafeEqual(pass, expectedPass)){
    return unauthorized();
  }

  return context.next();
}
