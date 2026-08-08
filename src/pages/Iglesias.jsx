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
} from "lucide-react";

import { Link } from "react-router-dom";

import { supabase } from "../lib/supabase";

export default function Iglesias() {
  const [iglesias, setIglesias] = useState([]);

  const [loading, setLoading] = useState(true);

  const [busqueda, setBusqueda] = useState("");

  const [filtro, setFiltro] = useState("activas");

  const cargarIglesias = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("iglesias")
        .select(
          `
          id,
          nombre,
          ciudad,
          observaciones,
          activo,
          created_at
        `,
        )
        .order("nombre", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      setIglesias(data || []);
    } catch (error) {
      console.error("Error cargando iglesias:", error);

      alert("No fue posible cargar las iglesias.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarIglesias();
  }, []);
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
        {/* ESTADÍSTICAS */}
        {/* ================================================= */}

        {/* ================================================= */}
        {/* FILTROS */}
        {/* ================================================= */}

        <div className=" rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

            {/* ESTADO */}

            {/* REFRESCAR */}

            <button
              type="button"
              onClick={cargarIglesias}
              className="flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-slate-600 hover:bg-slate-50"
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
              {iglesiasFiltradas.map((iglesia) => (
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

                  {/* OBSERVACIONES */}

                  {iglesia.observaciones && (
                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
                      {iglesia.observaciones}
                    </p>
                  )}

                  {/* ACCIONES */}

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
              ))}
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
