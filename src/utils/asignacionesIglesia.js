export function resumenSala(asignaciones, salaId, iglesiaId) {
  return asignaciones
    .filter((item) => String(item.sala_id) === String(salaId) && item.activo !== false)
    .reduce((resumen, item) => {
      const cantidad = Number(item.cantidad || 0);
      resumen.total += cantidad;
      if (String(item.iglesia_id) === String(iglesiaId)) resumen.deEstaIglesia += cantidad;
      return resumen;
    }, { total: 0, deEstaIglesia: 0 });
}

export function salasParaGrupo(salas, tipo) {
  return salas.filter((sala) => !sala.tipo_sala || sala.tipo_sala === tipo);
}

export function ordenarSalasAsignadas(salas, asignaciones, iglesiaId) {
  const asignadas = new Set(asignaciones
    .filter((item) => String(item.iglesia_id) === String(iglesiaId)
      && item.activo !== false && Number(item.cantidad) > 0)
    .map((item) => String(item.sala_id)));
  return [...salas].sort((a, b) =>
    Number(asignadas.has(String(b.id))) - Number(asignadas.has(String(a.id)))
    || (a.nombre || a.codigo || "").localeCompare(b.nombre || b.codigo || "", "es", { numeric: true }),
  );
}

export function validarRetiro(asignaciones, salaId, iglesiaId, cantidad) {
  if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {
    throw new Error("Ingresa un número entero mayor que 0 para quitar.");
  }
  const relacion = asignaciones.find((item) => String(item.sala_id) === String(salaId)
    && String(item.iglesia_id) === String(iglesiaId) && item.activo !== false);
  if (!relacion || cantidad > Number(relacion.cantidad || 0)) {
    throw new Error("No puedes quitar más personas de las que esta iglesia tiene asignadas a la sala.");
  }
  return relacion;
}

export function resumenAsignacion(iglesia, salas, asignaciones, tipo) {
  const tipos = new Map(salas.map((sala) => [String(sala.id), sala.tipo_sala]));
  const stock = Number(iglesia[tipo === "MUJER" ? "mujeres" : "hombres"] || 0);
  const asignados = asignaciones
    .filter((item) => String(item.iglesia_id) === String(iglesia.id) &&
      item.activo !== false && tipos.get(String(item.sala_id)) === tipo)
    .reduce((total, item) => total + Number(item.cantidad || 0), 0);
  return { stock, asignados, disponibles: Math.max(stock - asignados, 0) };
}

export function puedeAsignarSala(sala, asignaciones, tipo) {
  if (!sala || sala.activo === false || !["HOMBRE", "MUJER"].includes(tipo)) return false;
  if (sala.tipo_sala === tipo) return true;
  // No deducir el sexo de personas ya alojadas en una sala sin clasificar.
  return !sala.tipo_sala && resumenSala(asignaciones, sala.id, null).total === 0;
}

export function validarAsignacion(iglesia, salas, asignaciones, salaId, tipo, cantidad) {
  if (!["HOMBRE", "MUJER"].includes(tipo)) throw new Error("Selecciona hombres o mujeres.");
  if (iglesia.activo === false) throw new Error("La iglesia está inactiva.");
  if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {
    throw new Error("Ingresa un número entero mayor que 0.");
  }
  const sala = salas.find((item) => String(item.id) === String(salaId));
  if (!puedeAsignarSala(sala, asignaciones, tipo)) {
    throw new Error("La sala ya no está disponible para este grupo. No se pueden mezclar hombres y mujeres.");
  }
  const { disponibles } = resumenAsignacion(iglesia, salas, asignaciones, tipo);
  if (cantidad > disponibles) throw new Error(`Solo quedan ${disponibles} personas por asignar.`);
}
