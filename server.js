const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tktwssvukmtfszuaqruy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_NX7zkmKgg0UDYuYvaUkfmQ_y2cC7HfG';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Función auxiliar para hablar con Supabase
async function sb(tabla, opciones = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}`, {
    method: opciones.method || 'GET',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: opciones.body ? JSON.stringify(opciones.body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// --- Movimientos ---
app.get('/api/movimientos', async (req, res) => {
  try {
    res.json(await sb('movimientos?select=*&order=fecha.desc'));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/movimientos', async (req, res) => {
  const { tipo, descripcion, monto, categoria, fecha } = req.body;
  if (!tipo || !descripcion || !monto || !categoria || !fecha) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  try {
    const creado = await sb('movimientos', { method: 'POST', body: { tipo, descripcion, monto, categoria, fecha } });
    res.json(creado[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/movimientos/:id', async (req, res) => {
  try {
    await sb(`movimientos?id=eq.${req.params.id}`, { method: 'DELETE' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Pagos recurrentes ---
app.get('/api/recurrentes', async (req, res) => {
  try {
    res.json(await sb('recurrentes?select=*'));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/recurrentes', async (req, res) => {
  const { descripcion, monto, categoria, dia } = req.body;
  if (!descripcion || !monto || !categoria || !dia) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  try {
    const creado = await sb('recurrentes', { method: 'POST', body: { descripcion, monto, categoria, dia } });
    res.json(creado[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/recurrentes/:id', async (req, res) => {
  try {
    await sb(`recurrentes?id=eq.${req.params.id}`, { method: 'DELETE' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Registrar un pago recurrente como gasto
app.post('/api/recurrentes/:id/pagar', async (req, res) => {
  try {
    const recs = await sb(`recurrentes?id=eq.${req.params.id}`);
    if (!recs.length) return res.status(404).json({ error: 'No encontrado' });
    const rec = recs[0];
    const hoy = new Date().toISOString().slice(0, 10);
    const creado = await sb('movimientos', {
      method: 'POST',
      body: { tipo: 'gasto', descripcion: rec.descripcion, monto: rec.monto, categoria: rec.categoria, fecha: hoy },
    });
    res.json(creado[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`App corriendo en http://localhost:${PORT}`);
  console.log(`Desde tu teléfono (misma WiFi): http://192.168.100.74:${PORT}`);
});
