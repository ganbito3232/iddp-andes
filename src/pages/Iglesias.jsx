import { useEffect, useMemo, useState } from "react";

import {
  Search,
  Plus,
  Pencil,
  Power,
  Church,
  MapPin,
  RefreshCw,
  Eye,
  Users,
  ChevronDown,
  ChevronUp,
  School,
  UserRound,
} from "lucide-react";

import { Link } from "react-router-dom";

import { supabase } from "../lib/supabase";

export default function Iglesias() {
  const [iglesias, setIglesias] = useState([]);

  const [loading, setLoading] = useState(true);

  const [busqueda, setBusqueda] = useState("");

  const [filtro, setFiltro] = useState("activas");

  // =====================================================
  // DISTRIBUCIÓN DE PERSONAS
  // =====================================================

  const [distribucion, setDistribucion] = useState({});

  const [distribucionesAbiertas, setDistribucionesAbiertas] = useState({});

  // =====================================================
  // CARGAR IGLESIAS
  // =====================================================

  const cargarIglesias = async () => {
    try {
      setLoading(true);

      // =================================================
      // IGLESIAS
      // =================================================

      const { data: iglesiasData, error: iglesiasError } = await supabase
        .from("iglesias")
        .select(
          `
          id,
          nombre,
          ciudad,
          observaciones,
          activo,
          created_at,
          hombres,
          mujeres,
          pastores,
          ninos
        `,
        )
        .order("nombre", {
          ascending: true,
        });

      if (iglesiasError) {
        throw iglesiasError;
      }

      const iglesiasActuales = iglesiasData || [];

      setIglesias(iglesiasActuales);

      // =================================================
      // SALAS
      // =================================================

      const { data: salasData, error: salasError } = await supabase
        .from("salas")
        .select(
          `
          id,
          nombre,
          codigo,
          tipo_sala,
          colegio
        `,
        )
        .order("nombre", {
          ascending: true,
        });

      if (salasError) {
        throw salasError;
      }

      // =================================================
      // RELACIÓN IGLESIA - SALA
      // =================================================

      const { data: relacionesData, error: relacionesError } = await supabase
        .from("sala_iglesias")
        .select(
          `
            id,
            iglesia_id,
            sala_id,
            cantidad,
            activo
          `,
        )
        .eq("activo", true);

      if (relacionesError) {
        throw relacionesError;
      }

      // =================================================
      // CREAR MAPA DE SALAS
      // =================================================

      const mapaSalas = {};

      (salasData || []).forEach((sala) => {
        mapaSalas[sala.id] = sala;
      });

      // =================================================
      // CONSTRUIR DISTRIBUCIÓN
      // =================================================

      const nuevaDistribucion = {};

      iglesiasActuales.forEach((iglesia) => {
        nuevaDistribucion[iglesia.id] = {
          hombres: [],
          mujeres: [],
          otros: [],
          total: 0,
          totalHombres: 0,
          totalMujeres: 0,
        };
      });

      (relacionesData || []).forEach((relacion) => {
        const iglesiaId = relacion.iglesia_id;

        const sala = mapaSalas[relacion.sala_id];

        if (!sala || !nuevaDistribucion[iglesiaId]) {
          return;
        }

        const cantidad = Number(relacion.cantidad || 0);

        if (cantidad <= 0) {
          return;
        }

        // ===============================================
        // NORMALIZAR SEXO
        // ===============================================

        const tipoSala = String(sala.tipo_sala || "")
          .trim()
          .toUpperCase();

        let sexo = "OTRO";

        if (
          tipoSala === "HOMBRE" ||
          tipoSala === "HOMBRES" ||
          tipoSala === "MASCULINO"
        ) {
          sexo = "HOMBRES";
        } else if (
          tipoSala === "MUJER" ||
          tipoSala === "MUJERES" ||
          tipoSala === "FEMENINO"
        ) {
          sexo = "MUJERES";
        }

        const registro = {
          id: relacion.id,
          salaId: sala.id,
          salaNombre: sala.nombre || "Sin nombre",
          salaCodigo: sala.codigo || "",
          colegio: sala.colegio || null,
          tipoSala: sala.tipo_sala || null,
          cantidad,
        };

        // ===============================================
        // HOMBRES
        // ===============================================

        if (sexo === "HOMBRES") {
          nuevaDistribucion[iglesiaId].hombres.push(registro);

          nuevaDistribucion[iglesiaId].totalHombres += cantidad;

          nuevaDistribucion[iglesiaId].total += cantidad;

          return;
        }

        // ===============================================
        // MUJERES
        // ===============================================

        if (sexo === "MUJERES") {
          nuevaDistribucion[iglesiaId].mujeres.push(registro);

          nuevaDistribucion[iglesiaId].totalMujeres += cantidad;

          nuevaDistribucion[iglesiaId].total += cantidad;

          return;
        }

        // ===============================================
        // OTROS / SIN TIPO DE SALA
        // ===============================================

        nuevaDistribucion[iglesiaId].otros.push(registro);

        nuevaDistribucion[iglesiaId].total += cantidad;
      });

      setDistribucion(nuevaDistribucion);
    } catch (error) {
      console.error("Error cargando iglesias:", error);

      alert(error?.message || "No fue posible cargar las iglesias.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarIglesias();
  }, []);

  // =====================================================
  // ABRIR / CERRAR DISTRIBUCIÓN
  // =====================================================

  const alternarDistribucion = (iglesiaId) => {
    setDistribucionesAbiertas((prev) => ({
      ...prev,
      [iglesiaId]: !prev[iglesiaId],
    }));
  };

  // =====================================================
  // FILTRO
  // =====================================================

  const iglesiasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return iglesias.filter((iglesia) => {
      // Estado

      if (filtro === "activas" && !iglesia.activo) {
        return false;
      }

      if (filtro === "inactivas" && iglesia.activo) {
        return false;
      }

      // Búsqueda

      if (!texto) {
        return true;
      }

      const contenido = [iglesia.nombre, iglesia.ciudad, iglesia.observaciones]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return contenido.includes(texto);
    });
  }, [iglesias, busqueda, filtro]);

  // =====================================================
  // ESTADÍSTICAS
  // =====================================================

  const total = iglesias.length;

  const activas = iglesias.filter((item) => item.activo).length;

  const inactivas = iglesias.filter((item) => !item.activo).length;

  // Evitamos warnings de variables que todavía no
  // están siendo mostradas en la interfaz.
  void total;
  void activas;
  void inactivas;

  // =====================================================
  // CAMBIAR ESTADO
  // =====================================================

  const cambiarEstado = async (iglesia) => {
    const nuevoEstado = !iglesia.activo;

    const mensaje = nuevoEstado
      ? "¿Quieres activar nuevamente esta iglesia?"
      : "¿Quieres desactivar esta iglesia?";

    if (!window.confirm(mensaje)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("iglesias")
        .update({
          activo: nuevoEstado,
        })
        .eq("id", iglesia.id);

      if (error) {
        throw error;
      }

      setIglesias((prev) =>
        prev.map((item) =>
          item.id === iglesia.id
            ? {
                ...item,
                activo: nuevoEstado,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error(error);

      alert("No fue posible cambiar el estado.");
    }
  };

  // =====================================================
  // AGRUPAR POR COLEGIO
  // =====================================================

  const agruparPorColegio = (registros) => {
    const grupos = {};

    (registros || []).forEach((registro) => {
      const colegio = registro.colegio?.trim()
        ? registro.colegio.trim()
        : "Sin colegio";

      if (!grupos[colegio]) {
        grupos[colegio] = {
          colegio,
          salas: [],
          total: 0,
        };
      }

      grupos[colegio].salas.push(registro);

      grupos[colegio].total += registro.cantidad;
    });

    return Object.values(grupos);
  };

  // =====================================================
  // COMPONENTE DE DISTRIBUCIÓN
  // =====================================================

  const DistribucionSexo = ({ titulo, registros, icon, tipo }) => {
    if (!registros || registros.length === 0) {
      return null;
    }

    const grupos = agruparPorColegio(registros);

    return (
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        {/* CABECERA SEXO */}

        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                tipo === "hombres"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-pink-50 text-pink-600"
              }`}
            >
              {icon}
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">{titulo}</p>

              <p className="text-xs text-slate-400">
                {registros.reduce((sum, item) => sum + item.cantidad, 0)}{" "}
                personas
              </p>
            </div>
          </div>
        </div>

        {/* COLEGIOS */}

        <div className="space-y-3 p-3">
          {grupos.map((grupo) => (
            <div
              key={grupo.colegio}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              {/* COLEGIO */}

              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <School size={15} className="shrink-0 text-slate-400" />

                  <span className="truncate text-xs font-bold text-slate-700">
                    {grupo.colegio}
                  </span>
                </div>

                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                  {grupo.total}
                </span>
              </div>

              {/* SALAS */}

              <div className="divide-y divide-slate-100">
                {grupo.salas.map((registro) => (
                  <div
                    key={registro.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-700">
                        {registro.salaNombre}
                      </p>

                      {registro.salaCodigo && (
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {registro.salaCodigo}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <Users size={13} className="text-slate-400" />

                      <span className="text-xs font-bold text-slate-700">
                        {registro.cantidad}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
                IDDP LOS ANDES
              </p>

              <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                Iglesias
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Iglesias participantes de la convención
              </p>
            </div>

            <Link
              to="/iglesias/nueva"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              <Plus size={18} />
              Nueva iglesia
            </Link>
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* CONTENIDO */}
      {/* ================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ================================================= */}
        {/* FILTROS */}
        {/* ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            {/* BUSCAR */}

            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar iglesia o ciudad..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-slate-400 focus:bg-white"
              />
            </div>

            {/* FILTRO ESTADO */}

            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setFiltro("activas")}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  filtro === "activas"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Activas
              </button>

              <button
                type="button"
                onClick={() => setFiltro("inactivas")}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  filtro === "inactivas"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Inactivas
              </button>

              <button
                type="button"
                onClick={() => setFiltro("todas")}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  filtro === "todas"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Todas
              </button>
            </div>

            {/* REFRESCAR */}

            <button
              type="button"
              onClick={cargarIglesias}
              className="flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-slate-600 hover:bg-slate-50"
              title="Actualizar"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        {/* ================================================= */}
        {/* LISTADO */}
        {/* ================================================= */}

        <div className="mt-5">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

              <p className="mt-4 text-sm text-slate-500">
                Cargando iglesias...
              </p>
            </div>
          ) : iglesiasFiltradas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Church size={40} className="mx-auto text-slate-300" />

              <h2 className="mt-4 font-semibold text-slate-800">
                No hay iglesias
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                No encontramos iglesias con esos criterios.
              </p>

              <Link
                to="/iglesias/nueva"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
              >
                <Plus size={17} />
                Agregar iglesia
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {iglesiasFiltradas.map((iglesia) => {
                const datos = distribucion[iglesia.id] || {
                  hombres: [],
                  mujeres: [],
                  otros: [],
                  total: 0,
                  totalHombres: 0,
                  totalMujeres: 0,
                };

                const abierta = !!distribucionesAbiertas[iglesia.id];

                const totalDistribuido = datos.total;

                return (
                  <article
                    key={iglesia.id}
                    className={`rounded-2xl border bg-white p-5 shadow-sm ${
                      iglesia.activo
                        ? "border-slate-200"
                        : "border-slate-200 opacity-70"
                    }`}
                  >
                    {/* HEADER CARD */}

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <Church size={20} />
                        </div>

                        <div className="min-w-0">
                          <h2 className="truncate font-bold text-slate-900">
                            {iglesia.nombre || "Sin nombre"}
                          </h2>

                          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin size={13} />

                            {iglesia.ciudad || "Sin ciudad"}
                          </div>
                        </div>
                      </div>

                      {/* ESTADO */}

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          iglesia.activo
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {iglesia.activo ? "Activa" : "Inactiva"}
                      </span>
                    </div>

                    {/* ================================================= */}
                    {/* RESUMEN PERSONAS */}
                    {/* ================================================= */}

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-blue-50 p-3">
                        <div className="flex items-center gap-1.5">
                          <UserRound size={14} className="text-blue-600" />

                          <span className="text-[10px] font-semibold text-blue-600">
                            Hombres
                          </span>
                        </div>

                        <p className="mt-1 text-lg font-bold text-blue-900">
                          {datos.totalHombres}
                        </p>
                      </div>

                      <div className="rounded-xl bg-pink-50 p-3">
                        <div className="flex items-center gap-1.5">
                          <UserRound size={14} className="text-pink-600" />

                          <span className="text-[10px] font-semibold text-pink-600">
                            Mujeres
                          </span>
                        </div>

                        <p className="mt-1 text-lg font-bold text-pink-900">
                          {datos.totalMujeres}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-100 p-3">
                        <div className="flex items-center gap-1.5">
                          <Users size={14} className="text-slate-600" />

                          <span className="text-[10px] font-semibold text-slate-600">
                            Total
                          </span>
                        </div>

                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {totalDistribuido}
                        </p>
                      </div>
                    </div>

                    {/* OBSERVACIONES */}

                    {iglesia.observaciones && (
                      <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
                        {iglesia.observaciones}
                      </p>
                    )}

                    {/* ================================================= */}
                    {/* BOTÓN DISTRIBUCIÓN */}
                    {/* ================================================= */}

                    <button
                      type="button"
                      onClick={() => alternarDistribucion(iglesia.id)}
                      className="mt-4 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
                    >
                      <div className="flex items-center gap-2">
                        <Users size={17} className="text-slate-600" />

                        <div>
                          <p className="text-xs font-bold text-slate-700">
                            Distribución
                          </p>

                          <p className="text-[10px] text-slate-400">
                            Colegio y sala
                          </p>
                        </div>
                      </div>

                      {abierta ? (
                        <ChevronUp size={18} className="text-slate-500" />
                      ) : (
                        <ChevronDown size={18} className="text-slate-500" />
                      )}
                    </button>

                    {/* ================================================= */}
                    {/* DISTRIBUCIÓN ABIERTA */}
                    {/* ================================================= */}

                    {abierta && (
                      <div className="mt-2">
                        {datos.hombres.length === 0 &&
                        datos.mujeres.length === 0 &&
                        datos.otros.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                            <Users
                              size={28}
                              className="mx-auto text-slate-300"
                            />

                            <p className="mt-2 text-xs font-semibold text-slate-600">
                              Sin personas asignadas
                            </p>

                            <p className="mt-1 text-[11px] text-slate-400">
                              Esta iglesia todavía no tiene personas
                              distribuidas en salas.
                            </p>
                          </div>
                        ) : (
                          <>
                            <DistribucionSexo
                              titulo="Hombres"
                              registros={datos.hombres}
                              tipo="hombres"
                              icon={<UserRound size={16} />}
                            />

                            <DistribucionSexo
                              titulo="Mujeres"
                              registros={datos.mujeres}
                              tipo="mujeres"
                              icon={<UserRound size={16} />}
                            />

                            {/* OTROS */}

                            {datos.otros.length > 0 && (
                              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <div className="flex items-center gap-2">
                                  <Users size={16} className="text-slate-500" />

                                  <span className="text-xs font-bold text-slate-700">
                                    Sin tipo de sexo definido
                                  </span>
                                </div>

                                <div className="mt-3 space-y-2">
                                  {datos.otros.map((registro) => (
                                    <div
                                      key={registro.id}
                                      className="flex items-center justify-between rounded-xl bg-white px-3 py-2"
                                    >
                                      <div>
                                        <p className="text-xs font-semibold text-slate-700">
                                          {registro.salaNombre}
                                        </p>

                                        <p className="text-[10px] text-slate-400">
                                          {registro.colegio || "Sin colegio"}
                                        </p>
                                      </div>

                                      <span className="text-xs font-bold text-slate-700">
                                        {registro.cantidad}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* ================================================= */}
                    {/* ACCIONES */}
                    {/* ================================================= */}

                    <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                      <ActionButton
                        to={`/iglesias/${iglesia.id}`}
                        icon={<Eye size={17} />}
                        label="Ver"
                      />

                      <ActionButton
                        to={`/iglesias/${iglesia.id}/editar`}
                        icon={<Pencil size={17} />}
                        label="Editar"
                      />

                      <button
                        type="button"
                        onClick={() => cambiarEstado(iglesia)}
                        className="flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-slate-500 hover:bg-slate-100"
                      >
                        <Power size={17} />

                        <span className="text-[11px]">
                          {iglesia.activo ? "Desactivar" : "Activar"}
                        </span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// =====================================================
// STAT
// =====================================================

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">{label}</p>

          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// ACTION
// =====================================================

function ActionButton({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-slate-500 hover:bg-slate-100"
    >
      {icon}

      <span className="text-[11px]">{label}</span>
    </Link>
  );
}
