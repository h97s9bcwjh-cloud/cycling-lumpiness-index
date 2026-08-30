const {freshSession,stravaGet,json}=require('./_strava');
exports.handler=async(event)=>{
  try{
    const id=String((event.queryStringParameters||{}).activity_id||'');
    if(!/^\d+$/.test(id)) return json(400,{error:'Invalid activity id'});
    const {session,setCookie}=await freshSession(event);
    if(!session) return json(401,{error:'Not connected to Strava'});
    const data=await stravaGet(`/activities/${id}/streams?keys=distance,altitude,time&key_by_type=true`,session.access_token);
    const get=(key)=>{
      if(Array.isArray(data)){
        const s=data.find(x=>x.type===key);return s?.data||[];
      }
      return data?.[key]?.data||[];
    };
    return json(200,{distance:get('distance'),altitude:get('altitude'),time:get('time')},
      setCookie?{'set-cookie':setCookie}:{});
  }catch(err){return json(500,{error:err.message});}
};
