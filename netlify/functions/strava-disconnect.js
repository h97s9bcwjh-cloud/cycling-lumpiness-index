const {getSession,clearSessionCookie,json}=require('./_strava');
exports.handler=async(event)=>{
  if(event.httpMethod!=='POST') return json(405,{error:'Method not allowed'});
  const s=await getSession(event);
  if(s?.access_token){
    try{
      await fetch('https://www.strava.com/oauth/deauthorize',{method:'POST',headers:{authorization:`Bearer ${s.access_token}`}});
    }catch(_){}
  }
  return json(200,{ok:true},{'set-cookie':clearSessionCookie()});
};
