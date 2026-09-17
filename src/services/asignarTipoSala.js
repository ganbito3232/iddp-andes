// Reclamar una sala sin tipo mediante una actualización condicional.
// Si otro usuario ya la definió, no sobrescribir su elección ni agregar personas.
export async function asignarTipoSala(cliente, sala, tipo) {
  if (sala.tipo_sala) return false;
  let consulta = cliente.from("salas")
    .update({ tipo_sala: tipo }).eq("id", sala.id);
  consulta = sala.tipo_sala == null
    ? consulta.is("tipo_sala", null)
    : consulta.eq("tipo_sala", "");
  consulta = sala.activo == null
    ? consulta.is("activo", null)
    : consulta.eq("activo", sala.activo);
  const { error } = await consulta.select("id").single();
  if (error) {
    throw new Error("No se pudo definir el tipo de sala. Puede haber cambiado o faltar permisos. Actualiza las salas e inténtalo nuevamente.");
  }
  return true;
}
