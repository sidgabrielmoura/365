const fs=require('node:fs');
const origin='https://brasabetbr.com';
const records=[];
async function get(url){const response=await fetch(origin+url,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw new Error(`${url}: ${response.status}`);const data=await response.json();records.push({url,status:response.status,capturedAt:new Date().toISOString()});return data;}
async function queue(items,fn,concurrency=4){let index=0;const results=new Array(items.length);await Promise.all(Array.from({length:concurrency},async()=>{while(index<items.length){const current=index++;try{results[current]=await fn(items[current]);}catch(error){records.push({input:items[current],error:error.message});}}}));return results.filter(Boolean);}
(async()=>{
 const first=require('../src/data/casino-catalogue.json');
 const pages=await queue(Array.from({length:first.pages-1},(_,i)=>i+2),page=>get(`/api/casino/games?page=${page}&limit=60&category=todos&search=&provider=`),4);
 const games=[...new Map([first,...pages].flatMap(page=>page.games||[]).map(game=>[game.id,game])).values()];
 const categoryPages=await queue(['aovivo','novidades','mesa','crash','jackpots'],async category=>{const data=await get(`/api/casino/games?page=1&limit=60&category=${category}&search=&provider=`);const rest=await queue(Array.from({length:data.pages-1},(_,i)=>i+2),page=>get(`/api/casino/games?page=${page}&limit=60&category=${category}&search=&provider=`),2);return [category,[...data.games,...rest.flatMap(page=>page.games)].map(game=>game.id)];},2);
 fs.writeFileSync('src/data/casino-games.json',JSON.stringify(games));
 fs.writeFileSync('src/data/casino-membership.json',JSON.stringify(Object.fromEntries(categoryPages)));
 const eventMap=new Map(require('../src/data/sports-events.json').map(event=>[event.id,event]));
 const sports=require('../src/data/sports-navigation.json').sports;
 const lists=await queue(sports.map(sport=>sport.id),async sport=>{const data=await get(`/api/events?sport=${encodeURIComponent(sport)}&live=false&league=&page=1`);const pages=data.hasMore?await queue([2,3],page=>get(`/api/events?sport=${encodeURIComponent(sport)}&live=false&league=&page=${page}`),2):[];return [data,...pages].flatMap(page=>page.events||[]);},3);
 const tabs=await queue(['international','football','nba','nfl','tennis','serie-b'],async tab=>[tab,await get('/api/home?tab='+tab)],3);
 fs.writeFileSync('src/data/home-tabs.json',JSON.stringify(Object.fromEntries(tabs)));
 for(const event of [...lists.flat(),...tabs.flatMap(([,data])=>data.sections?.flatMap(section=>section.events||[])||[])]){const old=eventMap.get(event.id);if(!old||old.markets.length<event.markets.length)eventMap.set(event.id,event);}
 fs.writeFileSync('src/data/sports-events.json',JSON.stringify([...eventMap.values()]));
 fs.writeFileSync('evidence/supplemental-public-data.json',JSON.stringify({source:'Supplemental read-only public HTTP requests, distinct from REA evidence',games:games.length,events:eventMap.size,records},null,2));
 console.log({games:games.length,catalogueTotal:first.total,pages:pages.length+1,events:eventMap.size,errors:records.filter(record=>record.error)});
})().catch(error=>{console.error(error.message);process.exitCode=1;});
