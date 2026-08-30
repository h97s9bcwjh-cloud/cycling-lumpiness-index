const {crypto,STATE_COOKIE,callbackUrl,requireConfig}=require('./_strava');
exports.handler=async()=>{
  try{
    requireConfig();
    const state=crypto.randomBytes(24).toString('base64url');
    const q=new URLSearchParams({
      client_id:process.env.STRAVA_CLIENT_ID,
      redirect_uri:callbackUrl(),
      response_type:'code',
      approval_prompt:'auto',
      scope:'read,activity:read_all',
      state
    });
    return {
      statusCode:302,
      headers:{
        location:'https://www.strava.com/oauth/authorize?'+q.toString(),
        'set-cookie':`${STATE_COOKIE}=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
        'cache-control':'no-store'
      }
    };
  }catch(err){return {statusCode:500,body:err.message};}
};
