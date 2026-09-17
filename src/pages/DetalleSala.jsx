import { mostrarAviso, pedirConfirmacion } from "../services/avisos";
import { normalizarColegio } from "../utils/colegios";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Edit,
  QrCode,
  School,
  Church,
  Package,
  User,
  FileText,
  MapPin,
  Armchair,
  Table2,
  Trash2,
  Image,
} from "lucide-react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { supabase } from "../lib/supabase";

export default function DetalleSala() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sala, setSala] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarSala();
  }, [id]);

  const cargarSala = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("salas")
        .select(
          `
          *,
          sala_iglesias (
            id,
            cantidad,
            observacion,
            iglesias (
              id,
              nombre,
              ciudad,
              hombres,
              mujeres,
              pastores,
              ninos
            )
          ),
          sala_inventario (
            id,
            cantidad,
            observacion,
            nombre_personalizado,
            tipos_inventario (
              id,
              nombre,
              icono
            )
          )
        `,
        )
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      setSala(data);
    } catch (error) {
      console.error("Error cargando sala:", error);
    } finally {
      setLoading(false);
    }
  };

  const desactivarSala = async () => {
    const confirmar = await pedirConfirmacion(
      `¿Quieres desactivar la sala ${sala?.nombre || ""}?`,
    );

    if (!confirmar) {
      return;
    }

    try {
      const { error } = await supabase
        .from("salas")
        .update({
          activo: false,
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      navigate("/salas");
    } catch (error) {
      console.error(error);

      mostrarAviso("No fue posible desactivar la sala.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">
          Cargando información de la sala...
        </p>
      </div>
    );
  }

  if (!sala) {
    return (
      <div className="p-8 text-center">
        <School size={40} className="mx-auto text-slate-300" />

        <h2 className="mt-4 font-semibold text-slate-800">
          Sala no encontrada
        </h2>

        <Link
          to="/salas"
          className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
        >
          Volver a salas
        </Link>
      </div>
    );
  }

  const iglesiasAlojadas = (sala.sala_iglesias ?? []).filter(
    (registro) => Number(registro.cantidad) > 0,
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* HEADER */}

      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/salas"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {sala.codigo || "Sin código"}
              </p>

              <h1 className="text-2xl font-bold text-slate-900">
                {sala.nombre || "Sala sin nombre"}
              </h1>
            </div>
          </div>

          {/* ACCIONES */}

          <div className="flex flex-wrap gap-2">
            <Link
              to={`/salas/${id}/qr`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <QrCode size={17} />
              QR
            </Link>
            <Link
              to={`/salas/${sala.id}/galeria`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Image size={18} />
              Galería
            </Link>
            <Link
              to={`/salas/${id}/editar`}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Edit size={17} />
              Editar
            </Link>
          </div>
        </div>

        {/* FOTO */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {sala.foto_url ? (
            <img
              src={sala.foto_url}
              alt={sala.nombre || "Sala"}
              className="max-h-[550px] w-full object-cover"
            />
          ) : (
            <div className="flex h-72 items-center justify-center bg-slate-100">
              <div className="text-center">
                <School size={48} className="mx-auto text-slate-300" />

                <p className="mt-3 text-sm text-slate-500">
                  Esta sala no tiene fotografía
                </p>
              </div>
            </div>
          )}
        </section>

        {/* UBICACIÓN */}

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <InfoCard
            icon={<MapPin size={19} />}
            title="Ubicación"
            value={sala.ubicacion || "Sin especificar"}
          />

          <InfoCard
            icon={<School size={19} />}
            title="Piso"
            value={sala.piso || "Sin especificar"}
          />

          <InfoCard
            icon={<User size={19} />}
            title="Responsable"
            value={sala.responsable || "Sin responsable"}
          />

          <InfoCard
            icon={<School size={19} />}
            title="Colegio"
            value={normalizarColegio(sala.colegio) || "Sin colegio"}
          />

          <InfoCard
            icon={<Church size={19} />}
            title="Tipo de sala"
            value={
              sala.tipo_sala === "HOMBRE"
                ? "Hombres"
                : sala.tipo_sala === "MUJER"
                  ? "Mujeres"
                  : "Sin definir"
            }
          />
        </div>

        {/* PERSONAS ASIGNADAS */}
        {iglesiasAlojadas.length > 0 && (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionTitle
              icon={<User size={19} />}
              title="Personas alojadas"
              subtitle="Resumen de personas asignadas a esta sala"
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <SummaryCard
                label="Hombres"
                value={
                  sala.tipo_sala === "HOMBRE"
                    ? iglesiasAlojadas.reduce(
                        (total, item) => total + Number(item.cantidad || 0),
                        0,
                      )
                    : 0
                }
              />

              <SummaryCard
                label="Mujeres"
                value={
                  sala.tipo_sala === "MUJER"
                    ? iglesiasAlojadas.reduce(
                        (total, item) => total + Number(item.cantidad || 0),
                        0,
                      )
                    : 0
                }
              />

              <SummaryCard
                label="Total asignado"
                value={iglesiasAlojadas.reduce(
                  (total, item) => total + Number(item.cantidad || 0),
                  0,
                )}
              />
            </div>
          </section>
        )}

        {/* IGLESIAS */}

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={<Church size={19} />}
            title="Iglesias alojadas"
            subtitle="Iglesias asignadas a esta sala"
          />

          <div className="mt-5">
            {iglesiasAlojadas.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {iglesiasAlojadas.map((registro) => (
                  <div
                    key={registro.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <p className="font-medium text-slate-800">
                      {registro.iglesias?.nombre}
                    </p>

                    {registro.iglesias?.ciudad && (
                      <p className="mt-1 text-sm text-slate-500">
                        {registro.iglesias.ciudad}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <MiniStat
                        label="Asignados"
                        value={Number(registro.cantidad || 0)}
                      />

                      <MiniStat
                        label="Stock"
                        value={
                          sala.tipo_sala === "HOMBRE"
                            ? Number(registro.iglesias?.hombres || 0)
                            : sala.tipo_sala === "MUJER"
                              ? Number(registro.iglesias?.mujeres || 0)
                              : Number(registro.iglesias?.hombres || 0) +
                                Number(registro.iglesias?.mujeres || 0)
                        }
                      />

                      <MiniStat
                        label="Disponible"
                        value={Math.max(
                          0,
                          (sala.tipo_sala === "HOMBRE"
                            ? Number(registro.iglesias?.hombres || 0)
                            : sala.tipo_sala === "MUJER"
                              ? Number(registro.iglesias?.mujeres || 0)
                              : Number(registro.iglesias?.hombres || 0) +
                                Number(registro.iglesias?.mujeres || 0)) -
                            Number(registro.cantidad || 0),
                        )}
                      />
                    </div>

                    {registro.observacion && (
                      <p className="mt-3 text-sm text-slate-500">
                        {registro.observacion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyText>No hay iglesias asignadas a esta sala.</EmptyText>
            )}
          </div>
        </section>

        {/* INVENTARIO */}

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={<Package size={19} />}
            title="Inventario"
            subtitle="Elementos registrados dentro de la sala"
          />

          <div className="mt-5">
            {sala.sala_inventario?.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {sala.sala_inventario.map((item) => {
                  const nombre =
                    item.nombre_personalizado ||
                    item.tipos_inventario?.nombre ||
                    "Elemento";

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 py-4"
                    >
                      <div>
                        <p className="font-medium text-slate-800">{nombre}</p>

                        {item.observacion && (
                          <p className="mt-1 text-sm text-slate-500">
                            {item.observacion}
                          </p>
                        )}
                      </div>

                      <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-slate-100 px-3 font-bold text-slate-800">
                        {item.cantidad}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyText>No hay elementos registrados.</EmptyText>
            )}
          </div>
        </section>

        {/* RESPONSABLE */}

        {sala.responsable && (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionTitle
              icon={<User size={19} />}
              title="Responsable"
              subtitle="Persona que realizó el catastro"
            />

            <p className="mt-5 text-slate-700">{sala.responsable}</p>
          </section>
        )}

        {/* OBSERVACIONES */}

        {sala.observaciones && (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionTitle
              icon={<FileText size={19} />}
              title="Observaciones"
              subtitle="Información adicional"
            />

            <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {sala.observaciones}
            </p>
          </section>
        )}

        {/* DESACTIVAR */}

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={desactivarSala}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 size={17} />
            Desactivar sala
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// COMPONENTES
// =====================================================

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        {icon}
      </div>

      <div>
        <h2 className="font-semibold text-slate-900">{title}</h2>

        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function InfoCard({ icon, title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon}
        </div>

        <div>
          <p className="text-xs text-slate-400">{title}</p>

          <p className="mt-0.5 text-sm font-medium text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function EmptyText({ children }) {
  return (
    <div className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}
