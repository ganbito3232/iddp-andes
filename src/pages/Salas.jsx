import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { obtenerSalas } from "../services/salas.service";
import {
  Plus,
  Search,
  School,
  Download,
  Trash2,
  X,
  Loader2,
} from "lucide-react";

import { exportarSalasExcel } from "../utils/exportarExcel";
import { supabase } from "../lib/supabase";

const TAB_COLEGIO_KEY = "salas_colegio_tab";

const TABS_COLEGIO = [
  {
    id: "Liceo Mixto",
    label: "Liceo Mixto",
  },
  {
    id: "Liceo República Argentina",
    label: "Liceo R. Argentina",
  },
  {
    id: "",
    label: "Sin colegio",
  },
];

export default function Salas() {
  const [salas, setSalas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [salaEliminar, setSalaEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // El tab queda guardado en el navegador.
  // Si sales de Salas y vuelves, se mantiene el último tab seleccionado.
  const [tabColegio, setTabColegio] = useState(() => {
    const guardado = localStorage.getItem(TAB_COLEGIO_KEY);

    const existe = TABS_COLEGIO.some((tab) => tab.id === guardado);

    return existe ? guardado : "Liceo Mixto";
  });

  useEffect(() => {
    cargarSalas();
  }, []);

  const cargarSalas = async () => {
    try {
      setLoading(true);

      const data = await obtenerSalas();

      setSalas(data || []);
    } catch (error) {
      console.error("Error cargando salas:", error);
    } finally {
      setLoading(false);
    }
  };

  const manejarCambiarTab = (tab) => {
    setTabColegio(tab);

    // Guardamos el tab globalmente en el navegador.
    localStorage.setItem(TAB_COLEGIO_KEY, tab);
  };

  const manejarExportarSalas = async () => {
    try {
      setExportando(true);

      await exportarSalasExcel(salas || []);
    } catch (error) {
      console.error("Error exportando salas:", error);

      alert("No fue posible generar el Excel de salas.");
    } finally {
      setExportando(false);
    }
  };

  const confirmarEliminarSala = async () => {
    if (!salaEliminar?.id || eliminando) {
      return;
    }

    const idSala = salaEliminar.id;

    try {
      setEliminando(true);

      console.log("=================================");
      console.log("ELIMINANDO SALA");
      console.log("ID:", idSala);
      console.log("NOMBRE:", salaEliminar.nombre);
      console.log("=================================");

      // =====================================================
      // 1. ELIMINAR IGLESIAS ASOCIADAS
      // =====================================================

      const { data: iglesiasEliminadas, error: iglesiasError } = await supabase
        .from("sala_iglesias")
        .delete()
        .eq("sala_id", idSala)
        .select();

      if (iglesiasError) {
        console.error("ERROR eliminando sala_iglesias:", iglesiasError);
        throw new Error(
          `No se pudieron eliminar las iglesias asociadas: ${iglesiasError.message}`,
        );
      }

      console.log("Iglesias eliminadas:", iglesiasEliminadas);

      // =====================================================
      // 2. ELIMINAR INVENTARIO ASOCIADO
      // =====================================================

      const { data: inventarioEliminado, error: inventarioError } =
        await supabase
          .from("sala_inventario")
          .delete()
          .eq("sala_id", idSala)
          .select();

      if (inventarioError) {
        console.error("ERROR eliminando sala_inventario:", inventarioError);

        throw new Error(
          `No se pudo eliminar el inventario asociado: ${inventarioError.message}`,
        );
      }

      console.log("Inventario eliminado:", inventarioEliminado);

      // =====================================================
      // 3. ELIMINAR LA SALA
      // =====================================================

      const { data: salaEliminada, error: salaError } = await supabase
        .from("salas")
        .delete()
        .eq("id", idSala)
        .select();

      if (salaError) {
        console.error("ERROR eliminando sala:", salaError);

        throw new Error(`No se pudo eliminar la sala: ${salaError.message}`);
      }

      // =====================================================
      // 4. COMPROBAR QUE REALMENTE SE ELIMINÓ
      // =====================================================

      if (!salaEliminada || salaEliminada.length === 0) {
        throw new Error(
          "Supabase no eliminó la sala. Puede ser un problema de permisos RLS.",
        );
      }

      console.log("Sala eliminada correctamente:", salaEliminada);

      // =====================================================
      // 5. ACTUALIZAR LA LISTA
      // =====================================================

      setSalas((prev) =>
        prev.filter((sala) => String(sala.id) !== String(idSala)),
      );

      // Cerrar modal
      setSalaEliminar(null);
    } catch (error) {
      console.error("=================================");
      console.error("ERROR FINAL ELIMINANDO SALA");
      console.error(error);
      console.error("=================================");

      // Por ahora mostramos el error real para saber
      // exactamente qué está bloqueando Supabase.
      alert(error?.message || "No fue posible eliminar la sala.");
    } finally {
      setEliminando(false);
    }
  };

  const salasFiltradas = salas.filter((sala) => {
    // Filtrar primero por colegio.
    const colegioSala = sala.colegio || "";

    if (colegioSala !== tabColegio) {
      return false;
    }

    // Después aplicar la búsqueda.
    const texto = busqueda.toLowerCase().trim();

    if (!texto) {
      return true;
    }

    return (
      sala.nombre?.toLowerCase().includes(texto) ||
      sala.codigo?.toLowerCase().includes(texto) ||
      sala.ubicacion?.toLowerCase().includes(texto) ||
      sala.colegio?.toLowerCase().includes(texto)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* HEADER */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Salas</h1>

          <p className="mt-1 text-sm text-slate-500">
            Catastro de las salas de alojamiento
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={manejarExportarSalas}
            disabled={exportando}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={18} />

            {exportando ? "Generando..." : "Exportar Excel"}
          </button>

          <Link
            to="/salas/nueva"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus size={18} />
            Nueva sala
          </Link>
        </div>
      </div>

      {/* TABS DE COLEGIO */}

      <div className="mb-6 overflow-x-auto">
        <div
          role="tablist"
          aria-label="Filtrar salas por colegio"
          className="inline-flex min-w-full rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm sm:min-w-0"
        >
          {TABS_COLEGIO.map((tab) => {
            const activo = tabColegio === tab.id;

            return (
              <button
                key={tab.id || "sin-colegio"}
                type="button"
                role="tab"
                aria-selected={activo}
                onClick={() => manejarCambiarTab(tab.id)}
                className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
                  activo
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* BUSCADOR */}

      <div className="mb-6">
        <div className="relative">
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar sala, código o ubicación..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-slate-400"
          />
        </div>
      </div>

      {/* COLEGIO ACTUAL */}

      {!loading && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
            <School size={19} className="text-slate-600" />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Colegio
            </p>

            <p className="font-semibold text-slate-900">
              {tabColegio || "Sin colegio"}
            </p>
          </div>
        </div>
      )}

      {/* CARGANDO */}

      {loading && (
        <div className="py-20 text-center text-sm text-slate-500">
          Cargando salas...
        </div>
      )}

      {/* SIN RESULTADOS */}

      {!loading && salasFiltradas.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <School size={40} className="mx-auto text-slate-300" />

          <h3 className="mt-4 font-semibold text-slate-800">
            No hay salas registradas
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            No hay salas para{" "}
            <span className="font-medium text-slate-700">
              {tabColegio || "Sin colegio"}
            </span>
            .
          </p>

          <Link
            to="/salas/nueva"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
          >
            <Plus size={17} />
            Crear sala
          </Link>
        </div>
      )}

      {/* SALAS */}

      {!loading && salasFiltradas.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {salasFiltradas.map((sala) => (
            <div
              key={sala.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <Link to={`/salas/${sala.id}`} className="block">
                <div className="aspect-[16/9] bg-slate-100">
                  {sala.foto_url ? (
                    <img
                      src={sala.foto_url}
                      alt={sala.nombre || "Sala"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <School size={40} className="text-slate-300" />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {sala.codigo || "Sin código"}
                  </p>

                  <h2 className="mt-1 font-semibold text-slate-900">
                    {sala.nombre || "Sin nombre"}
                  </h2>

                  {sala.ubicacion && (
                    <p className="mt-2 text-sm text-slate-500">
                      {sala.ubicacion}
                    </p>
                  )}

                  <div className="mt-3 pr-12">
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {sala.colegio || "Sin colegio"}
                    </span>
                  </div>
                </div>
              </Link>

              <button
                type="button"
                aria-label={`Eliminar ${sala.nombre || "sala"}`}
                title="Eliminar sala"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSalaEliminar(sala);
                }}
                className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-white text-red-500 shadow-sm transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
      {/* ================================================= */}
      {/* MODAL ELIMINAR SALA */}
      {/* ================================================= */}

      {salaEliminar && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={() => {
            if (!eliminando) {
              setSalaEliminar(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-eliminar-sala"
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl"
          >
            <div className="p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
                  <Trash2 size={25} className="text-red-600" />
                </div>

                <button
                  type="button"
                  onClick={() => setSalaEliminar(null)}
                  disabled={eliminando}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  aria-label="Cerrar"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="mt-5">
                <h2
                  id="titulo-eliminar-sala"
                  className="text-xl font-bold text-slate-900"
                >
                  ¿Eliminar esta sala?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Estás a punto de eliminar{" "}
                  <span className="font-semibold text-slate-800">
                    {salaEliminar.nombre || "esta sala"}
                  </span>
                  .
                </p>

                <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/70 p-4">
                  <p className="text-sm font-medium text-red-800">
                    Esta acción eliminará también las iglesias e inventario
                    asociados a la sala.
                  </p>

                  <p className="mt-1 text-xs text-red-600">
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSalaEliminar(null)}
                  disabled={eliminando}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={confirmarEliminarSala}
                  disabled={eliminando}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {eliminando ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 size={17} />
                      Sí, eliminar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
