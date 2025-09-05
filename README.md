# Dashboard Local de Gestão de Preços (Node.js)

Importa seu **feed do Merchant Center (XML/CSV)**, permite editar **custo** e **preço da concorrência**, e calcula **margem** e **sugestão de preço** automaticamente.

## 🚀 Como rodar
1) Instale o Node.js LTS.
2) Dentro da pasta do projeto, rode:
```bash
npm install
npm run start
```
3) Abra http://localhost:3000 no navegador.

> Se quiser auto-reload durante o desenvolvimento:
```bash
npm run dev
```

## ⚙️ Configuração
- O arquivo `.env` já vem apontando para o feed:
```
FEED_URL=https://www.ferramentascuritiba.com.br/xml/produtosGoogle.xml
MIN_MARGIN=0.15
PORT=3000
```
Você pode alterar isso pela interface (campos **Feed URL** e **Margem mínima**) e clicar **Salvar Configuração**.

## 🧠 Regras de sugestão de preço
- **Margem mínima** é respeitada primeiro (ex.: 15%). Se o preço atual não atinge a margem, a ação será **Aumentar** até o mínimo.
- Com **preço de concorrente** informado:
  - Se seu preço > concorrente em **>2%** → ação **Baixar** (até o preço do concorrente, respeitando margem mínima).
  - Se seu preço < concorrente em **>2%** → ação **Subir** (melhorar sua margem sem perder competitividade).
  - Dentro de ±2% → **Manter**.
- Sem preço de concorrente → **Manter** (considerando a margem já ok).

## 📦 Endpoints úteis (caso queira integrar)
- `POST /api/import` → `{ feed_url? }` importa/atualiza do feed e recalculta sugestões.
- `GET /api/products?q=&action=&limit=` → lista com cálculo de margem.
- `PATCH /api/products/:id` → `{ cost, competitor_price }` salva dados e recalculta sugestão.
- `GET /api/export` → exporta CSV.

## 🗂 Banco de dados
- Arquivo `data.sqlite` criado automaticamente na raiz do projeto.
- Tabelas: `products`, `config`.

## 🔒 Uso local
Este projeto é pensado para **uso local**, sem expor na internet. Se quiser acessar de outra máquina na mesma rede, você pode rodar usando o IP da máquina (ex.: `http://SEU_IP:3000`).

---

Feito para agilizar a rotina do Jeff — Ferramentas Curitiba. ✨
