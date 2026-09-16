export function normalizarColegio(colegio) {
  const nombre = colegio?.trim() || "";
  return ["Liceo Mixto", "Colegio Mixto"].includes(nombre)
    ? "Liceo Amancay"
    : nombre;
}
