const token = localStorage.getItem('token');
const cont = document.getElementById('pedidos');
if (!token) {
  cont.innerHTML = `
    <div class="text-center py-5">
      <div style="font-size:48px;">🔒</div>
      <h4 class="mt-3">Inicia sesión</h4>
      <p class="text-muted">Debes iniciar sesión para ver tus pedidos.</p>
      <a href="login.html" class="btn btn-dark">Iniciar sesión</a>
    </div>
  `;
} else {
  cont.innerHTML = '<div class="text-muted text-center py-3">Cargando pedidos...</div>';
  fetch('http://localhost:5000/pedido/mis-pedidos', {
    headers: { 'Authorization': 'Bearer ' + token }
  })
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(pedidos => {
      if (!Array.isArray(pedidos) || !pedidos.length) {
        cont.innerHTML = `
          <div class="text-center py-5">
            <div style="font-size:48px;">📦</div>
            <h4 class="mt-3">Sin pedidos</h4>
            <p class="text-muted">Aún no has realizado ningún pedido.</p>
            <a href="index.html" class="btn btn-dark">Explorar catálogo</a>
          </div>
        `;
        return;
      }
      const estados = { 1: 'Pendiente', 2: 'Pagado', 3: 'Enviado', 4: 'Entregado', 5: 'Cancelado' };
      const badgeClass = { 1: 'bg-warning text-dark', 2: 'bg-info', 3: 'bg-primary', 4: 'bg-success', 5: 'bg-danger' };
      let html = '<div class="card shadow-sm"><div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead><tr><th>Pedido</th><th>Fecha</th><th>Total</th><th>Estado</th><th></th></tr></thead><tbody>';
      pedidos.forEach(p => {
        const est = p.id_estado || 1;
        const badge = `<span class="badge ${badgeClass[est] || 'bg-secondary'}">${estados[est] || p.estado || 'Desconocido'}</span>`;
        const fecha = p.fecha_pedido ? new Date(p.fecha_pedido).toLocaleDateString() : (p.fecha || '');
        html += `<tr>
          <td class="fw-semibold">#${p.id_pedido || p.id}</td>
          <td class="text-muted small">${fecha}</td>
          <td class="fw-semibold">$${Number(p.total).toLocaleString()}</td>
          <td>${badge}</td>
          <td><a href="detalle-pedido.html?id=${p.id_pedido || p.id}" class="btn btn-sm btn-outline-dark">Ver detalle</a></td>
        </tr>`;
      });
      html += '</tbody></table></div></div>';
      cont.innerHTML = html;
    })
    .catch(()=>{
      cont.innerHTML = '<div class="alert alert-danger">Error al cargar pedidos. Intenta recargar la página.</div>';
    });
}
