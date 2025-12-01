// WePlay Web - simple SPA (Arabic RTL)
const views = {
  home: document.getElementById('home'),
  profile: document.getElementById('profile'),
  games: document.getElementById('games'),
  gameplay: document.getElementById('gameplay')
};
const coinEl = document.getElementById('coin-count');
const lbEl = document.getElementById('leaderboard');
const gamesListEl = document.getElementById('games-list');
const gameFrame = document.getElementById('game-frame');
const gameTitle = document.getElementById('game-title');
const defaultGames = [
  {id:'sample1', title:'لعبة التحدي السريع', src:'games/sample_game.html', reward:50},
  {id:'sample2', title:'لعبة الذاكرة', src:'games/sample_game.html', reward:30}
];

// Simple persistence using localStorage
function getStore(){ return JSON.parse(localStorage.getItem('weplay_store')||'{}') }
function setStore(s){ localStorage.setItem('weplay_store', JSON.stringify(s)) }
function ensure(){ let s=getStore(); s.coins = s.coins||0; s.profile = s.profile||{name:'زائر',avatar:''}; s.lb = s.lb||[]; s.lastDaily = s.lastDaily||0; s.games = s.games||{}; setStore(s); return s }

let store = ensure();
function renderCoins(){ coinEl.textContent = store.coins }
function renderLeaderboard(){ lbEl.innerHTML = ''; const arr = store.lb.sort((a,b)=>b.score-a.score).slice(0,10); if(!arr.length) lbEl.textContent='لا يوجد نتائج بعد'; arr.forEach(u=>{ const d=document.createElement('div'); d.className='card'; d.textContent = `${u.name} — ${u.score} نقطة`; lbEl.appendChild(d) }) }

// Navigation
function show(view){ Object.values(views).forEach(v=>v.classList.add('hidden')); views[view].classList.remove('hidden') }
document.querySelectorAll('.back').forEach(b=>b.addEventListener('click', ()=>show('home')))

// Profile
document.getElementById('open-profile').addEventListener('click', ()=>{
  document.getElementById('profile-name').value = store.profile.name || '';
  document.getElementById('profile-avatar').value = store.profile.avatar || '';
  show('profile');
});
document.getElementById('save-profile').addEventListener('click', ()=>{
  store.profile.name = document.getElementById('profile-name').value || 'زائر';
  store.profile.avatar = document.getElementById('profile-avatar').value || '';
  setStore(store); alert('تم الحفظ'); renderLeaderboard(); show('home');
});

// Games list
document.getElementById('open-games').addEventListener('click', ()=>{ renderGames(); show('games') });
function renderGames(){ gamesListEl.innerHTML=''; defaultGames.forEach(g=>{
  const el = document.createElement('div'); el.className='card';
  el.innerHTML = `<strong>${g.title}</strong><p>مكافأة: ${g.reward} عملة</p><button class="btn play" data-id="${g.id}">ابدا</button>`;
  gamesListEl.appendChild(el);
});
  document.querySelectorAll('.play').forEach(b=> b.addEventListener('click', (e)=>{
    const id = e.currentTarget.dataset.id;
    const g = defaultGames.find(x=>x.id===id);
    gameFrame.src = g.src;
    gameTitle.textContent = g.title;
    store.currentGame = g;
    setStore(store);
    show('gameplay');
  }));
}

// Finish game (simulate sending score from iframe)
document.getElementById('finish-game').addEventListener('click', ()=>{
  const g = store.currentGame; if(!g) return alert('ما في لعبة شغالة');
  const score = Math.floor(Math.random()*1000);
  alert(`أرسلت النتيجة: ${score}. حصلت على ${g.reward} عملة`);
  store.coins = (store.coins||0) + g.reward;
  // add to leaderboard
  store.lb = store.lb || [];
  store.lb.push({name: store.profile.name||'زائر', score, game: g.id, at: Date.now()});
  setStore(store); renderCoins(); renderLeaderboard(); show('home');
});

// Daily reward
document.getElementById('daily-btn').addEventListener('click', ()=>{
  const now = Date.now(); const DAY = 24*60*60*1000;
  if(now - (store.lastDaily||0) < DAY) return alert('استلمت المكافأة اليوم بالفعل');
  const reward = 100;
  store.coins = (store.coins||0) + reward;
  store.lastDaily = now;
  setStore(store); renderCoins(); alert('استلمت ' + reward + ' عملة');
});

// Init
renderCoins(); renderLeaderboard();

// PostMessage listener - allows game iframe to send score: {type:'score',score:123}
window.addEventListener('message', (ev)=>{
  try{
    const data = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
    if(data?.type === 'score'){ const score = Number(data.score)||0; const g = store.currentGame||{reward:0}; store.coins = (store.coins||0) + (g.reward||0); store.lb.push({name: store.profile.name||'زائر', score, at: Date.now()}); setStore(store); renderCoins(); renderLeaderboard(); alert('تم استلام النتيجة من اللعبة: ' + score) }
  }catch(e){}
});
