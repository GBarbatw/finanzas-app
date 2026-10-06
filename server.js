const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'datos.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function leerDatos() {
  if (!fs.existsSync(DB_FILE)) return { movimientos: [], recurrentes: [] };
  const datos = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  // Migrar formato viejo (lista de gastos)
  if (Array.isArray(datos)) {
    return {
      movimientos: datos.map(g => ({ ...g, tipo: 'gasto' })),
      recurrentes: [],
    };
  }
  if (!datos.recurrentes) datos.recurrentes = [];
  return datos;
}

function guardarDatos(datos) {
  fs.writeFileSync(DB_FILE, JSON.stringify(datos, null, 2));
}

// --- Movimientos ---
app.get('/api/movimientos', (req, res) => res.json(leerDatos().movimientos));

app.post('/api/movimientos', (req, res) => {
  const { tipo, descripcion, monto, categoria, fecha } = req.body;
  if (!tipo || !descripcion || !monto || !categoria || !fecha) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  const datos = leerDatos();
  const mov = { id: Date.now(), tipo, descripcion, monto: parseFloat(monto), categoria, fecha };
  datos.movimientos.push(mov);
  guardarDatos(datos);
  res.json(mov);
});

app.delete('/api/movimientos/:id', (req, res) => {
  const datos = leerDatos();
  datos.movimientos = datos.movimientos.filter(m => m.id !== parseInt(req.params.id));
  guardarDatos(datos);
  res.json({ ok: true });
});

// --- Pagos recurrentes ---
app.get('/api/recurrentes', (req, res) => res.json(leerDatos().recurrentes));

app.post('/api/recurrentes', (req, res) => {
  const { descripcion, monto, categoria, dia } = req.body;
  if (!descripcion || !monto || !categoria || !dia) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  const datos = leerDatos();
  const rec = { id: Date.now(), descripcion, monto: parseFloat(monto), categoria, dia: parseInt(dia) };
  datos.recurrentes.push(rec);
  guardarDatos(datos);
  res.json(rec);
});

app.delete('/api/recurrentes/:id', (req, res) => {
  const datos = leerDatos();
  datos.recurrentes = datos.recurrentes.filter(r => r.id !== parseInt(req.params.id));
  guardarDatos(datos);
  res.json({ ok: true });
});

// Registrar un pago recurrente como gasto
app.post('/api/recurrentes/:id/pagar', (req, res) => {
  const datos = leerDatos();
  const rec = datos.recurrentes.find(r => r.id === parseInt(req.params.id));
  if (!rec) return res.status(404).json({ error: 'No encontrado' });
  const hoy = new Date().toISOString().slice(0, 10);
  const mov = { id: Date.now(), tipo: 'gasto', descripcion: rec.descripcion, monto: rec.monto, categoria: rec.categoria, fecha: hoy };
  datos.movimientos.push(mov);
  guardarDatos(datos);
  res.json(mov);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`App corriendo en http://localhost:${PORT}`);
  console.log(`Desde tu teléfono (misma WiFi): http://192.168.100.74:${PORT}`);
});
