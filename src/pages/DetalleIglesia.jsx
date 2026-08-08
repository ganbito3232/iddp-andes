import { useEffect, useState } from "react";

import {
  ArrowLeft,
  Church,
  Pencil,
  Power,
  MapPin,
  FileText,
} from "lucide-react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { supabase } from "../lib/supabase";

export default function DetalleIglesia() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [iglesia, setIglesia] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarIglesia();
  }, [id]);

  const cargarIglesia = async () => {
    try {
      const { data, error } = await supabase
        .from("iglesias")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      setIglesia(data);
    } catch (error) {
      console.error(error);

      alert("No fue posible cargar la iglesia.");

      navigate("/iglesias");
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async () => {
    const nuevoEstado = !iglesia.activo;

    const confirmar = window.confirm(
      nuevoEstado
        ? "¿Quieres activar esta iglesia?"
        : "¿Quieres desactivar esta iglesia?",
    );

    if (!confirmar) {
      return;
    }

    try {
      const { error } = await supabase
        .from("iglesias")
        .update({
          activo: nuevoEstado,
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setIglesia((prev) => ({
        ...prev,
        activo: nuevoEstado,
      }));
    } catch (error) {
      console.error(error);

      alert("No fue posible cambiar el estado.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Cargando...</p>
      </div>
    );
  }

  if (!iglesia) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl">
        {/* HEADER */}

        <div className="mb-7 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/iglesias"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                IDDP LOS ANDES
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                {iglesia.nombre || "Sin nombre"}
              </h1>
            </div>
          </div>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              iglesia.activo
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {iglesia.activo ? "Activa" : "Inactiva"}
          </span>
        </div>

        <div className="space-y-5">
          {/* INFORMACIÓN */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Church size={25} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {iglesia.nombre || "Sin nombre"}
                </h2>

                {iglesia.ciudad && (
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin size={15} />

                    {iglesia.ciudad}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* OBSERVACIONES */}

          {iglesia.observaciones && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <FileText size={19} />
                </div>

                <div>
                  <h2 className="font-semibold">Observaciones</h2>

                  <p className="text-sm text-slate-500">
                    Información adicional
                  </p>
                </div>
              </div>

              <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {iglesia.observaciones}
              </p>
            </section>
          )}

          {/* ACCIONES */}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-3">
              <Link
                to={`/iglesias/${id}/editar`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Pencil size={17} />
                Editar
              </Link>

              <button
                type="button"
                onClick={cambiarEstado}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Power size={17} />

                {iglesia.activo ? "Desactivar" : "Activar"}
              </button>

              <Link
                to="/iglesias"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              >
                Volver
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
