<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Juego: 100 Cartas (Anverso/Rev.)</title>
  <link rel="preload" href="assets/placeholder.png" as="image">
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="topbar">
    <h1>100 Cartas</h1>
    <div class="controls">
      <button id="shuffle" class="btn">Mezclar</button>
      <button id="reset" class="btn">Reset</button>
      <button id="showAllFront" class="btn">Mostrar anverso</button>
      <button id="showAllBack" class="btn">Mostrar reverso</button>
    </div>
  </header>

  <main>
    <div id="grid" class="grid" aria-live="polite"></div>
  </main>

  <footer class="footer">
    <p>Click o toca una carta para voltearla. Personaliza el contenido en <code>cards.json</code>.</p>
  </footer>

  <script src="script.js"></script>
</body>
</html>
* { box-sizing: border-box; }
:root{
  --bg: #0b1020; --panel:#131a2a; --muted:#8aa0b3; --text:#e6eef6;
  --accent:#7cc4ff; --radius:18px; --shadow:0 6px 18px rgba(0,0,0,.35);
}
html, body { height: 100%; }
body{
  margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, "Helvetica Neue", sans-serif;
  color: var(--text);
  background: radial-gradient(1000px 600px at 30% -10%, #18324d, transparent), var(--bg);
}
.topbar{
  position: sticky; top:0; z-index:10; display:flex; align-items:center; justify-content:space-between;
  padding:1rem 1.25rem; background:rgba(19,26,42,.8); backdrop-filter:saturate(120%) blur(6px);
  border-bottom:1px solid rgba(255,255,255,.06);
}
.topbar h1{ margin:0; font-size: clamp(1.1rem, 1.6vw, 1.6rem); }
.controls{ display:flex; gap:.5rem; flex-wrap:wrap }
.btn{ appearance:none; border:none; cursor:pointer; padding:.6rem .9rem; border-radius:12px;
  background:#1b2438; color:var(--text); box-shadow:var(--shadow); font-weight:600; }
.btn:hover{ transform: translateY(-1px); background:#24304b; }
.grid{
  --cols: 10; display:grid; gap:12px; padding:1rem; max-width:1200px; margin:0 auto;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
}
@media (max-width: 1100px){ .grid{ --cols: 8 } }
@media (max-width: 900px){ .grid{ --cols: 6 } }
@media (max-width: 700px){ .grid{ --cols: 5 } }
@media (max-width: 560px){ .grid{ --cols: 4 } }
@media (max-width: 440px){ .grid{ --cols: 3 } }
.card{ perspective:1000px; position:relative; height:0; padding-bottom:130%; }
.card-inner{
  position:absolute; inset:0; border-radius:var(--radius); overflow:hidden;
  transform-style:preserve-3d; transition: transform .6s; box-shadow:var(--shadow);
  background:#101728; border:1px solid rgba(255,255,255,.06);
}
.card.flipped .card-inner{ transform: rotateY(180deg); }
.card-face{ position:absolute; inset:0; backface-visibility:hidden; display:flex; align-items:center; justify-content:center; }
.card-face.front{
  background:#0f1628 url('assets/pattern.webp') center/cover no-repeat; overflow:hidden; color:#fff;
}
.card-face.front img{ width:100%; height:100%; object-fit:cover; display:block; filter:saturate(1.05) contrast(1.05); }
.overlay{
  position:absolute; left:0; right:0; bottom:0; padding:.45rem .6rem; background: linear-gradient(180deg, transparent, rgba(0,0,0,.65));
  font-size: clamp(.7rem, 1.1vw, .95rem); line-height:1.25;
}
.card-face.back{ background: linear-gradient(180deg, #0f1628, #0b1222); transform: rotateY(180deg); padding:10px; text-align:center; }
.card-text{ font-size: clamp(.8rem, 1.2vw, 1rem); line-height:1.25; color:var(--text); word-break:break-word; }
.footer{ max-width:1100px; margin:0 auto; padding:1rem; color:var(--muted); }
.hidden{ display:none }
// Juego: 100 cartas simultáneas (anverso: imagen + texto; reverso: texto)
// - Carga opcional desde cards.json (misma carpeta).
// - Si falla la carga, genera 100 cartas por defecto con placeholder.

const GRID = document.getElementById('grid');
const btnShuffle = document.getElementById('shuffle');
const btnReset = document.getElementById('reset');
const btnFront = document.getElementById('showAllFront');
const btnBack = document.getElementById('showAllBack');

let cards = [];

function makeDefaultCards(){
  const arr = [];
  for(let i=1;i<=100;i++){
    arr.push({
      frontImage: 'assets/placeholder.png',
      frontText: `Carta ${i}`,
      backText: `Reverso de la carta ${i}`,
      flipped: false,
    });
  }
  return arr;
}

async function loadCards(){
  try{
    const res = await fetch('cards.json', {cache:'no-store'});
    if(!res.ok) throw new Error('No cards.json');
    const data = await res.json();
    if(!Array.isArray(data)) throw new Error('cards.json debe ser un array');

    // Normalizar a 100
    const arr = makeDefaultCards();
    for(let i=0;i<Math.min(100, data.length); i++){
      const c = data[i] || {};
      arr[i] = {
        frontImage: typeof c.frontImage === 'string' ? c.frontImage : 'assets/placeholder.png',
        frontText: typeof c.frontText === 'string' ? c.frontText : `Carta ${i+1}`,
        backText: typeof c.backText === 'string' ? c.backText : `Reverso de la carta ${i+1}`,
        flipped: false,
      };
    }
    return arr;
  }catch(err){
    return makeDefaultCards();
  }
}

function render(){
  GRID.innerHTML = '';
  cards.forEach((c, idx)=>{
    const root = document.createElement('div');
    root.className = 'card' + (c.flipped ? ' flipped' : '');
    root.dataset.index = String(idx);

    const inner = document.createElement('div');
    inner.className = 'card-inner';

    const front = document.createElement('div');
    front.className = 'card-face front';
    const img = document.createElement('img');
    img.src = c.frontImage || 'assets/placeholder.png';
    img.alt = `Imagen carta ${idx+1}`;
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.textContent = c.frontText || '';
    front.appendChild(img);
    front.appendChild(overlay);

    const back = document.createElement('div');
    back.className = 'card-face back';
    const txt = document.createElement('div');
    txt.className = 'card-text';
    txt.textContent = c.backText || '';
    back.appendChild(txt);

    inner.appendChild(front);
    inner.appendChild(back);
    root.appendChild(inner);

    root.addEventListener('click', ()=>{
      const i = Number(root.dataset.index);
      cards[i].flipped = !cards[i].flipped;
      root.classList.toggle('flipped');
    });

    GRID.appendChild(root);
  });
}

function shuffleInPlace(a){
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random() * (i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

btnShuffle.addEventListener('click', ()=>{
  shuffleInPlace(cards);
  render();
});

btnReset.addEventListener('click', async ()=>{
  cards = await loadCards();
  render();
});

btnFront.addEventListener('click', ()=>{
  cards.forEach(c=> c.flipped = false);
  render();
});

btnBack.addEventListener('click', ()=>{
  cards.forEach(c=> c.flipped = true);
  render();
});

// Init
loadCards().then(arr=>{ cards = arr; render(); });
