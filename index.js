// index.js — back mínimo para o front do Pages funcionar
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ---- Config em memória (pega valores do Render se tiver) ----
let CONFIG = {
  feedUrl: process.env.FEED_URL || '',
  minMargin: parseFloat(process.env.MIN_MARGIN || '0.15'),
  autoImportMinutes: parseInt(process.env.AUTO_IMPORT_MINUTES || '0', 10),
};

// GET /api/config
app.get('/api/config', (req, res) => {
  res.json({
    feedUrl: CONFIG.feedUrl,
    minMargin: CONFIG.minMargin,
    autoImportMinutes: CONFIG.autoImportMinutes,
    // compat com seu front antigo:
    feed_url: CONFIG.feedUrl,
    min_margin: CONFIG.minMargin,
  });
});

// POST /api/config  (apenas atualiza em memória)
app.post('/api/config', (req, res) => {
  const body = req.body || {};
  const feedUrl   = body.feedUrl   ?? body.feed_url;
  const minMargin = body.minMargin ?? body.min_margin;
  if (typeof feedUrl === 'string') CONFIG.feedUrl = feedUrl.trim();
  if (!isNaN(minMargin)) CONFIG.minMargin = Number(minMargin);
  return res.json({ ok: true, ...CONFIG });
});

// ---- Produtos (em memória por enquanto) ----
let PRODUCTS = [];  // depois trocamos pela importação real + SQLite

// GET /api/products?q=&action=&limit=
app.get('/api/products', (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase();
  const action = (req.query.action || '').toString();
  const limit = Math.min(parseInt(req.query.limit || '1000', 10) || 1000, 5000);

  let items = [...PRODUCTS];

  if (q) {
    items = items.filter(p =>
      (p.sku || '').toLowerCase().includes(q) ||
      (p.title || '').toLowerCase().includes(q)
    );
  }
  if (action && action !== 'Todas') {
    items = items.filter(p => (p.action || '') === action);
  }

  res.json({ items: items.slice(0, limit), total: items.length });
});

// PATCH /api/products/:id  (salva custo/concorrente e recalcula campos básicos)
app.patch('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const { cost, competitor_price } = req.body || {};
  const idx = PRODUCTS.findIndex(p => String(p.id) === String(id));
  if (idx < 0) return res.status(404).send('Not found');

  if (!isNaN(cost)) PRODUCTS[idx].cost = Number(cost);
  if (!isNaN(competitor_price)) PRODUCTS[idx].competitor_price = Number(competitor_price);

  // Recalcula margem e sugestão (placeholder)
  const price = Number(PRODUCTS[idx].price || 0);
  const c = Number(PRODUCTS[idx].cost || 0);
  PRODUCTS[idx].margin_pct = price > 0 ? (price - c) / price : null;
  PRODUCTS[idx].suggested_price = price; // aqui entraria sua regra real

  return res.json(PRODUCTS[idx]);
});

// POST /api/import  (placeholder: limpa e "importa" 0 itens)
app.post('/api/import', async (req, res) => {
  // Aqui futuramente: baixar FEED_URL (XML/CSV), carregar para PRODUCTS, calcular suggested_price/action/reason etc.
  PRODUCTS = []; // por enquanto fica vazio para o front funcionar
  return res.json({ ok: true, count: PRODUCTS.length });
});

// GET /api/export  (CSV simples dos itens atuais)
app.get('/api/export', (req, res) => {
  const cols = [
    'id','sku','title','brand','price','url',
    'cost','competitor_price','margin_pct','action','reason','suggested_price'
  ];
  const header = cols.join(',');
  const lines = PRODUCTS.map(p => cols.map(k => {
    const v = p[k] ?? '';
    // CSV básico, sem aspas duplas escapadas — suficiente para teste
    return String(v).toString().replace(/[\r\n,]/g, ' ');
  }).join(','));
  const csv = [header, ...lines].join('\n');
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition','attachment; filename="produtos.csv"');
  res.send(csv);
});

// health
app.get('/', (req, res) => res.json({ ok: true }));

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
