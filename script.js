/* ---------- script.js - Full JS for CSK Fan Hub (high-DPI chart + polls + forum + social) ---------- */

/* ---------- CSK REALISTIC DATA (UPDATED) ---------- */
const sampleStats = {
  matches: 225,
  wins: 131,
  runs: 46928,
  wickets: 788,
  runsPerSeason: [
    { season: '2018', runs: 2735 },
    { season: '2019', runs: 2631 },
    { season: '2020', runs: 2280 },
    { season: '2021', runs: 2650 },
    { season: '2022', runs: 2385 },
    { season: '2023', runs: 2732 }
  ]
};

/* ---------- UTILS ---------- */
function scrollToSection(id){
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({behavior:'smooth'});
}

/* ---------- STATS RENDER ---------- */
function renderStats(data = sampleStats) {
  const tm = document.getElementById('total-matches');
  const tw = document.getElementById('total-wins');
  const tr = document.getElementById('total-runs');
  const twi = document.getElementById('total-wickets');
  if (tm) tm.textContent = data.matches;
  if (tw) tw.textContent = data.wins;
  if (tr) tr.textContent = data.runs;
  if (twi) twi.textContent = data.wickets;
  drawRunsChart(data.runsPerSeason);
}

/* ---------- HIGH-DPI SAFE DRAWING ---------- */
function drawRunsChart(points = []) {
  const canvas = document.getElementById('runsChart');
  if(!canvas) return;

  // handle high DPI for crisp rendering
  const DPR = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || 900;
  const cssHeight = canvas.clientHeight || 320;
  canvas.width = Math.round(cssWidth * DPR);
  canvas.height = Math.round(cssHeight * DPR);
  canvas.style.width = cssWidth + 'px';
  canvas.style.height = cssHeight + 'px';

  const ctx = canvas.getContext('2d');
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); // scale drawing operations

  // clear with transparent background
  ctx.clearRect(0,0,cssWidth,cssHeight);

  const pad = 50;
  const w = cssWidth - pad*2;
  const h = cssHeight - pad*2;
  const maxRun = Math.max(...points.map(p => p.runs)) || 1;

  // colors & styling
  const axisColor = 'rgba(255,255,255,0.12)';
  const gridColor = 'rgba(255,255,255,0.04)';
  const lineColor = '#ffd600';
  const pointFill = '#ffd600';
  const pointStroke = '#0f0f0f';
  const textColor = 'rgba(230,230,230,0.95)';

  // draw horizontal grid lines and Y labels (5 steps)
  const steps = 5;
  ctx.font = '12px Montserrat';
  for (let i = 0; i <= steps; i++) {
    const y = pad + (i / steps) * h;
    // grid line
    ctx.beginPath();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.moveTo(pad, y);
    ctx.lineTo(pad + w, y);
    ctx.stroke();

    // Y label (descending)
    const val = Math.round(maxRun * (1 - i / steps));
    const label = val.toLocaleString();
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    ctx.fillText(label, pad - 10, y + 4);
  }

  // draw x-axis baseline
  ctx.beginPath();
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 1.5;
  ctx.moveTo(pad, pad + h);
  ctx.lineTo(pad + w, pad + h);
  ctx.stroke();

  // compute points coordinates
  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1 || 1)) * w;
    const y = pad + h - (p.runs / maxRun) * h;
    return {x,y,season: p.season, runs: p.runs};
  });

  // draw filled area under curve
  if (coords.length) {
    ctx.beginPath();
    ctx.moveTo(coords[0].x, pad + h);
    coords.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(coords[coords.length - 1].x, pad + h);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, pad, 0, pad + h);
    grad.addColorStop(0, 'rgba(255,214,0,0.16)');
    grad.addColorStop(1, 'rgba(255,214,0,0.02)');
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // draw polyline
  ctx.beginPath();
  coords.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
  });
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  // draw points and labels
  coords.forEach(pt => {
    ctx.beginPath();
    ctx.fillStyle = pointFill;
    ctx.strokeStyle = pointStroke;
    ctx.lineWidth = 2;
    ctx.arc(pt.x, pt.y, 6, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();

    // season label (X axis)
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.font = '12px Montserrat';
    ctx.fillText(pt.season, pt.x, pad + h + 20);
  });
}

/* ---------- POLL ---------- */
const POLL_KEY = 'ipl_poll_votes_v1';
const POLL_VOTED_KEY = 'ipl_poll_voted_v1';
function getPollData() {
  const raw = localStorage.getItem(POLL_KEY);
  return raw ? JSON.parse(raw) : {
    'MS Dhoni': 320,
    'Ruturaj Gaikwad': 210,
    'Ravindra Jadeja': 180,
    'Matheesha Pathirana': 140
  };
}
function savePollData(d){ localStorage.setItem(POLL_KEY, JSON.stringify(d)); }
function renderPoll(){
  const data = getPollData();
  const total = Object.values(data).reduce((s,n)=>s+n,0);
  const container = document.getElementById('poll-results');
  if (!container) return;
  container.innerHTML = '';
  for(const opt in data){
    const count = data[opt];
    const pct = total ? Math.round((count/total)*100) : 0;
    const row = document.createElement('div');
    row.textContent = `${opt}: ${count} votes (${pct}%)`;
    container.appendChild(row);
  }
  const voted = localStorage.getItem(POLL_VOTED_KEY);
  document.querySelectorAll('.poll-btn').forEach(btn=>{
    btn.disabled = !!voted;
    btn.style.opacity = btn.disabled ? 0.6 : 1;
  });
}

// handle clicks for poll buttons (delegated)
document.addEventListener('click', (e)=>{
  if(e.target.classList && e.target.classList.contains('poll-btn')){
    const option = e.target.dataset.option;
    if (!option) return;
    const data = getPollData();
    data[option] = (data[option]||0) + 1;
    savePollData(data);
    localStorage.setItem(POLL_VOTED_KEY,'true');
    renderPoll();
  }
});

/* ---------- COMMENTS / FORUM ---------- */
const COMMENTS_KEY = 'ipl_comments_v1';
function getComments(){
  const raw = localStorage.getItem(COMMENTS_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveComments(list){ localStorage.setItem(COMMENTS_KEY, JSON.stringify(list)); }
function renderComments(){
  const list = getComments();
  const container = document.getElementById('commentsList');
  if (!container) return;
  container.innerHTML = '';
  if(!list.length){ container.innerHTML = '<p>No comments yet — be the first!</p>'; return; }
  // display newest first
  list.slice().reverse().forEach((c, idx) => {
    const div = document.createElement('div'); div.className='comment';
    const meta = document.createElement('div'); meta.className='meta';
    meta.textContent = `${c.name} • ${new Date(c.time).toLocaleString()}`;
    const del = document.createElement('button'); del.className='delete-btn'; del.textContent='Delete';
    del.addEventListener('click', ()=>{
      const realIndex = list.length - 1 - idx;
      list.splice(realIndex,1); saveComments(list); renderComments();
    });
    const text = document.createElement('div'); text.textContent = c.text;
    div.appendChild(meta); div.appendChild(del); div.appendChild(text);
    container.appendChild(div);
  });
}

// handle comment form submit (delegated)
document.addEventListener('submit', (e)=>{
  if(e.target && e.target.id === 'commentForm'){
    e.preventDefault();
    const nameEl = document.getElementById('commenterName');
    const textEl = document.getElementById('commentText');
    const name = nameEl ? nameEl.value.trim() : '';
    const text = textEl ? textEl.value.trim() : '';
    if(!name || !text) return;
    const list = getComments(); list.push({name,text,time:Date.now()});
    saveComments(list);
    e.target.reset();
    renderComments();
  }
});

/* ---------- SOCIAL FEED + SHARE ---------- */
const sampleFeed = [
  { author: 'ThalaFan07', text: 'Dhoni’s helicopter shot today… pure nostalgia!', time: Date.now() - 3000000 },
  { author: 'AnbuDen', text: 'Yellow Army will roar again this season!', time: Date.now() - 6000000 },
  { author: 'ChepaukBoy', text: 'Ruturaj is the future of CSK. What a player!', time: Date.now() - 9000000 },
  { author: 'WhistlePoduGirl', text: 'Jadeja is in insane form!🔥', time: Date.now() - 14000000 },
  { author: 'MSDianForever', text: 'Thala doesn’t age. He evolves ❤️💛', time: Date.now() - 21000000 }
];
let feedIndex = 0;
function renderFeed(count = 2){
  const feedEl = document.getElementById('socialFeed');
  if (!feedEl) return;
  const items = JSON.parse(localStorage.getItem('ipl_social_feed_v1') || 'null') || sampleFeed;
  // ensure feedIndex isn't larger than available
  if (feedIndex >= items.length) feedIndex = 0;
  feedEl.innerHTML = '';
  const slice = items.slice(0, feedIndex + count);
  slice.forEach(item=>{
    const div = document.createElement('div'); div.className='feed-item';
    const meta = document.createElement('div'); meta.style.fontSize='13px'; meta.style.color='#ddd';
    meta.textContent = `${item.author} • ${new Date(item.time).toLocaleString()}`;
    const txt = document.createElement('div'); txt.textContent = item.text;
    div.appendChild(meta); div.appendChild(txt); feedEl.appendChild(div);
  });
  feedIndex += count;
  const loadBtn = document.getElementById('loadMoreFeed');
  if (loadBtn) {
    if(feedIndex >= items.length) loadBtn.style.display = 'none';
    else loadBtn.style.display = 'inline-block';
  }
}
const loadMoreBtn = document.getElementById('loadMoreFeed');
if (loadMoreBtn) loadMoreBtn.addEventListener('click', ()=> renderFeed(2));

function initShareLinks(){
  const title = encodeURIComponent('Check out my favorite IPL team - CSK!');
  const url = encodeURIComponent(window.location.href);
  const t = document.getElementById('shareTwitter');
  const f = document.getElementById('shareFacebook');
  if(t) t.href = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
  if(f) f.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
}

/* ---------- ROBUST INIT (replace previous DOMContentLoaded block) ---------- */
(function initApp(){
  function readyToDraw() {
    // ensure elements exist
    const required = ['total-matches','total-wins','total-runs','total-wickets','runsChart'];
    for (const id of required) {
      if (!document.getElementById(id)) return false;
    }
    return true;
  }

  function boot() {
    try {
      renderStats();        // fill stat numbers and draw chart
      renderPoll();
      renderComments();
      initShareLinks();
      renderFeed(2);
      // draw with sampleStats explicitly (helps if initial sizes were zero)
      drawRunsChart(sampleStats.runsPerSeason);
    } catch (err) {
      console.error('Boot error:', err);
    }
  }

  // Wait until DOM ready and the key elements are present and visible.
  document.addEventListener('DOMContentLoaded', () => {
    const maxWait = 3000; // ms
    const start = Date.now();

    const poll = setInterval(() => {
      if (readyToDraw()) {
        clearInterval(poll);
        boot();
        // also redraw on resize for responsive canvas
        window.addEventListener('resize', () => drawRunsChart(sampleStats.runsPerSeason));
      } else if (Date.now() - start > maxWait) {
        // fallback: try one more time and log diagnostics
        clearInterval(poll);
        console.warn('Elements not ready after wait — attempting to boot anyway.');
        boot();
        window.addEventListener('resize', () => drawRunsChart(sampleStats.runsPerSeason));
      }
    }, 80);
  });
})();
