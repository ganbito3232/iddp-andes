import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { obtenerSalas } from "../services/salas.service";
import { Plus, Search, School, Download } from "lucide-react";

import { exportarSalasExcel } from "../utils/exportarExcel";
export default function Salas() {
  const [salas, setSalas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);
  useEffect(() => {
    cargarSalas();
  }, []);

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
  const cargarSalas = async () => {
    try {
      setLoading(true);

      const data = await obtenerSalas();

      setSalas(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const salasFiltradas = salas.filter((sala) => {
    const texto = busqueda.toLowerCase();

    return (
      sala.nombre?.toLowerCase().includes(texto) ||
      sala.codigo?.toLowerCase().includes(texto) ||
      sala.ubicacion?.toLowerCase().includes(texto)
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
            Crea la primera sala para comenzar el catastro.
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
            <Link
              key={sala.id}
              to={`/salas/${sala.id}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
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
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
