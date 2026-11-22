const http=require('http'),fs=require('fs'),path=require('path'),os=require('os');
const {WebSocketServer}=require('ws');
const Q=require('./questions.js');
const VERSION='v3';
const PIN=process.env.HOST_PIN||String(1000+Math.floor(Math.random()*9000));
const PORT=process.env.PORT||3000,MAXT=5;
let G={phase:'lobby',q:-1,t0:0,timer:null};
let teams={},players={},answers={},viol={},PID=0,VID=0;const vlog=[];const feed=[];const say=m=>{feed.push(m);if(feed.length>8)feed.shift()};
const tot=t=>Object.values(t.byQ).reduce((a,b)=>a+b,0);
const keyText=q=>q.t==='num'?String(q.k):q.t==='match'?q.l.map((x,i)=>x+' → '+q.r[q.k[i]]).join('\n'):q.o[q.k];
const correct=(q,a)=>{if(a==null)return false;if(q.t==='num')return Math.abs(parseFloat(a)-q.k)<1e-6;if(q.t==='match')return String(a)===q.k.join(',');return String(a)===String(q.k)};

const server=http.createServer((req,res)=>{
  const f=path.join(__dirname,'public','index.html');
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});fs.createReadStream(f).pipe(res);
});
const wss=new WebSocketServer({server});

function snap(ws){
  const me=players[ws.id],host=!!ws.host,qn=Q[G.q];
  const s={phase:G.phase,n:Q.length,qi:G.q,host,
    teams:Object.entries(teams).map(([code,t])=>({code:host||me?.code===code?code:undefined,name:t.name,av:t.av,pid:t.pid,ok:G.phase==='reveal'?t.ok:null,streak:t.streak||0,size:t.members.length,total:tot(t),
      last:G.phase==='reveal'?(t.byQ[G.q]??0):null,members:host||me?.code===code?t.members.map(i=>players[i].name):undefined})).sort((a,b)=>b.total-a.total),
    me:me?.code?{name:me.name,code:me.code,leader:teams[me.code].leader===ws.id,inv:teams[me.code].inv,use:teams[me.code].use,hide:teams[me.code].hide,fz:Math.max(0,teams[me.code].fz-Date.now()),pen:vlog.filter(v=>v.q===G.q&&v.code===me.code&&v.pen&&!v.refunded).length}:null};
  s.ver=VERSION;if(host)s.vlog=vlog.slice(-100);s.feed=feed.slice(-6);s.bosses=Q.map((x,i)=>x.boss?i:-1).filter(i=>i>=0);s.boss=G.phase==='reveal'?G.boss:null;
  if(qn&&(G.phase==='question'||G.phase==='reveal')){
    s.question={t:qn.t,tp:qn.tp,q:qn.q,o:qn.o,l:qn.l,r:qn.r,s:qn.s,boss:!!qn.boss,hard:!!qn.hard};
    s.left=Math.max(0,qn.s*1000-(Date.now()-G.t0));
    s.answered=Object.keys(answers[G.q]||{}).length;
    const mine=me?.code&&answers[G.q]?.[me.code];
    if(mine)s.mine={ms:mine.ms,ok:G.phase==='reveal'?correct(qn,mine.ans):undefined};
    if(G.phase==='reveal')s.key=keyText(qn);
  }
  return s;
}
const bc=()=>wss.clients.forEach(c=>{if(c.readyState===1&&c.id)c.send(JSON.stringify({t:'state',...snap(c)}))});
const err=(ws,m)=>ws.send(JSON.stringify({t:'err',m}));

function startQ(n){clearTimeout(G.timer);G={phase:'question',q:n,t0:Date.now(),timer:null};answers[n]={};viol[n]=new Set();Object.values(teams).forEach(t=>{t.use={};t.hide=null;t.fz=0});
  G.timer=setTimeout(reveal,Q[n].s*1000+1500);bc()}
function reveal(){
  if(G.phase!=='question')return;clearTimeout(G.timer);
  const n=G.q,q=Q[n],as=answers[n]||{},ent=Object.entries(teams);
  const rank=ent.slice().sort((a,b)=>tot(b[1])-tot(a[1])).map(e=>e[0]);
  const okl=Object.entries(as).filter(([c,a])=>correct(q,a.ans));
  const fast=okl.length?Math.max(1,Math.min(...okl.map(([,a])=>a.ms))):1;
  let win=null,wms=1e9,steals=[],dmg=0;
  for(const [code,t] of ent){
    const a=as[code];let p=0;t.ok=a?correct(q,a.ans):null;
    if(t.ok){p=Math.max(100,Math.round(1000*fast/Math.max(a.ms,fast)));if(a.dbl)p*=2;
      t.streak=(t.streak||0)+1;p+=Math.min(t.streak-1,3)*50;
      if(a.ms<wms){wms=a.ms;win=code}
      if(t.streak===3){t.inv.steal++;say(t.name+' hit a 3 streak and earns a Steal card')}
      if(t.use.steal){const i=rank.indexOf(code);if(i>0){steals.push(rank[i-1]);p+=100}}
    }else{if(!t.use.shield)t.streak=0;if(a&&a.dbl)p=-300}
    {const pn=vlog.filter(v=>v.q===n&&v.code===code&&v.pen&&!v.refunded);pn.forEach(v=>v.applied=true);p-=600*pn.length}
    t.byQ[n]=p;dmg+=Math.max(0,p);
  }
  steals.forEach(c=>{teams[c].byQ[n]-=100;say(teams[c].name+' lost 100 points to a Steal')});
  if(win){teams[win].inv.freeze=Math.min(2,teams[win].inv.freeze+1);say(teams[win].name+' cracked it first in '+(wms/1000).toFixed(1)+'s and earns a Freeze card')}
  G.boss=null;
  if(q.boss){const hp=ent.length*500;G.boss={dmg,hp,dead:dmg>=hp};if(G.boss.dead){ent.forEach(([c,t])=>t.byQ[n]+=200);say('BOSS DEFEATED. Every crew gains 200')}else say('The boss survived with '+(hp-dmg)+' HP')}
  G.phase='reveal';bc();
}
function code(){let c;do{c=Array.from({length:4},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.random()*32|0]).join('')}while(teams[c]);return c}

wss.on('connection',ws=>{
  ws.on('message',raw=>{
    let m;try{m=JSON.parse(raw)}catch{return}
    if(m.t==='hello'){
      ws.id=String(m.id||'').slice(0,40)||Math.random().toString(36).slice(2);
      players[ws.id]=players[ws.id]||{name:'',code:null};
      if(m.pin!=null){if(String(m.pin)===PIN)ws.host=true;else err(ws,'Wrong host PIN')}
      return ws.send(JSON.stringify({t:'state',...snap(ws)}));
    }
    if(!ws.id)return;const me=players[ws.id];
    if(ws.host){
      if(m.t==='start'&&Object.keys(teams).length&&G.phase==='lobby')return startQ(0);
      if(m.t==='next'&&G.phase==='reveal'&&G.q+1<Q.length)return startQ(G.q+1);
      if(m.t==='reveal')return reveal();
      if(m.t==='refund'){const e=vlog.find(v=>v.id===m.id);if(e&&!e.refunded){e.refunded=true;if(e.applied&&teams[e.code])teams[e.code].byQ[e.q]+=600;bc()}return}
      if(m.t==='finish'&&G.phase==='reveal'){G.phase='done';return bc()}
      if(m.t==='reset'){clearTimeout(G.timer);G={phase:'lobby',q:-1,t0:0,timer:null};teams={};answers={};viol={};vlog.length=0;feed.length=0;Object.values(players).forEach(p=>p.code=null);return bc()}
    }
    const name=String(m.name||'').trim().slice(0,20);
    if(m.t==='create'){
      const tn=String(m.team||'').trim().slice(0,20);
      if(G.phase!=='lobby')return err(ws,'Game already started');
      if(!name||!tn||me.code)return err(ws,'Enter your name and a team name');
      const c=code();teams[c]={name:tn,leader:ws.id,members:[ws.id],byQ:{},inv:{hint:1,shield:1,freeze:0,steal:0},use:{},fz:0,pid:++PID,av:Math.max(0,Math.min(5,m.av|0))};me.name=name;me.code=c;return bc();
    }
    if(m.t==='join'){
      const c=String(m.code||'').trim().toUpperCase(),t=teams[c];
      if(G.phase!=='lobby')return err(ws,'Game already started');
      if(!name||me.code)return err(ws,'Enter your name first');
      if(!t)return err(ws,'No team with that code');
      if(t.members.length>=MAXT)return err(ws,'That team is full (max 5)');
      t.members.push(ws.id);me.name=name;me.code=c;return bc();
    }
    if(m.t==='answer'&&G.phase==='question'&&me.code&&teams[me.code].leader===ws.id){
      const q=Q[G.q],ms=Date.now()-G.t0;
      if(answers[G.q][me.code]||ms>q.s*1000+500)return;if(teams[me.code].fz>Date.now())return err(ws,'You are frozen');
      const t=teams[me.code],dbl=!!m.dbl&&!!q.hard;answers[G.q][me.code]={ans:String(m.ans),ms,dbl};
      if(Object.keys(answers[G.q]).length>=Object.keys(teams).length){clearTimeout(G.timer);G.timer=setTimeout(reveal,700)}
      return bc();
    }
    if(['hint','shield','steal','freeze'].includes(m.t)&&G.phase==='question'&&me.code&&teams[me.code].leader===ws.id){
      const t=teams[me.code],q=Q[G.q];
      if(answers[G.q][me.code]||t.inv[m.t]<1||t.use[m.t])return;
      if(m.t==='hint'){if(!q.o)return;t.hide=q.o.map((_,i)=>i).filter(i=>i!==q.k).sort(()=>Math.random()-.5).slice(0,2);say(t.name+' used a Hint')}
      if(m.t==='freeze'){const v=Object.values(teams).find(x=>x.pid==m.target&&x!==t);if(!v)return;
        if(v.use.shield){v.use.shield=false;say(v.name+' Shield blocked a Freeze from '+t.name)}else{v.fz=Date.now()+5000;say(t.name+' froze '+v.name+' for 5 seconds')}}
      if(m.t==='shield')say(t.name+' raised a Shield');
      t.inv[m.t]--;t.use[m.t]=true;return bc();
    }
    if(m.t==='flag'&&G.phase==='question'&&me.code&&vlog.length<1000){
      const dup=vlog.some(v=>v.q===G.q&&v.sid===ws.id&&v.pen);
      vlog.push({id:++VID,q:G.q,qn:G.q+1,sid:ws.id,student:me.name,crew:teams[me.code].name,code:me.code,why:String(m.why||'event').slice(0,70),at:Date.now(),pen:m.kind==='pen'&&!dup,refunded:false,applied:false});
      return bc();
    }
  });
  ws.on('close',()=>{});
});

server.listen(PORT,()=>{
  console.log('\n🔐 Crypto Quiz Battle running');
  console.log('   Teacher PIN :',PIN,process.env.HOST_PIN?'':'(set HOST_PIN env var to choose your own)');
  console.log('   Local       : http://localhost:'+PORT);
  for(const l of Object.values(os.networkInterfaces()).flat())if(l.family==='IPv4'&&!l.internal)console.log('   Students    : http://'+l.address+':'+PORT+'   <- share this on the same Wi-Fi');
});
