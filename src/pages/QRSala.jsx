import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { normalizarColegio } from "../utils/colegios";
import QRPoster from "../components/QRPoster";

export default function QRSala() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const colegio = normalizarColegio(params.get("colegio"));
  const [estado, setEstado] = useState({ loading: true, salas: [], error: "" });

  useEffect(() => {
    let vigente = true;
    async function cargar() {
      setEstado({ loading: true, salas: [], error: "" });
      try {
        let consulta = supabase.from("salas").select("id, nombre, codigo, colegio, activo");
        consulta = id ? consulta.eq("id", id) : consulta.eq("activo", true);
        const { data, error } = await consulta;
        if (error) throw error;
        const salas = (data || [])
          .filter((sala) => id || normalizarColegio(sala.colegio) === colegio)
          .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es", { numeric: true }));
        if (vigente) setEstado({ loading: false, salas, error: "" });
      } catch {
        if (vigente) setEstado({ loading: false, salas: [], error: "No fue posible cargar los QR. Vuelve a Salas e inténtalo nuevamente." });
      }
    }
    cargar();
    return () => { vigente = false; };
  }, [id, colegio]);

  const { loading, salas, error } = estado;
  return (
    <>
      <div className="qr-pantalla p-4 sm:p-8">
        <div className="mx-auto max-w-4xl">
          <Link to={id ? "/salas/" + id : "/salas"} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600"><ArrowLeft size={18} />Volver a {id ? "la sala" : "salas"}</Link>
          <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Señalética de salas</p>
              <h1 className="mt-2 text-2xl font-bold text-slate-900">{id ? "QR de la sala" : colegio || "Salas sin colegio"}</h1>
              <p className="mt-2 text-sm text-slate-500">{loading ? "Cargando salas…" : salas.length + " hojas · Un QR por página A4"}</p>
            </div>
            <button type="button" onClick={() => window.print()} disabled={loading || !!error || !salas.length} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"><Printer size={18} />{id ? "Imprimir QR" : "Imprimir todos los QR"}</button>
          </div>
          <p className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Imprime en A4 vertical, a tamaño real (100 %), sin encabezados ni pies de página del navegador. También puedes elegir Guardar como PDF.</p>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-5 text-red-700">{error}</p>}
          {!loading && !error && !salas.length && <p className="p-8 text-center text-slate-500">No hay salas para imprimir.</p>}
          <div className="qr-preview-list">{salas.map((sala) => <QRPoster key={sala.id} sala={sala} />)}</div>
        </div>
      </div>
      {!loading && !error && salas.length > 0 && createPortal(
        <div className="qr-print-root">{salas.map((sala) => <QRPoster key={sala.id} sala={sala} />)}</div>,
        document.body,
      )}
    </>
  );
}
