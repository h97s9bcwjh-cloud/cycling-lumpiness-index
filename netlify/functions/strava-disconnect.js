const {getSession,clearSessionCookie,json}=require('./_strava');
exports.handler=async(event)=>{
  if(event.httpMethod!=='POST') return json(405,{error:'Method not allowed'});
  const s=await getSession(event);
  if(s?.access_token && process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET){
    try{
      const basic=Buffer.from(`${process.env.STRAVA_CLIENT_ID}:${process.env.STRAVA_CLIENT_SECRET}`).toString('base64');
      const body=new URLSearchParams({token:s.access_token,token_type_hint:'access_token'});
      await fetch('https://www.strava.com/oauth/revoke',{
        method:'POST',
        headers:{authorization:`Basic ${basic}`,'content-type':'application/x-www-form-urlencoded'},
        body
      });
    }catch(_){}
  }
  return json(200,{ok:true},{'set-cookie':clearSessionCookie()});
};
