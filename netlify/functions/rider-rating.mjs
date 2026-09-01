import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});

export default async (req)=>{
  if(req.method!=="POST") return reply(405,{error:"Method not allowed"});
  try{
    const body=await req.json();
    const rating=Number(body.rider_rating),cli=Number(body.cli),p50=Number(body.p50),
          rshort=Number(body.rshort),rlong=Number(body.rlong),
          distance=Number(body.distance_m),gain=Number(body.elevation_gain_m),
          fp=String(body.ride_fingerprint||"");
    if(!Number.isFinite(rating)||rating<0||rating>10) return reply(400,{error:"Rating must be between 0.00 and 10.00"});
    if(Math.round(rating*100)!==Math.round(Number(body.rider_rating)*100)) return reply(400,{error:"Invalid rating"});
    if(!/^[a-f0-9]{64}$/.test(fp)) return reply(400,{error:"Invalid ride fingerprint"});
    if(![cli,p50,rshort,rlong,distance,gain].every(Number.isFinite)) return reply(400,{error:"Incomplete CLI data"});

    const profileVersion=String(body.profile_version||"");
    const spacing=Number(body.profile_spacing_m);
    const profile=Array.isArray(body.elevation_profile_m) ? body.elevation_profile_m.map(Number) : [];
    if(profileVersion!=="distance-elevation-25m-v1") return reply(400,{error:"Unsupported profile version"});
    if(spacing!==25) return reply(400,{error:"Unexpected profile spacing"});
    if(profile.length<3 || profile.length>200000 || !profile.every(Number.isFinite)) {
      return reply(400,{error:"Invalid elevation profile"});
    }

    const record={
      schema_version:1,submitted_at:new Date().toISOString(),rider_rating:Math.round(rating*100)/100,
      ride_fingerprint:fp,cli_version:"3.0",cli,p50,rshort,rlong,
      distance_m:Math.round(distance),elevation_gain_m:Math.round(gain),
      source:body.source==="Strava"?"Strava":"GPX",
      profile_version:profileVersion,
      profile_spacing_m:spacing,
      elevation_profile_m:profile.map(v=>Math.round(v*10)/10)
    };
    const store=getStore("cli-rider-ratings");
    const key=`ratings/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}`;
    await store.setJSON(key,record);
    return reply(201,{ok:true});
  }catch(err){
    return reply(500,{error:err?.message||"Unable to store rating"});
  }
};
