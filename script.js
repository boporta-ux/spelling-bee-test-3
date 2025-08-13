/* Juego: 100 cartas editables (imagen frente, texto reverso)
   - Click para voltear (modo juego)
   - Activa "Editar tarjetas" para abrir el editor al hacer click en una carta
   - Guarda en localStorage automáticamente
   - Importa/Exporta JSON
*/
const GRID = document.getElementById('grid');
const toggleEditBtn = document.getElementById('toggleEdit');
const editState = document.getElementById('editState');
const saveJSONBtn = document.getElementById('saveJSON');
const loadJSONInput = document.getElementById('loadJSON');
const resetAllBtn = document.getElementById('resetAll');

const editor = document.getElementById('editor');
const closeEditor = document.getElementById('closeEditor');
const textInput = document.getElementById('textInput');
const imageInput = document.getElementById('imageInput');
const saveCardBtn = document.getElementById('saveCard');
const flipPreviewBtn = document.getElementById('flipPreview');
const editorIndex = document.getElementById('editorIndex');

const STORAGE_KEY = 'editable_flip_cards_v1';

let state = {
  editMode: false,
  cards: []
};

function defaultCards(){
  const items = [];
  for(let i=1;i<=100;i++){
    items.push({
      text: 'Carta ' + i,
      image: 'assets/placeholder.png',
      flipped: false
    });
  }
  return items;
}

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw){ state.cards = defaultCards(); return; }
    const data = JSON.parse(raw);
    if(Array.isArray(data.cards) && data.cards.length === 100){
      state.cards = data.cards.map((c,i)=> ({
        text: typeof c.text === 'string' ? c.text : ('Carta ' + (i+1)),
        image: typeof c.image === 'string' ? c.image : 'assets/placeholder.png',
        flipped: !!c.flipped
      }));
    }else{
      state.cards = defaultCards();
    }
  }catch(e){
    console.warn('Fallo al cargar, usando por defecto', e);
    state.cards = defaultCards();
  }
}

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify({cards: state.cards}));
}

function render(){
  GRID.innerHTML = '';
  state.cards.forEach((card, idx)=>{
    const el = document.createElement('div');
    el.className = 'card' + (card.flipped ? ' flipped' : '');
    el.dataset.index = String(idx);

    const inner = document.createElement('div');
    inner.className = 'card-inner';

    const front = document.createElement('div');
    front.className = 'card-face front';
    const img = document.createElement('img');
    img.alt = 'Imagen de la carta ' + (idx+1);
    img.src = card.image || 'assets/placeholder.png';
    front.appendChild(img);

    const back = document.createElement('div');
    back.className = 'card-face back';
    const txt = document.createElement('div');
    txt.className = 'card-text';
    txt.textContent = card.text || '';
    back.appendChild(txt);

    inner.appendChild(front);
    inner.appendChild(back);
    el.appendChild(inner);
    GRID.appendChild(el);

    el.addEventListener('click', (ev)=>{
      const i = Number(el.dataset.index);
      if(state.editMode){
        openEditor(i);
      }else{
        state.cards[i].flipped = !state.cards[i].flipped;
        el.classList.toggle('flipped');
        save();
      }
    });
  });
}

function setEditMode(on){
  state.editMode = !!on;
  editState.textContent = on ? 'ON' : 'OFF';
  toggleEditBtn.classList.toggle('primary', on);
}

toggleEditBtn.addEventListener('click', ()=>{
  setEditMode(!state.editMode);
});

saveJSONBtn.addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify({cards: state.cards}, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cartas.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
});

loadJSONInput.addEventListener('change', (e)=>{
  const file = e.target.files?.[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const data = JSON.parse(String(reader.result));
      if(data && Array.isArray(data.cards)){
        // Normaliza a 100
        const normalized = [];
        for(let i=0;i<100;i++){
          const c = data.cards[i] ?? {};
          normalized.push({
            text: typeof c.text === 'string' ? c.text : ('Carta ' + (i+1)),
            image: typeof c.image === 'string' ? c.image : 'assets/placeholder.png',
            flipped: false
          });
        }
        state.cards = normalized;
        save();
        render();
        alert('Cartas cargadas correctamente.');
      }else{
        alert('JSON inválido. Debe tener { "cards": [ ... ] }');
      }
    }catch(err){
      alert('No se pudo leer el JSON.');
    }finally{
      e.target.value = '';
    }
  };
  reader.readAsText(file);
});

resetAllBtn.addEventListener('click', ()=>{
  if(confirm('¿Seguro que deseas reiniciar las 100 cartas al estado inicial?')){
    state.cards = defaultCards();
    save();
    render();
  }
});

// Editor
let editingIndex = null;

function openEditor(i){
  editingIndex = i;
  editorIndex.textContent = '#' + (i+1);
  textInput.value = state.cards[i].text || '';
  imageInput.value = state.cards[i].image || '';
  editor.classList.remove('hidden');
  editor.setAttribute('aria-hidden', 'false');
}

function closeEditorModal(){
  editor.classList.add('hidden');
  editor.setAttribute('aria-hidden', 'true');
  editingIndex = null;
}

closeEditor.addEventListener('click', closeEditorModal);
editor.addEventListener('click', (ev)=>{
  if(ev.target === editor){
    closeEditorModal();
  }
});

saveCardBtn.addEventListener('click', ()=>{
  if(editingIndex === null) return;
  state.cards[editingIndex].text = textInput.value.trim();
  state.cards[editingIndex].image = imageInput.value.trim() || 'assets/placeholder.png';
  save();
  render();
  // mantén edición encendida
  setEditMode(true);
  closeEditorModal();
});

flipPreviewBtn.addEventListener('click', ()=>{
  if(editingIndex === null) return;
  state.cards[editingIndex].flipped = !state.cards[editingIndex].flipped;
  save();
  render();
  openEditor(editingIndex); // reabrir para seguir editando
});

// Init
load();
render();
setEditMode(false);
