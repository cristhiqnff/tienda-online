const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const token = localStorage.getItem('token');
const cont = document.getElementById('detallePedido');

const estados = { 1: 'Pendiente', 2: 'Pagado', 3: 'Enviado', 4: 'Entregado', 5: 'Cancelado' };
const badgeClass = { 1: 'bg-warning text-dark', 2: 'bg-info', 3: 'bg-primary', 4: 'bg-success', 5: 'bg-danger' };

if (!token) {
  cont.innerHTML = `
    <div class="text-center py-5">
      <div style="font-size:48px;">🔒</div>
      <h4 class="mt-3">Inicia sesión</h4>
      <p class="text-muted">Debes iniciar sesión para ver el detalle del pedido.</p>
      <a href="login.html" class="btn btn-dark">Iniciar sesión</a>
    </div>
  `;
} else if (!id) {
  cont.innerHTML = '<div class="alert alert-warning">ID de pedido no especificado.</div>';
} else {
  cont.innerHTML = '<div class="text-muted text-center py-3">Cargando detalle...</div>';
  fetch(`http://localhost:5000/pedido/${id}`, {
    headers: { 'Authorization': 'Bearer ' + token }
  })
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(pedido => {
      if (!pedido) {
        cont.innerHTML = '<div class="alert alert-info">Pedido no encontrado.</div>';
        return;
      }

      const est = pedido.id_estado || 1;
      const badge = `<span class="badge ${badgeClass[est] || 'bg-secondary'}">${estados[est] || pedido.estado || ''}</span>`;
      const fecha = pedido.fecha_pedido ? new Date(pedido.fecha_pedido).toLocaleDateString() : (pedido.fecha || '');

      let html = `
        <div class="card shadow-sm p-4 mb-4">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h3 class="h5 mb-1">Pedido #${pedido.id_pedido || pedido.id}</h3>
              <div class="text-muted small">${fecha}</div>
            </div>
            <div class="text-end">
              ${badge}
              <div class="fw-bold fs-5 mt-1">$${Number(pedido.total).toLocaleString()}</div>
            </div>
          </div>
      `;

      const detalles = Array.isArray(pedido.detalles) ? pedido.detalles : [];
      if (detalles.length) {
        html += '<div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead><tr><th>Producto</th><th class="text-center">Cantidad</th><th class="text-end">Precio unit.</th><th class="text-end">Subtotal</th></tr></thead><tbody>';
        detalles.forEach(d => {
          const nombre = d.producto?.nombre || d.nombre_producto || ('Producto #' + d.id_producto);
          const sub = (d.cantidad * d.precio_unitario);
          html += `<tr><td>${nombre}</td><td class="text-center">${d.cantidad}</td><td class="text-end">$${Number(d.precio_unitario).toLocaleString()}</td><td class="text-end fw-semibold">$${Number(sub).toLocaleString()}</td></tr>`;
        });
        html += '</tbody></table></div>';
      } else {
        html += '<div class="text-muted">No hay productos en este pedido.</div>';
      }

      html += '</div>';
      cont.innerHTML = html;
    })
    .catch(()=>{
      cont.innerHTML = '<div class="alert alert-danger">Error al cargar el detalle del pedido. Intenta recargar la página.</div>';
    });
}
