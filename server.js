const http=require('http'),fs=require('fs'),path=require('path'),os=require('os');
const {WebSocketServer}=require('ws');
const Q=require('./questions.js');
const PIN=process.env.HOST_PIN||String(1000+Math.floor(Math.random()*9000));
const PORT=process.env.PORT||3000,MAXT=5;
let G={phase:'lobby',q:-1,t0:0,timer:null};
let teams={},players={},answers={},viol={};
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
    teams:Object.entries(teams).map(([code,t])=>({code:host||me?.code===code?code:undefined,name:t.name,size:t.members.length,total:tot(t),
      last:G.phase==='reveal'?(t.byQ[G.q]??0):null,members:host||me?.code===code?t.members.map(i=>players[i].name):undefined})).sort((a,b)=>b.total-a.total),
    me:me?.code?{name:me.name,code:me.code,leader:teams[me.code].leader===ws.id}:null};
  if(qn&&(G.phase==='question'||G.phase==='reveal')){
    s.question={t:qn.t,tp:qn.tp,q:qn.q,o:qn.o,l:qn.l,r:qn.r,s:qn.s};
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

function startQ(n){clearTimeout(G.timer);G={phase:'question',q:n,t0:Date.now(),timer:null};answers[n]={};viol[n]=new Set();
  G.timer=setTimeout(reveal,Q[n].s*1000+1500);bc()}
function reveal(){
  if(G.phase!=='question')return;clearTimeout(G.timer);
  const n=G.q,q=Q[n],as=answers[n]||{};
  const ok=Object.entries(as).filter(([c,a])=>correct(q,a.ans));
  const fast=ok.length?Math.max(1,Math.min(...ok.map(([,a])=>a.ms))):1;
  for(const [code,t] of Object.entries(teams)){
    const a=as[code];let p=0;
    if(a&&correct(q,a.ans))p=Math.max(100,Math.round(1000*fast/Math.max(a.ms,fast)));
    if(viol[n]?.has(code))p=Math.max(0,p-150);
    t.byQ[n]=p;
  }
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
      if(m.t==='finish'&&G.phase==='reveal'){G.phase='done';return bc()}
      if(m.t==='reset'){clearTimeout(G.timer);G={phase:'lobby',q:-1,t0:0,timer:null};teams={};answers={};viol={};Object.values(players).forEach(p=>p.code=null);return bc()}
    }
    const name=String(m.name||'').trim().slice(0,20);
    if(m.t==='create'){
      const tn=String(m.team||'').trim().slice(0,20);
      if(G.phase!=='lobby')return err(ws,'Game already started');
      if(!name||!tn||me.code)return err(ws,'Enter your name and a team name');
      const c=code();teams[c]={name:tn,leader:ws.id,members:[ws.id],byQ:{}};me.name=name;me.code=c;return bc();
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
      if(answers[G.q][me.code]||ms>q.s*1000+500)return;
      answers[G.q][me.code]={ans:String(m.ans),ms};
      if(Object.keys(answers[G.q]).length>=Object.keys(teams).length){clearTimeout(G.timer);G.timer=setTimeout(reveal,700)}
      return bc();
    }
    if(m.t==='flag'&&G.phase==='question'&&me.code){viol[G.q].add(me.code)}
  });
  ws.on('close',()=>{});
});

server.listen(PORT,()=>{
  console.log('\n🔐 Crypto Quiz Battle running');
  console.log('   Teacher PIN :',PIN,process.env.HOST_PIN?'':'(set HOST_PIN env var to choose your own)');
  console.log('   Local       : http://localhost:'+PORT);
  for(const l of Object.values(os.networkInterfaces()).flat())if(l.family==='IPv4'&&!l.internal)console.log('   Students    : http://'+l.address+':'+PORT+'   <- share this on the same Wi-Fi');
});
