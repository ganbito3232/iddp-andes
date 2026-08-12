import { useState } from "react";

import {
  ArrowLeft,
  Church,
  FileText,
  MapPin,
  Save,
  Users,
  UserRound,
  Baby,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

export default function NuevaIglesia() {
  const navigate = useNavigate();

  const [guardando, setGuardando] = useState(false);

  const [formulario, setFormulario] = useState({
    nombre: "",
    ciudad: "",
    hombres: 0,
    mujeres: 0,
    pastores: 0,
    ninos: 0,
    observaciones: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const cambiarCantidad = (campo, valor) => {
    const cantidad = Math.max(0, Number(valor) || 0);

    setFormulario((prev) => ({
      ...prev,
      [campo]: cantidad,
    }));
  };

  const total =
    Number(formulario.hombres || 0) +
    Number(formulario.mujeres || 0) +
    Number(formulario.pastores || 0) +
    Number(formulario.ninos || 0);

  const guardar = async () => {
    try {
      if (!formulario.nombre.trim()) {
        alert("Debes ingresar el nombre de la iglesia.");
        return;
      }

      setGuardando(true);

      const { data, error } = await supabase
        .from("iglesias")
        .insert({
          nombre: formulario.nombre.trim() || null,
          ciudad: formulario.ciudad.trim() || null,

          hombres: Number(formulario.hombres) || 0,
          mujeres: Number(formulario.mujeres) || 0,
          pastores: Number(formulario.pastores) || 0,
          ninos: Number(formulario.ninos) || 0,

          observaciones: formulario.observaciones.trim() || null,

          activo: true,
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      navigate(`/iglesias/${data.id}`);
    } catch (error) {
      console.error(error);

      alert(error?.message || "No fue posible guardar la iglesia.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-2xl">
        {/* HEADER */}

        <div className="mb-7 flex items-center gap-4">
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
              Nueva iglesia
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Registra una iglesia participante
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* INFORMACIÓN */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionTitle
              icon={<Church size={19} />}
              title="Información"
              subtitle="Datos generales de la iglesia"
            />

            <div className="mt-6 space-y-5">
              <Input
                label="Nombre"
                name="nombre"
                value={formulario.nombre}
                onChange={handleChange}
                placeholder="Ej: IDDP Los Andes"
              />

              <Input
                label="Ciudad"
                name="ciudad"
                value={formulario.ciudad}
                onChange={handleChange}
                placeholder="Ej: Los Andes"
                icon={<MapPin size={16} />}
              />
            </div>
          </section>

          {/* CANTIDAD DE PERSONAS */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionTitle
              icon={<Users size={19} />}
              title="Cantidad de personas"
              subtitle="Cantidad de personas que vienen desde esta iglesia"
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Cantidad
                label="Hombres"
                value={formulario.hombres}
                icon={<UserRound size={18} />}
                onChange={(value) => cambiarCantidad("hombres", value)}
              />

              <Cantidad
                label="Mujeres"
                value={formulario.mujeres}
                icon={<UserRound size={18} />}
                onChange={(value) => cambiarCantidad("mujeres", value)}
              />

              <Cantidad
                label="Pastores"
                value={formulario.pastores}
                icon={<Church size={18} />}
                onChange={(value) => cambiarCantidad("pastores", value)}
              />

              <Cantidad
                label="Niños"
                value={formulario.ninos}
                icon={<Baby size={18} />}
                onChange={(value) => cambiarCantidad("ninos", value)}
              />
            </div>

            {/* TOTAL */}

            <div className="mt-5 rounded-2xl bg-slate-900 p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Total de personas</p>

                  <p className="mt-1 text-3xl font-bold">{total}</p>
                </div>

                <Users size={32} className="text-slate-400" />
              </div>
            </div>
          </section>

          {/* OBSERVACIONES */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionTitle
              icon={<FileText size={19} />}
              title="Observaciones"
              subtitle="Información adicional"
            />

            <textarea
              name="observaciones"
              value={formulario.observaciones}
              onChange={handleChange}
              rows={5}
              placeholder="Información adicional..."
              className="mt-5 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </section>

          {/* BOTONES */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              to="/iglesias"
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-medium text-slate-700"
            >
              Cancelar
            </Link>

            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Save size={18} />

              {guardando ? "Guardando..." : "Guardar iglesia"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// INPUT
// =====================================================

function Input({ label, icon, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}

        <input
          {...props}
          className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 ${
            icon ? "pl-10" : ""
          }`}
        />
      </div>
    </label>
  );
}

// =====================================================
// CANTIDAD
// =====================================================

function Cantidad({ label, value, icon, onChange }) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
        <span className="text-slate-500">{icon}</span>

        {label}
      </label>

      <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, Number(value) - 1))}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-xl text-slate-500 hover:bg-slate-100"
        >
          −
        </button>

        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 border-0 bg-transparent text-center text-lg font-semibold text-slate-900 outline-none"
        />

        <button
          type="button"
          onClick={() => onChange(Number(value) + 1)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-xl text-slate-500 hover:bg-slate-100"
        >
          +
        </button>
      </div>
    </div>
  );
}

// =====================================================
// SECTION
// =====================================================

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        {icon}
      </div>

      <div>
        <h2 className="font-semibold text-slate-900">{title}</h2>

        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}
