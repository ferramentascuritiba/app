// index.js (mínimo para subir no Render)
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Vars do .env (ou das Environment Variables no Render)
const FEED_URL = process.env.FEED_URL || '';
const MIN_MARGIN = parseFloat(process.env.MIN_MARGIN || '0.15');
const AUTO_IMPORT_MINUTES = parseInt(process.env.AUTO_IMPORT_MINUTES || '0', 10);

// Rotas básicas (frente do Pages já consegue consumir)
app.get('/', (req, res) => res.json({ ok: true }));

app.get('/api/config', (req, res) => {
  res.json({
    feedUrl: FEED_URL,
    minMargin: MIN_MARGIN,
    autoImportMinutes: AUTO_IMPORT_MINUTES
  });
});

// Mock de produtos (trocaremos depois pelo seu import real)
let PRODUCTS = [];

app.get('/api/products', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  let items = PRODUCTS;
  if (q) {
    items = items.filter(p =>
      (p.sku || '').toLowerCase().includes(q) ||
      (p.title || '').toLowerCase().includes(q)
    );
  }
  res.json({ items, total: items.length });
});

app.post('/api/import', async (req, res) => {
  // TODO: aqui vai a lógica real de importar do FEED_URL e calcular preços
  PRODUCTS = []; // por enquanto vazio
  res.json({ ok: true, count: PRODUCTS.length });
});

// IMPORTANTe: ouvir na porta do Render e em 0.0.0.0
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
