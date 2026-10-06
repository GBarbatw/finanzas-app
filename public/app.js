let graficoCategorias, graficoMeses;

document.getElementById('fecha').valueAsDate = new Date();

document.getElementById('form-mov').addEventListener('submit', async (e) => {
  e.preventDefault();
  await fetch('/api/movimientos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tipo: document.getElementById('tipo').value,
      descripcion: document.getElementById('descripcion').value,
      monto: document.getElementById('monto').value,
      categoria: document.getElementById('categoria').value,
      fecha: document.getElementById('fecha').value,
    }),
  });
  e.target.reset();
  document.getElementById('fecha').valueAsDate = new Date();
  cargarTodo();
});

document.getElementById('form-rec').addEventListener('submit', async (e) => {
  e.preventDefault();
  await fetch('/api/recurrentes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      descripcion: document.getElementById('rec-descripcion').value,
      monto: document.getElementById('rec-monto').value,
      dia: document.getElementById('rec-dia').value,
      categoria: document.getElementById('rec-categoria').value,
    }),
  });
  e.target.reset();
  cargarTodo();
});

async function eliminarMovimiento(id) {
  await fetch(`/api/movimientos/${id}`, { method: 'DELETE' });
  cargarTodo();
}

async function eliminarRecurrente(id) {
  await fetch(`/api/recurrentes/${id}`, { method: 'DELETE' });
  cargarTodo();
}

async function pagarRecurrente(id) {
  await fetch(`/api/recurrentes/${id}/pagar`, { method: 'POST' });
  cargarTodo();
}

async function cargarTodo() {
  const [movs, recs] = await Promise.all([
    fetch('/api/movimientos').then(r => r.json()),
    fetch('/api/recurrentes').then(r => r.json()),
  ]);

  const ingresos = movs.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0);
  const gastos = movs.filter(m => m.tipo === 'gasto').reduce((s, m) => s + m.monto, 0);
  document.getElementById('total-ingresos').textContent = '$' + ingresos.toFixed(2);
  document.getElementById('total-gastos').textContent = '$' + gastos.toFixed(2);
  const elBalance = document.getElementById('balance');
  elBalance.textContent = '$' + (ingresos - gastos).toFixed(2);
  elBalance.className = ingresos - gastos >= 0 ? 'verde' : 'rojo';

  document.getElementById('lista-movimientos').innerHTML = movs.map(m =>
    `<li><span>${m.fecha} · <strong>${m.categoria}</strong> · ${m.descripcion}</span>
     <span class="${m.tipo === 'ingreso' ? 'verde' : 'rojo'}">${m.tipo === 'ingreso' ? '+' : '-'}$${m.monto.toFixed(2)}
     <button class="eliminar" onclick="eliminarMovimiento(${m.id})">✖</button></span></li>`
  ).join('');

  document.getElementById('lista-recurrentes').innerHTML = recs.map(r =>
    `<li><span>Día ${r.dia} · <strong>${r.categoria}</strong> · ${r.descripcion}</span>
     <span>$${r.monto.toFixed(2)}
     <button class="pagar" onclick="pagarRecurrente(${r.id})">💵 Pagar</button>
     <button class="eliminar" onclick="eliminarRecurrente(${r.id})">✖</button></span></li>`
  ).join('');

  const porCategoria = {};
  movs.filter(m => m.tipo === 'gasto').forEach(m => porCategoria[m.categoria] = (porCategoria[m.categoria] || 0) + m.monto);

  const porMes = {};
  movs.forEach(m => {
    const mes = m.fecha.slice(0, 7);
    if (!porMes[mes]) porMes[mes] = { ingresos: 0, gastos: 0 };
    porMes[mes][m.tipo === 'ingreso' ? 'ingresos' : 'gastos'] += m.monto;
  });
  const meses = Object.keys(porMes).sort();

  if (graficoCategorias) graficoCategorias.destroy();
  graficoCategorias = new Chart(document.getElementById('graficoCategorias'), {
    type: 'pie',
    data: {
      labels: Object.keys(porCategoria),
      datasets: [{ data: Object.values(porCategoria), backgroundColor: ['#4a6cf7','#f7b84a','#4af7a8','#f74a6c','#b84af7','#4adbf7','#f74af7'] }],
    },
  });

  if (graficoMeses) graficoMeses.destroy();
  graficoMeses = new Chart(document.getElementById('graficoMeses'), {
    type: 'bar',
    data: {
      labels: meses,
      datasets: [
        { label: 'Ingresos', data: meses.map(m => porMes[m].ingresos), backgroundColor: '#4af7a8' },
        { label: 'Gastos', data: meses.map(m => porMes[m].gastos), backgroundColor: '#f74a6c' },
      ],
    },
  });
}

cargarTodo();
