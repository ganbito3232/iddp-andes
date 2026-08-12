import { useEffect, useState } from "react";

import {
  ArrowLeft,
  Save,
  Church,
  MapPin,
  FileText,
  Users,
  UserRound,
  Baby,
} from "lucide-react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { supabase } from "../lib/supabase";

export default function EditarIglesia() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formulario, setFormulario] = useState({
    nombre: "",
    ciudad: "",
    hombres: 0,
    mujeres: 0,
    pastores: 0,
    ninos: 0,
    observaciones: "",
  });

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

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

      setFormulario({
        nombre: data.nombre || "",
        ciudad: data.ciudad || "",
        hombres: Number(data.hombres) || 0,
        mujeres: Number(data.mujeres) || 0,
        pastores: Number(data.pastores) || 0,
        ninos: Number(data.ninos) || 0,
        observaciones: data.observaciones || "",
      });
    } catch (error) {
      console.error(error);

      alert("No fue posible cargar la iglesia.");

      navigate("/iglesias");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CAMBIAR CAMPOS
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // TOTAL
  // =====================================================

  const totalPersonas =
    Number(formulario.hombres) +
    Number(formulario.mujeres) +
    Number(formulario.pastores) +
    Number(formulario.ninos);

  // =====================================================
  // GUARDAR
  // =====================================================

  const guardar = async (e) => {
    e.preventDefault();

    if (!formulario.nombre.trim()) {
      alert("Debes ingresar el nombre de la iglesia.");
      return;
    }

    if (
      Number(formulario.hombres) < 0 ||
      Number(formulario.mujeres) < 0 ||
      Number(formulario.pastores) < 0 ||
      Number(formulario.ninos) < 0
    ) {
      alert("Las cantidades no pueden ser negativas.");
      return;
    }

    setGuardando(true);

    try {
      const { error } = await supabase
        .from("iglesias")
        .update({
          nombre: formulario.nombre.trim(),
          ciudad: formulario.ciudad.trim(),

          hombres: Number(formulario.hombres),
          mujeres: Number(formulario.mujeres),
          pastores: Number(formulario.pastores),
          ninos: Number(formulario.ninos),

          observaciones: formulario.observaciones.trim(),
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      alert("Iglesia actualizada correctamente.");

      navigate(`/iglesias/${id}`);
    } catch (error) {
      console.error(error);

      alert("No fue posible actualizar la iglesia.");
    } finally {
      setGuardando(false);
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

  // =====================================================
  // VISTA
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Link
            to={`/iglesias/${id}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={19} />
          </Link>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              IDDP LOS ANDES
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Editar iglesia
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Modifica la información registrada de la iglesia.
            </p>
          </div>
        </div>

        {/* =====================================================
            FORMULARIO
        ===================================================== */}

        <form onSubmit={guardar} className="space-y-5">
          {/* =====================================================
              INFORMACIÓN GENERAL
          ===================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Church size={25} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Información de la iglesia
                </h2>

                <p className="text-sm text-slate-500">Datos principales</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* =====================================================
                  NOMBRE
              ===================================================== */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nombre de la iglesia
                </label>

                <div className="relative">
                  <Church
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    name="nombre"
                    value={formulario.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Iglesia Los Andes"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>

              {/* =====================================================
                  CIUDAD
              ===================================================== */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Ciudad
                </label>

                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    name="ciudad"
                    value={formulario.ciudad}
                    onChange={handleChange}
                    placeholder="Ej: Los Andes"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================
              CANTIDADES
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
                  Actualiza la cantidad de integrantes de la iglesia.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* =====================================================
                  HOMBRES
              ===================================================== */}

              <div className="rounded-2xl border border-slate-200 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                      <UserRound size={20} />
                    </div>

                    <div>
                      <p className="font-semibold text-slate-800">Hombres</p>

                      <p className="text-xs text-slate-400">Cantidad</p>
                    </div>
                  </div>
                </div>

                <input
                  type="number"
                  min="0"
                  step="1"
                  name="hombres"
                  value={formulario.hombres}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* =====================================================
                  MUJERES
              ===================================================== */}

              <div className="rounded-2xl border border-slate-200 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                      <UserRound size={20} />
                    </div>

                    <div>
                      <p className="font-semibold text-slate-800">Mujeres</p>

                      <p className="text-xs text-slate-400">Cantidad</p>
                    </div>
                  </div>
                </div>

                <input
                  type="number"
                  min="0"
                  step="1"
                  name="mujeres"
                  value={formulario.mujeres}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* =====================================================
                  PASTORES
              ===================================================== */}

              <div className="rounded-2xl border border-slate-200 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                      <Church size={20} />
                    </div>

                    <div>
                      <p className="font-semibold text-slate-800">Pastores</p>

                      <p className="text-xs text-slate-400">Cantidad</p>
                    </div>
                  </div>
                </div>

                <input
                  type="number"
                  min="0"
                  step="1"
                  name="pastores"
                  value={formulario.pastores}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* =====================================================
                  NIÑOS
              ===================================================== */}

              <div className="rounded-2xl border border-slate-200 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                      <Baby size={20} />
                    </div>

                    <div>
                      <p className="font-semibold text-slate-800">Niños</p>

                      <p className="text-xs text-slate-400">Cantidad</p>
                    </div>
                  </div>
                </div>

                <input
                  type="number"
                  min="0"
                  step="1"
                  name="ninos"
                  value={formulario.ninos}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </div>

            {/* =====================================================
                TOTAL
            ===================================================== */}

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
              OBSERVACIONES
          ===================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <FileText size={21} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Observaciones
                </h2>

                <p className="text-sm text-slate-500">
                  Información adicional de la iglesia.
                </p>
              </div>
            </div>

            <textarea
              name="observaciones"
              value={formulario.observaciones}
              onChange={handleChange}
              rows={6}
              placeholder="Escribe aquí cualquier información adicional..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </section>

          {/* =====================================================
              BOTONES
          ===================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                to={`/iglesias/${id}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft size={17} />
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={guardando}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={17} />

                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
