// Mostrar resumen del carrito
function getCarrito() {
  return JSON.parse(localStorage.getItem('carrito') || '[]');
}

function actualizarBadgeCarrito() {
  const badge = document.getElementById('cartCount');
  if (!badge) return;
  const carrito = getCarrito();
  const total = carrito.reduce((acc, item) => acc + (Number(item.cantidad) || 0), 0);
  badge.textContent = String(total);
  badge.style.display = total > 0 ? 'inline-block' : 'none';
}

async function cargarDepartamentos() {
  const deptoEl = document.getElementById('depto');
  if (!deptoEl) return;
  deptoEl.disabled = true;
  try {
    const res = await fetch('http://localhost:5000/ubicacion/departamentos');
    const data = await res.json();
    if (!res.ok) {
      deptoEl.innerHTML = '<option value="">No disponible</option>';
      return;
    }
    deptoEl.innerHTML = '<option value="">Seleccionar...</option>' +
      (Array.isArray(data) ? data : []).map(d => `<option value="${d.codigo_dane}">${d.nombre}</option>`).join('');
  } catch {
    deptoEl.innerHTML = '<option value="">No disponible</option>';
  } finally {
    deptoEl.disabled = false;
  }
}

async function cargarCiudadesPorDepartamento(codigoDepto, ciudadSeleccionada) {
  const ciudadEl = document.getElementById('ciudad');
  if (!ciudadEl) return;
  const dep = (codigoDepto || '').trim();
  if (!dep) {
    ciudadEl.innerHTML = '<option value="">Seleccionar...</option>';
    ciudadEl.disabled = true;
    return;
  }

  ciudadEl.disabled = true;
  ciudadEl.innerHTML = '<option value="">Cargando...</option>';
  try {
    const res = await fetch('http://localhost:5000/ubicacion/ciudades?departamento=' + encodeURIComponent(dep));
    const data = await res.json();
    if (!res.ok) {
      ciudadEl.innerHTML = '<option value="">No disponible</option>';
      ciudadEl.disabled = true;
      return;
    }
    ciudadEl.innerHTML = '<option value="">Seleccionar...</option>' +
      (Array.isArray(data) ? data : []).map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    ciudadEl.disabled = false;
    if (ciudadSeleccionada) {
      ciudadEl.value = ciudadSeleccionada;
    }
  } catch {
    ciudadEl.innerHTML = '<option value="">No disponible</option>';
    ciudadEl.disabled = true;
  }
}

function renderResumen() {
  const carrito = getCarrito();
  const cont = document.getElementById('resumen');
  if (!carrito.length) {
    cont.innerHTML = `
      <div class="text-center py-4">
        <div style="font-size:36px;">🛒</div>
        <p class="text-muted mt-2 mb-0">Tu carrito está vacío</p>
        <a href="index.html" class="btn btn-outline-dark btn-sm mt-2">Ir al catálogo</a>
      </div>
    `;
    const form = document.getElementById('checkoutForm');
    if (form) form.style.display = 'none';
    return;
  }
  const totalItems = carrito.reduce((a, i) => a + (Number(i.cantidad) || 0), 0);
  let total = 0;
  let html = `<div class="small text-muted mb-2">${totalItems} producto${totalItems !== 1 ? 's' : ''}</div>`;
  carrito.forEach(item => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    html += `
      <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
        <div>
          <div class="fw-semibold small">${item.nombre}</div>
          <div class="text-muted" style="font-size:12px;">Cantidad: ${item.cantidad} × $${Number(item.precio).toLocaleString()}</div>
        </div>
        <div class="fw-semibold">$${Number(subtotal).toLocaleString()}</div>
      </div>
    `;
  });
  html += `
    <div class="d-flex justify-content-between align-items-center pt-3">
      <span class="fw-bold">Total</span>
      <span class="fw-bold fs-5">$${Number(total).toLocaleString()}</span>
    </div>
  `;
  cont.innerHTML = html;
}
renderResumen();
actualizarBadgeCarrito();

document.addEventListener('DOMContentLoaded', async function () {
  const deptoEl = document.getElementById('depto');
  const ciudadEl = document.getElementById('ciudad');
  await cargarDepartamentos();

  if (deptoEl) {
    deptoEl.addEventListener('change', async function () {
      await cargarCiudadesPorDepartamento(deptoEl.value);
    });
  }

  const destinoDepto = (localStorage.getItem('destinoDepto') || '').trim();
  const destinoCiudad = (localStorage.getItem('destinoCiudad') || '').trim();
  if (deptoEl && destinoDepto) {
    deptoEl.value = destinoDepto;
    await cargarCiudadesPorDepartamento(destinoDepto, destinoCiudad);
  } else if (ciudadEl && destinoCiudad) {
    ciudadEl.disabled = false;
    ciudadEl.innerHTML = `<option value="${destinoCiudad}">${destinoCiudad}</option>`;
    ciudadEl.value = destinoCiudad;
  }

  const dir = (localStorage.getItem('checkoutDireccion') || '').trim();
  const indic = (localStorage.getItem('checkoutIndicaciones') || '').trim();
  const tel = (localStorage.getItem('checkoutTelefono') || '').trim();
  const dirEl = document.getElementById('direccion');
  const indicEl = document.getElementById('indicaciones');
  const telEl = document.getElementById('telefono');
  if (dirEl && dir && !dirEl.value) dirEl.value = dir;
  if (indicEl && indic && !indicEl.value) indicEl.value = indic;
  if (telEl && tel && !telEl.value) telEl.value = tel;
});

// Enviar pedido al backend (requiere login)
document.getElementById('checkoutForm').onsubmit = async function (e) {
  e.preventDefault();
  const direccion = document.getElementById('direccion').value.trim();
  const depto = (document.getElementById('depto')?.value || '').trim();
  const ciudad = document.getElementById('ciudad').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const indicaciones = (document.getElementById('indicaciones')?.value || '').trim();
  const metodoPago = document.getElementById('metodoPago').value;
  const carrito = getCarrito();
  const msg = document.getElementById('checkoutMsg');
  const btn = this.querySelector('button[type="submit"]');
  msg.textContent = '';
  const token = localStorage.getItem('token');
  if (!token) {
    msg.innerHTML = '<div class="alert alert-warning">Debes <a href="login.html?redirect=checkout.html">iniciar sesión</a> para comprar.</div>';
    return;
  }
  if (!carrito.length) {
    msg.innerHTML = '<div class="alert alert-warning">Tu carrito está vacío.</div>';
    return;
  }
  if (!direccion || !depto || !ciudad || !telefono) {
    msg.innerHTML = '<div class="alert alert-warning">Completa la dirección, departamento, ciudad y teléfono.</div>';
    return;
  }

  // Guardar datos de envío para reutilizar
  localStorage.setItem('destinoDepto', depto);
  localStorage.setItem('destinoCiudad', ciudad);
  localStorage.setItem('checkoutDireccion', direccion);
  localStorage.setItem('checkoutIndicaciones', indicaciones);
  localStorage.setItem('checkoutTelefono', telefono);

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Procesando...';

  try {
    const pedido = {
      id_estado: 1,
      metodo_pago: metodoPago,
      total: carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0),
      detalles: carrito.map(item => ({ id_producto: item.id, cantidad: item.cantidad, precio_unitario: item.precio }))
    };
    const res = await fetch('http://localhost:5000/pedido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(pedido)
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.removeItem('carrito');
      actualizarBadgeCarrito();
      // Show success state replacing the whole form area
      const main = document.querySelector('main .row') || document.querySelector('main');
      main.innerHTML = `
        <div class="col-12">
          <div class="card shadow-sm text-center p-5">
            <div style="font-size:64px;">✅</div>
            <h2 class="h4 mt-3 fw-bold">¡Pedido realizado con éxito!</h2>
            <p class="text-muted">Tu pedido ha sido registrado. Puedes verlo en la sección de pedidos.</p>
            <div class="d-flex gap-2 justify-content-center mt-3">
              <a href="mis-pedidos.html" class="btn btn-dark">Ver mis pedidos</a>
              <a href="index.html" class="btn btn-outline-dark">Seguir comprando</a>
            </div>
          </div>
        </div>
      `;
    } else {
      msg.innerHTML = '<div class="alert alert-danger">' + (data.error || 'Error al realizar pedido') + '</div>';
      btn.disabled = false;
      btn.textContent = 'Confirmar pedido';
    }
  } catch {
    msg.innerHTML = '<div class="alert alert-danger">Error de conexión. Intenta de nuevo.</div>';
    btn.disabled = false;
    btn.textContent = 'Confirmar pedido';
  }
}
