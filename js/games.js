/* Games module - 6 mini-games */

const Games = {
  openGame(name) {
    document.querySelectorAll('.game-screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('game-' + name);
    if (el) { el.classList.add('active'); Games[name] && Games[name].start(); }
  },
  closeGame() {
    document.querySelectorAll('.game-screen').forEach(s => s.classList.remove('active'));
  }
};

Games.wordgame = (() => {
  const words = ['cat','dog','sun','hat','big','run','hop','fox','bat','cup','map','top','jet','web','nut'];
  let wordList, idx, current, answer;

  function shuffle(arr) { return arr.sort(() => Math.random() - 0.5); }

  function render() {
    current = wordList[idx];
    answer  = [];
    document.getElementById('wg-score').textContent = (idx + 1) + ' / ' + wordList.length;
    document.getElementById('wg-hint').textContent  = current.toUpperCase().replace(/./g, '_ ').trim();
    const letters = shuffle(current.split(''));
    const bankEl  = document.getElementById('wg-bank');
    const slotsEl = document.getElementById('wg-slots');
    bankEl.innerHTML  = '';
    slotsEl.innerHTML = '';
    letters.forEach((ch, i) => {
      const tile = document.createElement('button');
      tile.className   = 'letter-tile';
      tile.textContent = ch.toUpperCase();
      tile.dataset.idx = i;
      tile.onclick = () => pickLetter(tile, ch, i);
      bankEl.appendChild(tile);
    });
    for (let i = 0; i < current.length; i++) {
      const slot = document.createElement('div');
      slot.className = 'answer-slot';
      slot.dataset.pos = i;
      slot.onclick = () => removeLetter(slot);
      slotsEl.appendChild(slot);
    }
  }

  function pickLetter(tile, ch, bankIdx) {
    if (tile.classList.contains('used')) return;
    tile.classList.add('used');
    const pos = answer.length;
    answer.push({ ch, bankIdx });
    const slot = document.querySelector('.answer-slot[data-pos="' + pos + '"]');
    if (slot) { slot.textContent = ch.toUpperCase(); slot.classList.add('filled'); slot.dataset.bankIdx = bankIdx; }
    if (answer.length === current.length) checkWord();
  }

  function removeLetter(slot) {
    const pos = parseInt(slot.dataset.pos);
    if (pos !== answer.length - 1) return;
    const { bankIdx } = answer.pop();
    const tile = document.querySelector('.letter-tile[data-idx="' + bankIdx + '"]');
    if (tile) tile.classList.remove('used');
    slot.textContent = ''; slot.classList.remove('filled');
  }

  function checkWord() {
    const guess = answer.map(a => a.ch).join('');
    if (guess === current) {
      document.querySelectorAll('.answer-slot').forEach(s => s.classList.add('correct'));
      document.getElementById('wg-feedback').textContent = '🎉 Correct!';
      setTimeout(() => {
        document.getElementById('wg-feedback').textContent = '';
        idx++;
        if (idx < wordList.length) render();
        else {
          document.getElementById('wg-bank').innerHTML  = '';
          document.getElementById('wg-slots').innerHTML = '';
          document.getElementById('wg-hint').textContent = '';
          document.getElementById('wg-feedback').textContent = '🏆 All done! Great job!';
          document.getElementById('wg-score').textContent = wordList.length + ' / ' + wordList.length;
        }
      }, 900);
    } else {
      document.getElementById('wg-feedback').textContent = '❌ Try again!';
      setTimeout(() => {
        document.getElementById('wg-feedback').textContent = '';
        answer = [];
        document.querySelectorAll('.letter-tile').forEach(t => t.classList.remove('used'));
        document.querySelectorAll('.answer-slot').forEach(s => { s.textContent = ''; s.classList.remove('filled','correct'); });
      }, 700);
    }
  }

  return { start() { wordList = shuffle([...words]).slice(0, 10); idx = 0; render(); } };
})();

Games.memory = (() => {
  const icons = ['🐶','🐱','🐰','🐼','🦊','🦄','🌟','🎈'];
  let flipped = [], matched = [], lockBoard = false, flipCount = 0;

  function render() {
    const pairs = [...icons, ...icons].sort(() => Math.random() - 0.5);
    const grid  = document.getElementById('memory-grid');
    grid.innerHTML = '';
    flipped = []; matched = []; flipCount = 0;
    document.getElementById('memory-flips').textContent = 'Flips: 0';
    pairs.forEach((icon, i) => {
      const card = document.createElement('button');
      card.className = 'memory-card';
      card.dataset.icon = icon;
      card.dataset.idx  = i;
      card.textContent  = '';
      card.setAttribute('aria-label', 'Memory card');
      card.onclick = () => flipCard(card);
      grid.appendChild(card);
    });
  }

  function flipCard(card) {
    if (lockBoard || card.classList.contains('flipped') || card.classList.contains('matched')) return;
    card.classList.add('flipped');
    card.textContent = card.dataset.icon;
    flipped.push(card);
    flipCount++;
    document.getElementById('memory-flips').textContent = 'Flips: ' + flipCount;
    if (flipped.length === 2) {
      lockBoard = true;
      const [a, b] = flipped;
      if (a.dataset.icon === b.dataset.icon) {
        a.classList.add('matched'); b.classList.add('matched');
        matched.push(a, b); flipped = []; lockBoard = false;
        if (matched.length === icons.length * 2)
          setTimeout(() => document.getElementById('memory-result').textContent = '🏆 Done in ' + flipCount + ' flips!', 400);
      } else {
        setTimeout(() => {
          a.classList.remove('flipped'); b.classList.remove('flipped');
          a.textContent = ''; b.textContent = '';
          flipped = []; lockBoard = false;
        }, 800);
      }
    }
  }

  return { start() { document.getElementById('memory-result').textContent = ''; render(); } };
})();

Games.math = (() => {
  let qIdx, score, questions;

  function genQ() {
    const op = Math.random() > 0.5 ? '+' : '-';
    let a, b;
    if (op === '+') { a = Math.floor(Math.random() * 9) + 1; b = Math.floor(Math.random() * 9) + 1; }
    else { a = Math.floor(Math.random() * 9) + 2; b = Math.floor(Math.random() * (a - 1)) + 1; }
    const ans = op === '+' ? a + b : a - b;
    const wrongs = new Set();
    while (wrongs.size < 3) { const w = ans + (Math.floor(Math.random() * 5) - 2); if (w !== ans && w >= 0) wrongs.add(w); }
    return { text: a + ' ' + op + ' ' + b + ' = ?', ans, choices: [ans, ...wrongs].sort(() => Math.random() - 0.5) };
  }

  function render() {
    if (qIdx >= questions.length) {
      document.getElementById('math-question').textContent = '🏆 Score: ' + score + ' / ' + questions.length;
      document.getElementById('math-choices').innerHTML = '';
      document.getElementById('math-progress').textContent = 'Finished!';
      return;
    }
    const q = questions[qIdx];
    document.getElementById('math-question').textContent = q.text;
    document.getElementById('math-progress').textContent = 'Question ' + (qIdx + 1) + ' / ' + questions.length;
    const el = document.getElementById('math-choices');
    el.innerHTML = '';
    q.choices.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'math-choice';
      btn.textContent = c;
      btn.onclick = () => { el.querySelectorAll('.math-choice').forEach(b => b.disabled = true); btn.classList.add(c === q.ans ? 'correct' : 'wrong'); if (c === q.ans) score++; document.getElementById('math-score-label').textContent = 'Score: ' + score; setTimeout(() => { qIdx++; render(); }, 700); };
      el.appendChild(btn);
    });
  }

  return { start() { questions = Array.from({length:10}, genQ); qIdx = 0; score = 0; document.getElementById('math-score-label').textContent = 'Score: 0'; render(); } };
})();

Games.colouring = (() => {
  const COLORS = ['#E53935','#E91E63','#9C27B0','#3F51B5','#2196F3','#00BCD4','#4CAF50','#8BC34A','#FFEB3B','#FF9800','#795548','#607D8B'];
  let selectedColor = COLORS[0];
  let animalIdx = 0;
  const animals = [
    '<circle cx="150" cy="200" r="80" fill="none" stroke="#333" stroke-width="4"/><ellipse cx="110" cy="120" rx="20" ry="50" fill="none" stroke="#333" stroke-width="4"/><ellipse cx="190" cy="120" rx="20" ry="50" fill="none" stroke="#333" stroke-width="4"/><circle cx="130" cy="195" r="12" fill="none" stroke="#333" stroke-width="3"/><circle cx="170" cy="195" r="12" fill="none" stroke="#333" stroke-width="3"/><circle cx="150" cy="220" r="8" fill="none" stroke="#333" stroke-width="3"/>',
    '<ellipse cx="140" cy="180" rx="90" ry="60" fill="none" stroke="#333" stroke-width="4"/><path d="M230 180 L280 130 L280 230 Z" fill="none" stroke="#333" stroke-width="4"/><circle cx="100" cy="165" r="12" fill="none" stroke="#333" stroke-width="3"/>',
    '<polygon points="150,50 175,120 250,120 190,165 210,240 150,195 90,240 110,165 50,120 125,120" fill="none" stroke="#333" stroke-width="5"/>'
  ];

  function init() {
    const canvas = document.getElementById('colour-canvas');
    const ctx    = canvas.getContext('2d');
    const pal    = document.getElementById('colour-palette');
    pal.innerHTML = '';
    COLORS.forEach(c => {
      const sw = document.createElement('button');
      sw.className = 'color-swatch' + (c === selectedColor ? ' active' : '');
      sw.style.background = c;
      sw.onclick = () => { selectedColor = c; document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active')); sw.classList.add('active'); };
      pal.appendChild(sw);
    });
    drawAnimal(canvas, ctx);
    canvas.onclick = e => {
      const rect = canvas.getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
      const y = Math.round((e.clientY - rect.top)  * (canvas.height / rect.height));
      floodFill(ctx, x, y, selectedColor);
    };
    document.getElementById('colour-next-btn').onclick = () => { animalIdx = (animalIdx+1) % animals.length; drawAnimal(canvas, ctx); };
    document.getElementById('colour-save-btn').onclick = () => { const a = document.createElement('a'); a.download='my-colouring.png'; a.href=canvas.toDataURL(); a.click(); };
  }

  function drawAnimal(canvas, ctx) {
    ctx.fillStyle = '#FFF'; ctx.fillRect(0,0,canvas.width,canvas.height);
    const img = new Image();
    img.onload = () => ctx.drawImage(img,0,0,canvas.width,canvas.height);
    img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="360" viewBox="0 0 300 360"><rect width="300" height="360" fill="white"/>' + animals[animalIdx] + '</svg>');
  }

  function floodFill(ctx, sx, sy, fillColor) {
    const canvas = ctx.canvas;
    const imgData = ctx.getImageData(0,0,canvas.width,canvas.height);
    const data = imgData.data;
    const idx = (sy * canvas.width + sx) * 4;
    const target = [data[idx],data[idx+1],data[idx+2],data[idx+3]];
    const fill = [parseInt(fillColor.slice(1,3),16),parseInt(fillColor.slice(3,5),16),parseInt(fillColor.slice(5,7),16),255];
    if (colorMatch(target,fill)) return;
    if (target[0]<50 && target[1]<50 && target[2]<50) return;
    const stack=[[sx,sy]], visited=new Set();
    while(stack.length){
      const [x,y]=stack.pop();
      if(x<0||x>=canvas.width||y<0||y>=canvas.height) continue;
      const key=y*canvas.width+x;
      if(visited.has(key)) continue;
      visited.add(key);
      const i=key*4;
      if(!colorMatch([data[i],data[i+1],data[i+2],data[i+3]],target)) continue;
      data[i]=fill[0];data[i+1]=fill[1];data[i+2]=fill[2];data[i+3]=255;
      stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
    }
    ctx.putImageData(imgData,0,0);
  }

  function colorMatch(a,b){return Math.abs(a[0]-b[0])<30&&Math.abs(a[1]-b[1])<30&&Math.abs(a[2]-b[2])<30;}

  return { start: init };
})();

Games.findobject = (() => {
  const scenes = [
    { scene:['🐶','🐱','🐰','🦊','🐼','🐸','🐢','🦁','🐧','🐨','🦝','🐮','🐷','🦓','🐴'],find:'🐶'},
    { scene:['🍎','🍊','🍋','🍇','🍓','🍒','🍑','🥝','🍌','🍍','🥭','🍈','🍉','🍐','🍑'],find:'🍋'},
    { scene:['🚂','🚃','🚄','🚅','🚆','🚇','🚈','🚉','🚊','🚝','🚞','🚋','🚌','🚍','🚎'],find:'🚂'}
  ];
  let round, found, total;

  function render() {
    if (round >= total) { document.getElementById('fo-instruction').textContent='🏆 You found everything!'; document.getElementById('fo-scene').innerHTML=''; return; }
    const sc=scenes[round%scenes.length]; found=false;
    document.getElementById('fo-instruction').textContent='Find the '+sc.find;
    document.getElementById('fo-score').textContent=round+' / '+total;
    const sceneEl=document.getElementById('fo-scene');
    sceneEl.innerHTML='';
    sc.scene.slice().sort(()=>Math.random()-0.5).forEach(icon=>{
      const btn=document.createElement('button');
      btn.textContent=icon;
      btn.style.cssText='font-size:30px;background:none;border:none;cursor:pointer;padding:6px;min-width:48px;min-height:48px;';
      btn.onclick=()=>{
        if(found)return;
        if(icon===sc.find){found=true;btn.style.transform='scale(1.5)';document.getElementById('fo-feedback').textContent='🎉 Found it!';setTimeout(()=>{document.getElementById('fo-feedback').textContent='';round++;render();},700);}
        else{document.getElementById('fo-feedback').textContent='❌ Not that one!';setTimeout(()=>{document.getElementById('fo-feedback').textContent='';},500);}
      };
      sceneEl.appendChild(btn);
    });
  }

  return { start(){ round=0;total=5;document.getElementById('fo-feedback').textContent='';render(); } };
})();

Games.puzzle = (() => {
  const emojis=['🌟','🦁','🐶','🚀','🌈','🏔️','🐬','🌺','⭐','🎉'];
  let tiles, blank, size=3, moves;

  function render(){
    const grid=document.getElementById('puzzle-grid');
    grid.style.cssText='display:grid;grid-template-columns:repeat('+size+',1fr);gap:6px;margin:16px auto;max-width:300px;';
    grid.innerHTML='';
    tiles.forEach((val,idx)=>{
      const cell=document.createElement('button');
      cell.style.cssText='aspect-ratio:1;border-radius:12px;font-size:40px;border:none;cursor:pointer;background:'+(val===0?'#EEE8FF':'linear-gradient(135deg,#7B5CBF,#5A3D9A)')+';color:white;';
      cell.textContent=val===0?'':emojis[(val-1)%emojis.length];
      cell.onclick=()=>move(idx);
      grid.appendChild(cell);
    });
    document.getElementById('puzzle-moves').textContent='Moves: '+moves;
    if(isSolved()) setTimeout(()=>document.getElementById('puzzle-result').textContent='🎉 Solved in '+moves+' moves!',200);
  }

  function move(idx){
    const adj=[blank-1,blank+1,blank-size,blank+size];
    if((idx===blank-1||idx===blank+1)&&Math.floor(idx/size)!==Math.floor(blank/size))return;
    if(!adj.includes(idx))return;
    tiles[blank]=tiles[idx];tiles[idx]=0;blank=idx;moves++;render();
  }

  function isSolved(){return tiles.every((v,i)=>v===(i+1)%(size*size));}

  function scramble(){
    for(let i=0;i<200;i++){
      const adj=[blank-1,blank+1,blank-size,blank+size].filter(x=>{
        if(x<0||x>=size*size)return false;
        if((x===blank-1||x===blank+1)&&Math.floor(x/size)!==Math.floor(blank/size))return false;
        return true;
      });
      const r=adj[Math.floor(Math.random()*adj.length)];
      tiles[blank]=tiles[r];tiles[r]=0;blank=r;
    }
  }

  return { start(){ size=3;tiles=Array.from({length:size*size},(_,i)=>(i+1)%(size*size));blank=size*size-1;moves=0;document.getElementById('puzzle-result').textContent='';scramble();render(); } };
})();
