import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { normalizarColegio } from "../utils/colegios";
import { resumenAsignacion, resumenSala, puedeAsignarSala, validarAsignacion, salasParaGrupo, validarRetiro, ordenarSalasAsignadas } from "../utils/asignacionesIglesia";
import { asignarTipoSala } from "../services/asignarTipoSala";

async function cargarAsignaciones(iglesiaId) {
  const resultados = await Promise.all([
    supabase.from("iglesias").select("id, hombres, mujeres, activo").eq("id", iglesiaId).single(),
    supabase.from("salas").select("id, nombre, codigo, colegio, tipo_sala, activo").order("nombre"),
    supabase.from("sala_iglesias").select("id, sala_id, iglesia_id, cantidad, activo"),
  ]);
  for (const resultado of resultados) if (resultado.error) throw resultado.error;
  return { iglesia: resultados[0].data, salas: resultados[1].data || [], asignaciones: resultados[2].data || [] };
}

export default function AsignarIglesiaSalas({ iglesiaId, activa }) {
  const [tipo, setTipo] = useState(null);
  const [datos, setDatos] = useState(null);
  const [colegio, setColegio] = useState("");
  const [cantidades, setCantidades] = useState({});
  const [retiros, setRetiros] = useState({});
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const bloqueo = useRef(false);

  async function abrir(nuevoTipo) {
    if (bloqueo.current) return;
    bloqueo.current = true;
    setOcupado(true);
    setTipo(nuevoTipo);
    setDatos(null);
    setColegio("");
    setCantidades({});
    setRetiros({});
    setError("");
    setMensaje("");
    try {
      setDatos(await cargarAsignaciones(iglesiaId));
    } catch {
      setError("No se pudieron cargar las salas. Vuelve a pulsar Agregar para reintentar.");
    } finally {
      bloqueo.current = false;
      setOcupado(false);
    }
  }

  async function agregar(salaId) {
    if (bloqueo.current) return;
    bloqueo.current = true;
    setOcupado(true);
    setError("");
    setMensaje("");
    let guardado = false;
    let tipoDefinido = false;
    try {
      const cantidad = Number(cantidades[salaId] || 0);
      // Volver a consultar antes de guardar: el stock o el tipo pueden haber cambiado.
      let actuales = await cargarAsignaciones(iglesiaId);
      setDatos(actuales);
      validarAsignacion(actuales.iglesia, actuales.salas, actuales.asignaciones, salaId, tipo, cantidad);
      const sala = actuales.salas.find((item) => String(item.id) === String(salaId));
      tipoDefinido = await asignarTipoSala(supabase, sala, tipo);
      if (tipoDefinido) {
        actuales = await cargarAsignaciones(iglesiaId);
        setDatos(actuales);
        validarAsignacion(actuales.iglesia, actuales.salas, actuales.asignaciones, salaId, tipo, cantidad);
      }
      const existente = actuales.asignaciones.find((item) => String(item.sala_id) === String(salaId) && String(item.iglesia_id) === String(iglesiaId));
      const total = (existente?.activo !== false ? Number(existente?.cantidad || 0) : 0) + cantidad;
      let resultado;
      if (existente) {
        resultado = await supabase.from("sala_iglesias")
          .update({ cantidad: total, activo: true })
          .eq("id", existente.id).eq("cantidad", existente.cantidad)
          .select("id").single();
      } else {
        resultado = await supabase.from("sala_iglesias")
          .insert({ iglesia_id: iglesiaId, sala_id: salaId, cantidad: total, activo: true })
          .select("id").single();
      }
      if (resultado.error) throw resultado.error;
      guardado = true;
      setCantidades((prev) => ({ ...prev, [salaId]: 0 }));
      setDatos(await cargarAsignaciones(iglesiaId));
      setMensaje(`Se agregaron ${cantidad} ${tipo === "MUJER" ? "mujeres" : "hombres"} a la sala.`);
    } catch (err) {
      if (guardado) {
        setDatos(null);
        setMensaje("La asignación se guardó. Vuelve a pulsar Agregar para actualizar los disponibles.");
      } else {
        const detalle = err.code === "PGRST116"
          ? "No se confirmó la actualización. Recarga las salas y revisa los permisos si el problema continúa."
          : err.message || "No fue posible guardar la asignación.";
        setError(tipoDefinido
          ? `La sala quedó definida para ${tipo === "MUJER" ? "mujeres" : "hombres"}, pero no se confirmó la asignación de personas. ${detalle}`
          : detalle);
      }
    } finally {
      bloqueo.current = false;
      setOcupado(false);
    }
  }

  async function quitar(salaId) {
    if (bloqueo.current) return;
    bloqueo.current = true;
    setOcupado(true);
    setError("");
    setMensaje("");
    let guardado = false;
    try {
      const cantidad = Number(retiros[salaId] || 0);
      const actuales = await cargarAsignaciones(iglesiaId);
      setDatos(actuales);
      const relacion = validarRetiro(actuales.asignaciones, salaId, iglesiaId, cantidad);
      const { error: errorGuardar } = await supabase.from("sala_iglesias")
        .update({ cantidad: Number(relacion.cantidad) - cantidad })
        .eq("id", relacion.id).eq("iglesia_id", iglesiaId).eq("sala_id", salaId)
        .eq("cantidad", relacion.cantidad).select("id").single();
      if (errorGuardar) throw errorGuardar;
      guardado = true;
      setRetiros((prev) => ({ ...prev, [salaId]: 0 }));
      setDatos(await cargarAsignaciones(iglesiaId));
      setMensaje(`Se quitaron ${cantidad} personas de esta iglesia de la sala. Se actualizaron los disponibles.`);
    } catch (err) {
      if (guardado) {
        setDatos(null);
        setMensaje("Las personas se quitaron. Vuelve a seleccionar el grupo para actualizar los disponibles.");
      } else {
        setError(err.code === "PGRST116"
          ? "La asignación cambió o no tienes permisos para modificarla. Actualiza las salas y vuelve a intentarlo."
          : err.message || "No fue posible quitar las personas.");
      }
    } finally {
      bloqueo.current = false;
      setOcupado(false);
    }
  }

  const salasVisibles = ordenarSalasAsignadas(salasParaGrupo(datos?.salas || [], tipo), datos?.asignaciones || [], iglesiaId);
  const nombreColegio = (sala) => normalizarColegio(sala.colegio) || "Sin colegio";
  const colegios = [...new Set((datos?.salas || []).map(nombreColegio))].sort((a, b) => a.localeCompare(b, "es"));
  const colegiosAsignados = new Set(salasVisibles
    .filter((sala) => resumenSala(datos.asignaciones, sala.id, iglesiaId).deEstaIglesia > 0)
    .map(nombreColegio));
  const colegiosOrdenados = [...colegios].sort((a, b) => Number(colegiosAsignados.has(b)) - Number(colegiosAsignados.has(a)));
  const resumen = datos ? resumenAsignacion(datos.iglesia, datos.salas, datos.asignaciones, tipo) : null;
  const grupo = tipo === "MUJER" ? "mujeres" : "hombres";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">Asignar personas a salas</h2>
      <p className="mt-1 text-sm text-slate-500">Reparte las personas disponibles de esta iglesia por colegio. Cada sala aloja solo hombres o solo mujeres.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {[ ["MUJER", "Agregar mujeres a salas"], ["HOMBRE", "Agregar hombres a salas"] ].map(([valor, texto]) => (
          <button key={valor} type="button" aria-pressed={tipo === valor} disabled={ocupado || activa === false}
            onClick={() => abrir(valor)} className={`rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50 ${tipo === valor ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>
            {texto}
          </button>
        ))}
      </div>
      {activa === false && <p className="mt-3 text-sm text-slate-500">Activa la iglesia para asignar personas.</p>}
      {ocupado && <p role="status" className="mt-4 text-sm text-slate-500">Actualizando asignaciones...</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {mensaje && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{mensaje}</p>}
      {resumen && <>
        <div className="my-5 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-4 text-sm">
          <p>Total de {grupo}<strong className="block text-xl">{resumen.stock}</strong></p>
          <p>Ya asignados<strong className="block text-xl">{resumen.asignados}</strong></p>
          <p>Disponibles<strong className="block text-xl">{resumen.disponibles}</strong></p>
        </div>
        {resumen.disponibles === 0 && <p className="mb-4 text-sm text-slate-600">No quedan {grupo} disponibles para asignar.</p>}
        <div>
          <p className="text-sm font-semibold text-slate-700">Colegio</p>
          <div role="group" aria-label="Filtrar salas por colegio"
            className="mt-3 flex gap-2 overflow-x-auto rounded-2xl bg-slate-100 p-2">
            {[{ valor: "", nombre: "Todos" }, ...colegios.map((nombre) => ({ valor: nombre, nombre }))].map((opcion) => {
              const seleccionado = colegio === opcion.valor;
              const cantidadSalas = salasVisibles.filter((sala) => !opcion.valor || nombreColegio(sala) === opcion.valor).length;
              return (
                <button key={opcion.valor} type="button" aria-pressed={seleccionado}
                  disabled={ocupado} onClick={() => setColegio(opcion.valor)}
                  className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:opacity-50 sm:flex-1 ${seleccionado ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-900"}`}>
                  {opcion.nombre}
                  <span className={`rounded-full px-2 py-0.5 text-xs ${seleccionado ? "bg-white/15 text-white" : "bg-white text-slate-500"}`}>
                    {cantidadSalas}<span className="sr-only"> salas</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {colegiosOrdenados.filter((nombre) => !colegio || nombre === colegio).map((nombre) => (
          <div key={nombre} className="mt-6">
            <h3 className="font-semibold text-slate-800">{nombre}</h3>
            {!salasVisibles.some((sala) => nombreColegio(sala) === nombre) && <p className="mt-3 text-sm text-slate-500">No hay salas de {grupo} ni salas sin tipo definido en este colegio.</p>}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {salasVisibles.filter((sala) => nombreColegio(sala) === nombre).map((sala) => {
                const { total, deEstaIglesia } = resumenSala(datos.asignaciones, sala.id, iglesiaId);
                const habilitada = puedeAsignarSala(sala, datos.asignaciones, tipo);
                const etiqueta = sala.tipo_sala === "MUJER" ? "Solo mujeres" : sala.tipo_sala === "HOMBRE" ? "Solo hombres" : "Sin tipo definido";
                const cantidad = Number(cantidades[sala.id] || 0);
                const retiro = Number(retiros[sala.id] || 0);
                return <div key={sala.id} className="rounded-2xl border border-slate-200 p-4">
                  <Link to={`/salas/${sala.id}`} className="font-semibold text-slate-900 underline">{sala.nombre || sala.codigo || "Sala"}</Link>
                  <p className="mt-1 text-sm text-slate-500">{etiqueta}{sala.activo === false ? " · Inactiva" : ""}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                    <p>Total en la sala<strong className="block text-lg">{total}</strong></p>
                    <p>De esta iglesia<strong className="block text-lg">{deEstaIglesia}</strong></p>
                  </div>
                  {habilitada && !sala.tipo_sala && <p className="mt-3 text-sm text-slate-600">Al agregar personas, esta sala quedará definida para {grupo}.</p>}
                  {!habilitada && <p className="mt-3 text-sm text-slate-500">{sala.activo === false ? "Sala inactiva: no admite nuevas asignaciones." : !["HOMBRE", "MUJER"].includes(sala.tipo_sala) ? "Esta sala ya tiene personas sin un tipo definido. Revisa si son hombres o mujeres antes de agregar más." : "Esta sala corresponde al otro grupo; no permite mezclar hombres y mujeres."}</p>}
                  {!habilitada && sala.activo !== false && !["HOMBRE", "MUJER"].includes(sala.tipo_sala) && (
                    <Link to={`/salas/${sala.id}/editar`} className="mt-2 inline-block text-sm font-semibold underline">Definir tipo de sala</Link>
                  )}
                  <label className="mt-4 block text-sm">Cantidad a agregar
                    <input type="number" inputMode="numeric" min="0" step="1" max={resumen.disponibles}
                      value={cantidades[sala.id] ?? 0} disabled={ocupado || !habilitada || resumen.disponibles === 0}
                      onChange={(event) => setCantidades((prev) => ({ ...prev, [sala.id]: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-3" />
                  </label>
                  {habilitada && !ocupado && (
                    <p className="mt-2 text-sm text-slate-500" role="status">
                      {resumen.disponibles === 0
                        ? `Esta iglesia no tiene ${grupo} pendientes de asignar.`
                        : !Number.isSafeInteger(cantidad) || cantidad <= 0
                          ? `Escribe cuántas personas quieres agregar (de 1 a ${resumen.disponibles}). El 0 no agrega personas.`
                          : cantidad > resumen.disponibles
                            ? `Solo puedes agregar hasta ${resumen.disponibles} personas disponibles.`
                            : `Se agregarán ${cantidad} personas a las ${deEstaIglesia} que esta iglesia ya tiene en la sala.`}
                    </p>
                  )}
                  <button type="button" onClick={() => agregar(sala.id)}
                    disabled={ocupado || !habilitada || !Number.isSafeInteger(cantidad) || cantidad <= 0 || cantidad > resumen.disponibles}
                    className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">
                    Agregar a esta sala
                  </button>
                  {deEstaIglesia > 0 && (
                    <div className="mt-5 border-t border-slate-200 pt-4">
                      <label className="block text-sm">Cantidad a quitar de esta iglesia
                        <input type="number" inputMode="numeric" min="0" step="1" max={deEstaIglesia}
                          value={retiros[sala.id] ?? 0} disabled={ocupado}
                          onChange={(event) => setRetiros((prev) => ({ ...prev, [sala.id]: event.target.value }))}
                          className="mt-1 w-full rounded-xl border border-slate-200 p-3" />
                      </label>
                      <p className="mt-2 text-sm text-slate-500">Puedes quitar hasta {deEstaIglesia}. Volverán a estar disponibles para otra sala.</p>
                      <button type="button" onClick={() => quitar(sala.id)}
                        disabled={ocupado || !Number.isSafeInteger(retiro) || retiro <= 0 || retiro > deEstaIglesia}
                        className="mt-3 w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 disabled:opacity-40">
                        Quitar de esta sala
                      </button>
                    </div>
                  )}
                </div>;
              })}
            </div>
          </div>
        ))}
      </>}
    </section>
  );
}
