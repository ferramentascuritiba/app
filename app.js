// ====== CONFIG ======
const API = 'https://app-54lj.onrender.com'; // <-- sua URL do Render

// Helper p/ chamar a API sempre com a base correta
const api = (path, opts = {}) => fetch(`${API}${path}`, opts);

let state = { items: [], sortKey: 'title', sortDir: 1 };

function fmtMoney(v){
  if(v===null || v===undefined || isNaN(v)) return '';
  return 'R$ ' + Number(v).toFixed(2);
}
function pct(v){ if(v===null || v===undefined || isNaN(v)) return ''; return (v*100).toFixed(1)+'%'; }

// ====== CONFIGURAÇÃO ======
async function loadConfig(){
  try {
    const r = await api('/api/config');
    const j = await r.json();
    // aceita ambas as chaves (camelCase e snake_case)
    const feedUrl   = j.feedUrl   ?? j.feed_url   ?? '';
    const minMargin = j.minMargin ?? j.min_margin ?? 0.15;
    document.querySelector('#feedUrl').value  = feedUrl;
    document.querySelector('#minMargin').value = Math.round((minMargin)*100);
  } catch (e) {
    console.error(e);
    alert('Não foi possível carregar a configuração.');
  }
}

async function saveConfig(){
  try {
    const feed_url   = document.querySelector('#feedUrl').value.trim();
    const min_margin = Number(document.querySelector('#minMargin').value)/100;

    const r = await api('/api/config', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ feed_url, min_margin })
    });

    if(!r.ok){
      // Alguns back-ends não implementam POST /api/config (como nosso mock).
      const t = await r.text();
      alert('Aviso: sua API pode não suportar salvar config. Resposta: ' + t);
      return;
    }
    alert('Configuração salva.');
  } catch (e) {
    console.error(e);
    alert('Erro ao salvar a configuração.');
  }
}

// ====== IMPORTAÇÃO ======
async function importFeed(){
  try {
    const feed_url = document.querySelector('#feedUrl').value.trim();
    const r = await api('/api/import', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ feed_url })
    });
    if(!r.ok){ const t = await r.text(); alert('Erro ao importar: '+t); return; }
    const j = await r.json();
    await reload();
    alert('Importação concluída. Itens processados: '+ (j.count ?? 0));
  } catch (e) {
    console.error(e);
    alert('Erro ao importar.');
  }
}

// ====== LISTAGEM / GRID ======
async function reload(){
  try {
    const q = document.querySelector('#search').value.trim();
    const action = document.querySelector('#actionFilter').value;
    const r = await api(`/api/products?q=${encodeURIComponent(q)}&action=${encodeURIComponent(action)}&limit=1000`);
    const j = await r.json();
    state.items = j.items || [];
    render();
  } catch (e) {
    console.error(e);
    alert('Erro ao carregar produtos.');
  }
}

function setSort(key){
  if(state.sortKey === key){ state.sortDir *= -1; } else { state.sortKey = key; state.sortDir = 1; }
  render();
}

function render(){
  let items = [...state.items];
  const k = state.sortKey; const d = state.sortDir;
  items.sort((a,b)=> (a[k]??'') > (b[k]??'') ? d : -d);
  const tb = document.querySelector('#grid tbody');
  tb.innerHTML = items.map(row => {
    const m = row.margin_pct;
    const action = row.action || '';
    let tag = `<span class="tag keep">Manter</span>`;
    if(action==='Baixar') tag = `<span class="tag down">Baixar</span>`;
    if(action==='Subir') tag = `<span class="tag up">Subir</span>`;
    if(action==='Aumentar') tag = `<span class="tag raise">Aumentar</span>`;
    return `<tr data-id="${row.id}">
      <td>${row.id}</td>
      <td>${row.title}</td>
      <td>${row.brand||''}</td>
      <td class="num">${fmtMoney(row.price)}</td>
      <td class="url"><a href="${row.url}" target="_blank">abrir</a></td>
      <td><input class="inp cost" type="number" step="0.01" value="${row.cost??''}"/></td>
      <td><input class="inp comp" type="number" step="0.01" value="${row.competitor_price??''}"/></td>
      <td class="num">${m!==null? pct(m):''}</td>
      <td>${tag}<div class="small">${row.reason||''}</div></td>
      <td class="num">${fmtMoney(row.suggested_price)}</td>
      <td><button class="btn-save">Salvar</button></td>
    </tr>`
  }).join('');

  // Attach events
  tb.querySelectorAll('.btn-save').forEach(btn => {
    btn.addEventListener('click', async (ev) => {
      const tr = ev.target.closest('tr');
      const id = tr.dataset.id;
      const cost = parseFloat(tr.querySelector('.cost').value);
      const competitor_price = parseFloat(tr.querySelector('.comp').value);
      try {
        const r = await api('/api/products/'+encodeURIComponent(id), {
          method:'PATCH',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({cost, competitor_price})
        });
        if(!r.ok){ alert('Erro ao salvar'); return; }
        const updated = await r.json();
        const idx = state.items.findIndex(x=>x.id===id);
        if(idx>=0) state.items[idx]=updated;
        render();
      } catch (e) {
        console.error(e);
        alert('Erro ao salvar');
      }
    });
  });
}

// ====== BOOT ======
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  document.querySelectorAll('th[data-key]').forEach(th => {
    th.addEventListener('click', ()=> setSort(th.dataset.key));
  });
  document.querySelector('#btnSaveCfg').addEventListener('click', saveConfig);
  document.querySelector('#btnReload').addEventListener('click', reload);
  document.querySelector('#btnImport').addEventListener('click', importFeed);
  document.querySelector('#search').addEventListener('input', ()=> reload());
  await reload();
});
