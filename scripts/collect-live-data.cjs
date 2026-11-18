const fs=require('node:fs');
const origin='https://brasabetbr.com',records=[];
async function get(url){try{const r=await fetch(origin+url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error(String(r.status));records.push({url,status:r.status,capturedAt:new Date().toISOString()});return await r.json();}catch(error){records.push({url,error:error.message});return null;}}
(async()=>{
  const sports=['football','basketball','tennis','volleyball','table-tennis','handball','snooker','curling'];
  const lists=[];
  for(let i=0;i<sports.length;i+=3)lists.push(...await Promise.all(sports.slice(i,i+3).map(async sport=>{const first=await get(`/api/live?sport=${sport}&mode=sport&page=1`);return {sport,...first};})));
  const map=new Map(require('../src/data/sports-events.json').map(event=>[event.id,event]));
  const live=[...new Map(lists.flatMap(list=>list.events||[]).map(event=>[event.id,event])).values()];
  for(const event of live)map.set(event.id,event);
  for(const sport of ['boxing','rugby']){const list=await get(`/api/events?sport=${sport}&live=false&league=&page=1`);for(const event of list?.events||[])map.set(event.id,event);}
  const firstFootball=live.find(event=>event.sport==='football');
  if(firstFootball){const full=await get('/api/events/'+firstFootball.id);if(full?.event)map.set(full.event.id,full.event);}
  fs.writeFileSync('src/data/sports-live.json',JSON.stringify({events:live,lists:lists.map(({events,...rest})=>rest)}));
  fs.writeFileSync('src/data/sports-events.json',JSON.stringify([...map.values()]));
  fs.writeFileSync('evidence/supplemental-live-data.json',JSON.stringify({source:'Read-only public HTTP requests supplementing REA browser snapshots',records},null,2));
  console.log({live:live.length,allEvents:map.size,errors:records.filter(x=>x.error)});
})().catch(error=>{console.error(error);process.exitCode=1;});
