const crypto=require('crypto');

const SESSION_COOKIE='cli_strava_session';
const STATE_COOKIE='cli_strava_state';
const API_BASES=['https://www.strava.com/api/v3','https://api-v3.strava.com'];

function baseUrl(){
  return (process.env.URL||process.env.DEPLOY_PRIME_URL||'').replace(/\/$/,'');
}
function callbackUrl(){ return baseUrl()+'/.netlify/functions/strava-callback'; }

function parseCookies(header=''){
  return Object.fromEntries(header.split(';').map(x=>x.trim()).filter(Boolean).map(x=>{
    const i=x.indexOf('=');return [x.slice(0,i),decodeURIComponent(x.slice(i+1))];
  }));
}
function key(){
  if(!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is not configured');
  return crypto.createHash('sha256').update(process.env.SESSION_SECRET).digest();
}
function seal(obj){
  const iv=crypto.randomBytes(12);
  const c=crypto.createCipheriv('aes-256-gcm',key(),iv);
  const enc=Buffer.concat([c.update(JSON.stringify(obj),'utf8'),c.final()]);
  const tag=c.getAuthTag();
  return Buffer.concat([iv,tag,enc]).toString('base64url');
}
function unseal(value){
  try{
    const b=Buffer.from(value,'base64url');
    const iv=b.subarray(0,12),tag=b.subarray(12,28),enc=b.subarray(28);
    const d=crypto.createDecipheriv('aes-256-gcm',key(),iv);
    d.setAuthTag(tag);
    return JSON.parse(Buffer.concat([d.update(enc),d.final()]).toString('utf8'));
  }catch(_){return null;}
}
function sessionCookie(session){
  return `${SESSION_COOKIE}=${encodeURIComponent(seal(session))}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`;
}
function clearSessionCookie(){
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
function json(status,body,headers={}){
  return {statusCode:status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers},body:JSON.stringify(body)};
}
function requireConfig(){
  if(!process.env.STRAVA_CLIENT_ID||!process.env.STRAVA_CLIENT_SECRET) throw new Error('Strava credentials are not configured');
}
async function tokenRequest(params){
  requireConfig();
  const body=new URLSearchParams(params);
  const r=await fetch('https://www.strava.com/oauth/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});
  const data=await r.json();
  if(!r.ok) throw new Error(data.message||'Strava token request failed');
  return data;
}
async function getSession(event){
  const cookies=parseCookies(event.headers.cookie||event.headers.Cookie||'');
  return unseal(cookies[SESSION_COOKIE]||'');
}
async function freshSession(event){
  let s=await getSession(event);
  if(!s) return {session:null,setCookie:null};
  const now=Math.floor(Date.now()/1000);
  if(Number(s.expires_at)>now+300) return {session:s,setCookie:null};
  const t=await tokenRequest({
    client_id:process.env.STRAVA_CLIENT_ID,
    client_secret:process.env.STRAVA_CLIENT_SECRET,
    grant_type:'refresh_token',
    refresh_token:s.refresh_token
  });
  s={...s,access_token:t.access_token,refresh_token:t.refresh_token,expires_at:t.expires_at};
  return {session:s,setCookie:sessionCookie(s)};
}
async function stravaGet(path,accessToken){
  let lastError=null;
  for(const base of API_BASES){
    try{
      const r=await fetch(base+path,{headers:{authorization:`Bearer ${accessToken}`}});
      let data={};
      try{data=await r.json();}catch(_){}
      if(!r.ok) throw new Error(data.message||`Strava API request failed (${r.status})`);
      return data;
    }catch(err){
      lastError=err;
      const msg=String(err?.message||err);
      if(msg.startsWith('Strava API request failed')) throw err;
      if(msg!=='fetch failed' && !/fetch/i.test(msg)) throw err;
    }
  }
  throw lastError||new Error('Unable to reach Strava API');
}
module.exports={
  crypto,SESSION_COOKIE,STATE_COOKIE,API_BASES,baseUrl,callbackUrl,parseCookies,
  sessionCookie,clearSessionCookie,json,requireConfig,tokenRequest,getSession,freshSession,stravaGet
};
