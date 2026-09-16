import { mostrarAviso, pedirConfirmacion } from "../services/avisos";
import { useEffect, useState } from "react";

import {
  ArrowLeft,
  Church,
  Pencil,
  Power,
  MapPin,
  FileText,
  Users,
  UserRound,
  Baby,
  CheckCircle2,
  XCircle,
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

  // =====================================================
  // CARGAR IGLESIA
  // =====================================================

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

      mostrarAviso("No fue posible cargar la iglesia.");

      navigate("/iglesias");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CAMBIAR ESTADO
  // =====================================================

  const cambiarEstado = async () => {
    const nuevoEstado = !iglesia.activo;

    const confirmar = await pedirConfirmacion(
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

      mostrarAviso("No fue posible cambiar el estado.");
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />

          <p className="text-sm text-slate-500">Cargando iglesia...</p>
        </div>
      </div>
    );
  }

  if (!iglesia) {
    return null;
  }

  // =====================================================
  // TOTAL PERSONAS
  // =====================================================

  const totalPersonas =
    Number(iglesia.hombres || 0) +
    Number(iglesia.mujeres || 0) +
    Number(iglesia.pastores || 0) +
    Number(iglesia.ninos || 0);

  // =====================================================
  // VISTA
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/iglesias"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                IDDP LOS ANDES
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                Detalle de iglesia
              </h1>
            </div>
          </div>

          {/* ESTADO */}

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
              iglesia.activo
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {iglesia.activo ? (
              <CheckCircle2 size={15} />
            ) : (
              <XCircle size={15} />
            )}

            {iglesia.activo ? "Activa" : "Inactiva"}
          </div>
        </div>

        <div className="space-y-5">
          {/* =====================================================
              INFORMACIÓN PRINCIPAL
          ===================================================== */}

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Church size={30} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Iglesia
                  </p>

                  <h2 className="mt-1 break-words text-2xl font-bold text-slate-900">
                    {iglesia.nombre || "Sin nombre"}
                  </h2>

                  {iglesia.ciudad && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin size={16} />

                      <span>{iglesia.ciudad}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ESTADO */}

            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 sm:px-8">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">
                  Estado de la iglesia
                </span>

                <span
                  className={`text-sm font-semibold ${
                    iglesia.activo ? "text-emerald-600" : "text-slate-500"
                  }`}
                >
                  {iglesia.activo
                    ? "Actualmente activa"
                    : "Actualmente inactiva"}
                </span>
              </div>
            </div>
          </section>

          {/* =====================================================
              CANTIDAD DE PERSONAS
          ===================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Users size={23} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Cantidad de personas
                </h2>

                <p className="text-sm text-slate-500">
                  Distribución actual de la congregación.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* HOMBRES */}

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                      <UserRound size={21} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-600">
                        Hombres
                      </p>

                      <p className="text-xs text-slate-400">Integrantes</p>
                    </div>
                  </div>

                  <p className="text-3xl font-bold text-slate-900">
                    {Number(iglesia.hombres || 0)}
                  </p>
                </div>
              </div>

              {/* MUJERES */}

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                      <UserRound size={21} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-600">
                        Mujeres
                      </p>

                      <p className="text-xs text-slate-400">Integrantes</p>
                    </div>
                  </div>

                  <p className="text-3xl font-bold text-slate-900">
                    {Number(iglesia.mujeres || 0)}
                  </p>
                </div>
              </div>

              {/* PASTORES */}

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                      <Church size={21} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-600">
                        Pastores
                      </p>

                      <p className="text-xs text-slate-400">Ministros</p>
                    </div>
                  </div>

                  <p className="text-3xl font-bold text-slate-900">
                    {Number(iglesia.pastores || 0)}
                  </p>
                </div>
              </div>

              {/* NIÑOS */}

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                      <Baby size={21} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-600">
                        Niños
                      </p>

                      <p className="text-xs text-slate-400">Integrantes</p>
                    </div>
                  </div>

                  <p className="text-3xl font-bold text-slate-900">
                    {Number(iglesia.ninos || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* TOTAL */}

            <div className="mt-5 rounded-2xl bg-slate-900 p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-300">
                    Total de personas
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Hombres + Mujeres + Pastores + Niños
                  </p>
                </div>

                <p className="text-4xl font-bold">{totalPersonas}</p>
              </div>
            </div>
          </section>

          {/* =====================================================
              INFORMACIÓN
          ===================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <MapPin size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">Información</h2>

                <p className="text-sm text-slate-500">
                  Datos registrados de la iglesia.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Nombre
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {iglesia.nombre || "Sin información"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Ciudad
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {iglesia.ciudad || "Sin información"}
                </p>
              </div>
            </div>
          </section>

          {/* =====================================================
              OBSERVACIONES
          ===================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <FileText size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">Observaciones</h2>

                <p className="text-sm text-slate-500">Información adicional.</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-5">
              {iglesia.observaciones ? (
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {iglesia.observaciones}
                </p>
              ) : (
                <p className="text-sm italic text-slate-400">
                  No hay observaciones registradas.
                </p>
              )}
            </div>
          </section>

          {/* =====================================================
              ACCIONES
          ===================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-3">
              <Link
                to={`/iglesias/${id}/editar`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Pencil size={17} />
                Editar
              </Link>

              <button
                type="button"
                onClick={cambiarEstado}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Power size={17} />

                {iglesia.activo ? "Desactivar" : "Activar"}
              </button>

              <Link
                to="/iglesias"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <ArrowLeft size={17} />
                Volver
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
