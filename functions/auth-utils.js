export function getSecret(env){
  return String(env.AUTH_SECRET || env.COOKIE_SECRET || env.AUTH_PASSWORD || 'tongchuan-helper-dev-secret');
}

export function parseUsers(env){
  const users = [];
  const rawUsers = String(env.AUTH_USERS || env.BASIC_AUTH_USERS || '').trim();
  if(rawUsers){
    if(rawUsers.startsWith('{')){
      try{
        const obj = JSON.parse(rawUsers);
        for(const [user, pass] of Object.entries(obj)){
          if(user && pass) users.push([String(user).trim(), String(pass).trim()]);
        }
      }catch(e){}
    }
    if(!users.length){
      rawUsers.split(/[\n,;]+/).map(x=>x.trim()).filter(Boolean).forEach(item=>{
        const splitAt = item.indexOf(':');
        if(splitAt > 0){
          const user = item.slice(0, splitAt).trim();
          const pass = item.slice(splitAt + 1).trim();
          if(user && pass) users.push([user, pass]);
        }
      });
    }
  }
  const singleUser = String(env.AUTH_USER || env.BASIC_AUTH_USER || '').trim();
  const singlePass = String(env.AUTH_PASSWORD || env.BASIC_AUTH_PASSWORD || '').trim();
  if(singleUser && singlePass) users.push([singleUser, singlePass]);
  return users;
}

export function timingSafeEqual(a, b){
  a = String(a); b = String(b);
  if(a.length !== b.length) return false;
  let out = 0;
  for(let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export function verifyUser(env, username, password){
  const users = parseUsers(env);
  if(!users.length) return { ok: true, username: username || 'anonymous', noAuthConfigured: true };
  for(const [u,p] of users){
    if(timingSafeEqual(username, u) && timingSafeEqual(password, p)) return { ok: true, username: u };
  }
  return { ok: false };
}

function base64urlEncode(buffer){
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for(const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function base64urlText(str){
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function base64urlDecodeText(str){
  str = str.replace(/-/g,'+').replace(/_/g,'/');
  while(str.length % 4) str += '=';
  return decodeURIComponent(escape(atob(str)));
}

async function hmac(secret, data){
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  return crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
}

export async function createSession(env, username){
  const now = Math.floor(Date.now()/1000);
  const maxAge = Number(env.AUTH_MAX_AGE || 60 * 60 * 24 * 7);
  const payload = { u: username, iat: now, exp: now + maxAge };
  const payloadPart = base64urlText(JSON.stringify(payload));
  const sig = await hmac(getSecret(env), payloadPart);
  return `${payloadPart}.${base64urlEncode(sig)}`;
}

export async function verifySession(env, token){
  if(!token || !token.includes('.')) return null;
  const [payloadPart, sigPart] = token.split('.');
  const expected = base64urlEncode(await hmac(getSecret(env), payloadPart));
  if(!timingSafeEqual(sigPart, expected)) return null;
  try{
    const payload = JSON.parse(base64urlDecodeText(payloadPart));
    if(!payload.exp || payload.exp < Math.floor(Date.now()/1000)) return null;
    return payload;
  }catch(e){ return null; }
}

export function getCookie(request, name){
  const cookie = request.headers.get('Cookie') || '';
  const parts = cookie.split(';').map(x=>x.trim());
  for(const part of parts){
    const idx = part.indexOf('=');
    if(idx > 0 && part.slice(0,idx) === name) return decodeURIComponent(part.slice(idx+1));
  }
  return '';
}

export function cookieHeader(token, env){
  const maxAge = Number(env.AUTH_MAX_AGE || 60 * 60 * 24 * 7);
  return `tc_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearCookieHeader(){
  return 'tc_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}
