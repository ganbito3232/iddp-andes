import { useEffect, useState } from "react";
import { ArrowLeft, Printer, QrCode, School } from "lucide-react";

import { Link, useParams } from "react-router-dom";

import { QRCodeSVG } from "qrcode.react";

import { supabase } from "../lib/supabase";

export default function QRSala() {
  const { id } = useParams();

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
        .select("id, nombre, codigo, activo")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      setSala(data);
    } catch (error) {
      console.error(error);

      alert("No fue posible cargar la sala.");
    } finally {
      setLoading(false);
    }
  };

  const urlPublica = `${window.location.origin}/sala/${id}`;

  const imprimirQR = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Cargando QR...</p>
      </div>
    );
  }

  if (!sala) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <School size={48} className="mx-auto text-slate-300" />

          <h2 className="mt-4 font-semibold text-slate-800">
            Sala no encontrada
          </h2>

          <Link
            to="/salas"
            className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-white"
          >
            Volver a salas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ============================================ */}
      {/* PANTALLA */}
      {/* ============================================ */}

      <div className="qr-pantalla min-h-screen bg-slate-50 p-4 sm:p-8">
        {" "}
        <div className="mx-auto max-w-xl">
          {/* HEADER */}

          <div className="mb-6 flex items-center gap-4">
            <Link
              to={`/salas/${id}`}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {sala.codigo || "Sin código"}
              </p>

              <h1 className="text-2xl font-bold text-slate-900">
                QR de la sala
              </h1>
            </div>
          </div>

          {/* TARJETA */}

          <div
            id="qr-print"
            className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <QrCode size={25} />
            </div>

            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              IDDP LOS ANDES
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              {sala.nombre}
            </h2>

            {sala.codigo && (
              <p className="mt-2 text-sm text-slate-500">{sala.codigo}</p>
            )}

            {/* QR */}

            <div className="mx-auto mt-8 flex w-fit rounded-3xl border border-slate-100 bg-white p-5">
              <QRCodeSVG
                value={urlPublica}
                size={260}
                level="H"
                includeMargin
              />
            </div>

            <p className="mx-auto mt-7 max-w-sm text-sm leading-6 text-slate-500">
              Escanea este código QR para consultar la información y el
              inventario de esta sala.
            </p>

            <div className="mt-7 rounded-2xl bg-slate-50 p-4">
              <p className="break-all text-xs text-slate-400">{urlPublica}</p>
            </div>
          </div>

          {/* BOTÓN */}

          <button
            type="button"
            onClick={imprimirQR}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Printer size={18} />
            Imprimir QR
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* VERSION IMPRESIÓN */}
      {/* ============================================ */}

      <div className="qr-impresion">
        {" "}
        <div className="w-full max-w-[500px] text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            IDDP LOS ANDES
          </p>

          <h1 className="mt-5 text-5xl font-bold text-black">{sala.nombre}</h1>

          {sala.codigo && (
            <p className="mt-3 text-xl text-slate-600">{sala.codigo}</p>
          )}

          <div className="mx-auto mt-12 w-fit">
            <QRCodeSVG value={urlPublica} size={360} level="H" includeMargin />
          </div>

          <p className="mt-10 text-lg text-slate-600">
            Escanea para conocer la información de esta sala
          </p>
        </div>
      </div>
    </>
  );
}
