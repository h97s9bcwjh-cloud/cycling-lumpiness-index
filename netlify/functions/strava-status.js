const {getSession,json}=require('./_strava');
exports.handler=async(event)=>{
  const s=await getSession(event);
  return json(200,{connected:!!s,athlete_name:s?.athlete_name||null});
};
