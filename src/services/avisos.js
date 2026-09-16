let cola = [];
let siguienteId = 0;
const suscriptores = new Set();

export function suscribirAvisos(callback) {
  suscriptores.add(callback);
  return () => suscriptores.delete(callback);
}

export function obtenerAviso() {
  return cola[0] || null;
}

function publicar() {
  suscriptores.forEach((callback) => callback());
}

function agregarAviso(mensaje, opciones) {
  return new Promise((resolve) => {
    cola = [...cola, { id: ++siguienteId, mensaje, ...opciones, resolve }];
    publicar();
  });
}

export function mostrarAviso(mensaje, tipo = "error") {
  return agregarAviso(mensaje, { tipo, confirmacion: false });
}

export function pedirConfirmacion(mensaje) {
  return agregarAviso(mensaje, { tipo: "confirmacion", confirmacion: true });
}

export function responderAviso(id, respuesta) {
  if (cola[0]?.id !== id) return;
  const actual = cola[0];
  cola = cola.slice(1);
  actual.resolve(respuesta);
  publicar();
}
