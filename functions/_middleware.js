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

function parseUsers(env){
  const users = [];

  // 多账号配置，支持两种格式：
  // 1) JSON: {"user1":"pass1","user2":"pass2"}
  // 2) 换行/逗号/分号分隔: user1:pass1,user2:pass2
  const rawUsers = String(env.AUTH_USERS || env.BASIC_AUTH_USERS || '').trim();
  if(rawUsers){
    if(rawUsers.startsWith('{')){
      try{
        const obj = JSON.parse(rawUsers);
        for(const [user, pass] of Object.entries(obj)){
          if(user && pass) users.push([String(user).trim(), String(pass).trim()]);
        }
      }catch(e){
        // JSON 配错时继续尝试按 user:pass 列表解析
      }
    }

    if(!users.length){
      rawUsers
        .split(/[\n,;]+/)
        .map(item => item.trim())
        .filter(Boolean)
        .forEach(item => {
          const splitAt = item.indexOf(':');
          if(splitAt > 0){
            const user = item.slice(0, splitAt).trim();
            const pass = item.slice(splitAt + 1).trim();
            if(user && pass) users.push([user, pass]);
          }
        });
    }
  }

  // 兼容旧的单账号配置
  const expectedUser = String(env.AUTH_USER || env.BASIC_AUTH_USER || '').trim();
  const expectedPass = String(env.AUTH_PASSWORD || env.BASIC_AUTH_PASSWORD || '').trim();
  if(expectedUser && expectedPass) users.push([expectedUser, expectedPass]);

  return users;
}

export async function onRequest(context){
  const env = context.env || {};
  const users = parseUsers(env);

  // 未配置账号密码时放行，避免部署后把自己锁在外面。
  // 正式使用请在 Cloudflare Pages 环境变量中配置 AUTH_USERS 或 AUTH_USER / AUTH_PASSWORD。
  if(!users.length){
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

  for(const [expectedUser, expectedPass] of users){
    if(timingSafeEqual(user, expectedUser) && timingSafeEqual(pass, expectedPass)){
      return context.next();
    }
  }

  return unauthorized();
}
