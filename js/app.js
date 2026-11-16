'use strict';

/* =========================================================
   Control de Gastos — Actividad 3
   JavaScript ES6+: datos en objetos y arreglos, CRUD,
   manipulación del DOM, validación y localStorage.
   ========================================================= */

// ---------- Configuración ----------
const CLAVE_STORAGE = 'control-gastos:v1';

const CATEGORIAS = [
  { id: 'comida', nombre: 'Comida', color: '#e67e22' },
  { id: 'transporte', nombre: 'Transporte', color: '#2980b9' },
  { id: 'escuela', nombre: 'Escuela', color: '#8e44ad' },
  { id: 'entretenimiento', nombre: 'Entretenimiento', color: '#16a085' },
  { id: 'servicios', nombre: 'Servicios', color: '#c0392b' },
  { id: 'otros', nombre: 'Otros', color: '#7f8c8d' },
];

const MONTO_MINIMO = 0.01;
const MONTO_MAXIMO = 1_000_000;

// ---------- Estado de la aplicación ----------
// Arreglo de objetos: { id, descripcion, monto, categoria, fecha, creado }
let gastos = [];

// ---------- Referencias al DOM ----------
const $ = (selector) => document.querySelector(selector);

const form = $('#form-gasto');
const campos = {
  id: $('#gasto-id'),
  descripcion: $('#descripcion'),
  monto: $('#monto'),
  categoria: $('#categoria'),
  fecha: $('#fecha'),
};
const tituloForm = $('#titulo-form');
const btnGuardar = $('#btn-guardar');
const btnCancelar = $('#btn-cancelar');
const btnBorrarTodo = $('#btn-borrar-todo');
const inputBuscar = $('#buscar');
const selectFiltro = $('#filtro-categoria');
const selectOrden = $('#orden');
const tbody = $('#tabla-gastos');
const vacio = $('#vacio');
const infoFiltro = $('#info-filtro');
const aviso = $('#aviso');

// ---------- Utilidades ----------
const formatoMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const dinero = (cantidad) => formatoMoneda.format(cantidad);

// Fecha de hoy en formato AAAA-MM-DD (hora local, no UTC)
const hoyISO = () => {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
};

const fechaLegible = (iso) => {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
};

// Quita acentos y mayúsculas para que "cafeteria" encuentre "Cafetería"
const normalizar = (texto) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const buscarCategoria = (id) => CATEGORIAS.find((c) => c.id === id) ?? CATEGORIAS.at(-1);

const generarId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Evita que el texto del usuario se interprete como HTML
const escaparHTML = (texto) =>
  texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

let temporizadorAviso;
const mostrarAviso = (mensaje, tipo = 'exito') => {
  aviso.textContent = mensaje;
  aviso.className = `aviso aviso--${tipo} aviso--visible`;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => aviso.classList.remove('aviso--visible'), 2500);
};

// ---------- Persistencia (localStorage) ----------
const guardarEnStorage = () => {
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(gastos));
    return true;
  } catch {
    // Almacenamiento lleno o bloqueado (por ejemplo, en modo privado)
    mostrarAviso('No se pudo guardar en el navegador.', 'error');
    return false;
  }
};

// Comprueba que un registro leído del storage tenga la forma esperada
const esGastoValido = (g) =>
  g !== null &&
  typeof g === 'object' &&
  typeof g.id === 'string' &&
  typeof g.descripcion === 'string' &&
  typeof g.monto === 'number' &&
  Number.isFinite(g.monto) &&
  typeof g.fecha === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(g.fecha);

const cargarDeStorage = () => {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_STORAGE));
    if (!Array.isArray(datos)) return [];
    // Se descartan registros dañados; una categoría desconocida pasa a "Otros"
    return datos
      .filter(esGastoValido)
      .map((g) => ({ ...g, categoria: buscarCategoria(g.categoria).id }));
  } catch {
    // Si el JSON está dañado o el storage no está disponible, se empieza con una lista vacía
    return [];
  }
};

// ---------- Validación ----------
const validar = ({ descripcion, monto, categoria, fecha }) => {
  const errores = {};

  if (!descripcion) {
    errores.descripcion = 'La descripción es obligatoria.';
  } else if (descripcion.length < 3) {
    errores.descripcion = 'Escribe al menos 3 caracteres.';
  }

  if (monto === '') {
    errores.monto = 'El monto es obligatorio.';
  } else if (Number.isNaN(Number(monto)) || Number(monto) <= 0) {
    errores.monto = 'El monto debe ser un número mayor que 0.';
  } else if (Number(monto) < MONTO_MINIMO) {
    errores.monto = `El monto mínimo es ${dinero(MONTO_MINIMO)}.`;
  } else if (Number(monto) > MONTO_MAXIMO) {
    errores.monto = `El monto no puede superar ${dinero(MONTO_MAXIMO)}.`;
  }

  if (!CATEGORIAS.some((c) => c.id === categoria)) {
    errores.categoria = 'Selecciona una categoría.';
  }

  if (!fecha) {
    errores.fecha = 'La fecha es obligatoria.';
  } else if (fecha > hoyISO()) {
    errores.fecha = 'La fecha no puede ser futura.';
  }

  return errores;
};

const mostrarErrores = (errores) => {
  Object.keys(campos).forEach((nombre) => {
    const mensaje = $(`#error-${nombre}`);
    if (!mensaje) return;
    mensaje.textContent = errores[nombre] ?? '';
    campos[nombre].classList.toggle('invalido', Boolean(errores[nombre]));
  });
};

// ---------- Operaciones CRUD ----------
const agregarGasto = (datos) => {
  const nuevo = { id: generarId(), ...datos, creado: Date.now() };
  gastos = [...gastos, nuevo];
};

const editarGasto = (id, datos) => {
  gastos = gastos.map((g) => (g.id === id ? { ...g, ...datos } : g));
};

const eliminarGasto = (id) => {
  gastos = gastos.filter((g) => g.id !== id);
};

// ---------- Búsqueda, filtro y orden ----------
const comparadores = {
  'fecha-desc': (a, b) => b.fecha.localeCompare(a.fecha) || b.creado - a.creado,
  'fecha-asc': (a, b) => a.fecha.localeCompare(b.fecha) || a.creado - b.creado,
  'monto-desc': (a, b) => b.monto - a.monto,
  'monto-asc': (a, b) => a.monto - b.monto,
};

const obtenerVisibles = () => {
  const texto = normalizar(inputBuscar.value.trim());
  const categoria = selectFiltro.value;

  return gastos
    .filter((g) => categoria === 'todas' || g.categoria === categoria)
    .filter((g) => normalizar(g.descripcion).includes(texto))
    .sort(comparadores[selectOrden.value]);
};

// ---------- Cálculos automáticos ----------
const sumar = (lista) => lista.reduce((total, g) => total + g.monto, 0);

const totalesPorCategoria = () =>
  CATEGORIAS.map((cat) => ({
    ...cat,
    total: sumar(gastos.filter((g) => g.categoria === cat.id)),
  })).filter((cat) => cat.total > 0);

// ---------- Renderizado ----------
const renderTabla = () => {
  const visibles = obtenerVisibles();

  tbody.innerHTML = visibles
    .map(({ id, descripcion, monto, categoria, fecha }) => {
      const cat = buscarCategoria(categoria);
      return `
        <tr>
          <td data-titulo="Fecha">${fechaLegible(fecha)}</td>
          <td data-titulo="Descripción">${escaparHTML(descripcion)}</td>
          <td data-titulo="Categoría"><span class="etiqueta" style="--color:${cat.color}">${cat.nombre}</span></td>
          <td data-titulo="Monto" class="num">${dinero(monto)}</td>
          <td class="celda-acciones">
            <button type="button" class="btn-icono" data-accion="editar" data-id="${id}">Editar</button>
            <button type="button" class="btn-icono btn-icono--peligro" data-accion="eliminar" data-id="${id}">Eliminar</button>
          </td>
        </tr>`;
    })
    .join('');

  vacio.classList.toggle('oculto', visibles.length > 0);
  vacio.textContent = gastos.length === 0
    ? 'Aún no registras gastos. Usa el formulario para agregar el primero.'
    : 'Ningún gasto coincide con la búsqueda o el filtro.';

  const hayFiltro = inputBuscar.value.trim() !== '' || selectFiltro.value !== 'todas';
  infoFiltro.textContent = hayFiltro
    ? `Mostrando ${visibles.length} de ${gastos.length} gastos · Subtotal: ${dinero(sumar(visibles))}`
    : '';

  btnBorrarTodo.classList.toggle('oculto', gastos.length === 0);
};

const renderResumen = () => {
  const mesActual = hoyISO().slice(0, 7); // AAAA-MM
  const delMes = gastos.filter((g) => g.fecha.startsWith(mesActual));
  const porCategoria = totalesPorCategoria();
  const top = [...porCategoria].sort((a, b) => b.total - a.total)[0];

  $('#total-general').textContent = dinero(sumar(gastos));
  $('#total-mes').textContent = dinero(sumar(delMes));
  $('#contador').textContent = gastos.length;
  $('#categoria-top').textContent = top ? top.nombre : '—';

  const totalGeneral = sumar(gastos);
  $('#lista-categorias').innerHTML = porCategoria.length
    ? porCategoria
        .sort((a, b) => b.total - a.total)
        .map(({ nombre, color, total }) => {
          const porcentaje = Math.round((total / totalGeneral) * 100);
          return `
            <li>
              <div class="barras__texto"><span>${nombre}</span><span>${dinero(total)} (${porcentaje}%)</span></div>
              <div class="barras__fondo"><div class="barras__relleno" style="width:${porcentaje}%; background:${color}"></div></div>
            </li>`;
        })
        .join('')
    : '<li class="info">Sin datos todavía.</li>';
};

const render = () => {
  renderTabla();
  renderResumen();
};

// ---------- Formulario ----------
const leerFormulario = () => ({
  descripcion: campos.descripcion.value.trim(),
  monto: campos.monto.value.trim(),
  categoria: campos.categoria.value,
  fecha: campos.fecha.value,
});

const reiniciarFormulario = () => {
  form.reset();
  campos.id.value = '';
  campos.fecha.value = hoyISO();
  tituloForm.textContent = 'Nuevo gasto';
  btnGuardar.textContent = 'Agregar gasto';
  btnCancelar.classList.add('oculto');
  form.classList.remove('editando');
  mostrarErrores({});
};

const cargarEnFormulario = (id) => {
  const gasto = gastos.find((g) => g.id === id);
  if (!gasto) return;

  const { descripcion, monto, categoria, fecha } = gasto;
  campos.id.value = id;
  campos.descripcion.value = descripcion;
  campos.monto.value = monto;
  campos.categoria.value = categoria;
  campos.fecha.value = fecha;

  tituloForm.textContent = 'Editar gasto';
  btnGuardar.textContent = 'Guardar cambios';
  btnCancelar.classList.remove('oculto');
  form.classList.add('editando');
  mostrarErrores({});
  campos.descripcion.focus();
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ---------- Eventos ----------
form.addEventListener('submit', (evento) => {
  evento.preventDefault(); // evita recargar la página

  const datos = leerFormulario();
  const errores = validar(datos);
  mostrarErrores(errores);

  if (Object.keys(errores).length > 0) {
    mostrarAviso('Revisa los campos marcados en rojo.', 'error');
    campos[Object.keys(errores)[0]].focus();
    return;
  }

  const gasto = { ...datos, monto: Math.round(Number(datos.monto) * 100) / 100 };
  const idEdicion = campos.id.value;

  if (idEdicion) {
    editarGasto(idEdicion, gasto);
  } else {
    agregarGasto(gasto);
  }

  if (guardarEnStorage()) {
    mostrarAviso(idEdicion ? 'Gasto actualizado.' : 'Gasto agregado.');
  }
  reiniciarFormulario();
  render();
});

btnCancelar.addEventListener('click', reiniciarFormulario);

// Delegación de eventos: un solo listener para todos los botones de la tabla
tbody.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-accion]');
  if (!boton) return;

  const { accion, id } = boton.dataset;

  if (accion === 'editar') {
    cargarEnFormulario(id);
  }

  if (accion === 'eliminar') {
    const gasto = gastos.find((g) => g.id === id);
    if (!confirm(`¿Eliminar "${gasto.descripcion}" por ${dinero(gasto.monto)}?`)) return;
    eliminarGasto(id);
    if (campos.id.value === id) reiniciarFormulario();
    if (guardarEnStorage()) mostrarAviso('Gasto eliminado.');
    render();
  }
});

btnBorrarTodo.addEventListener('click', () => {
  if (!confirm('¿Seguro que quieres borrar TODOS los gastos? Esta acción no se puede deshacer.')) return;
  gastos = [];
  if (guardarEnStorage()) mostrarAviso('Se borraron todos los gastos.');
  reiniciarFormulario();
  render();
});

// Búsqueda, filtro y orden se actualizan al instante
inputBuscar.addEventListener('input', renderTabla);
selectFiltro.addEventListener('change', renderTabla);
selectOrden.addEventListener('change', renderTabla);

// Quitar el mensaje de error de un campo en cuanto el usuario lo corrige
Object.values(campos).forEach((campo) => {
  campo.addEventListener('input', () => {
    const mensaje = $(`#error-${campo.id}`);
    if (mensaje && campo.classList.contains('invalido')) {
      const errores = validar(leerFormulario());
      mensaje.textContent = errores[campo.id] ?? '';
      campo.classList.toggle('invalido', Boolean(errores[campo.id]));
    }
  });
});

// ---------- Inicio ----------
const llenarCategorias = () => {
  const opciones = CATEGORIAS.map(({ id, nombre }) => `<option value="${id}">${nombre}</option>`).join('');
  campos.categoria.insertAdjacentHTML('beforeend', opciones);
  selectFiltro.insertAdjacentHTML('beforeend', opciones);
};

const iniciar = () => {
  llenarCategorias();
  campos.fecha.max = hoyISO();
  gastos = cargarDeStorage();
  reiniciarFormulario();
  render();
};

iniciar();
