const {STATE_COOKIE,parseCookies,tokenRequest,sessionCookie,baseUrl,json}=require('./_strava');
exports.handler=async(event)=>{
  try{
    const q=event.queryStringParameters||{};
    if(q.error) return {statusCode:302,headers:{location:baseUrl()+'/?strava=denied'}};
    const cookies=parseCookies(event.headers.cookie||event.headers.Cookie||'');
    if(!q.code||!q.state||q.state!==cookies[STATE_COOKIE]) return json(400,{error:'Invalid or expired OAuth state'});
    const t=await tokenRequest({
      client_id:process.env.STRAVA_CLIENT_ID,
      client_secret:process.env.STRAVA_CLIENT_SECRET,
      code:q.code,
      grant_type:'authorization_code'
    });
    const athlete=t.athlete||{};
    const session={
      access_token:t.access_token,
      refresh_token:t.refresh_token,
      expires_at:t.expires_at,
      athlete_id:athlete.id||null,
      athlete_name:[athlete.firstname,athlete.lastname].filter(Boolean).join(' ')
    };
    return {
      statusCode:302,
      headers:{
        location:baseUrl()+'/?strava=connected',
        'set-cookie':sessionCookie(session),
        'cache-control':'no-store'
      }
    };
  }catch(err){return json(500,{error:err.message});}
};
