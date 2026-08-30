const {freshSession,stravaGet,json}=require('./_strava');
exports.handler=async(event)=>{
  try{
    const {session,setCookie}=await freshSession(event);
    if(!session) return json(401,{error:'Not connected to Strava'});
    const data=await stravaGet('/athlete/activities?per_page=50&page=1',session.access_token);
    const activities=data.map(a=>({
      id:a.id,name:a.name,distance:a.distance,
      moving_time:a.moving_time,elapsed_time:a.elapsed_time,
      start_date:a.start_date,start_date_local:a.start_date_local,
      type:a.type,sport_type:a.sport_type,total_elevation_gain:a.total_elevation_gain
    }));
    return json(200,{activities},setCookie?{'set-cookie':setCookie}:{});
  }catch(err){return json(500,{error:err.message,stage:'strava_api_request'});}
};
