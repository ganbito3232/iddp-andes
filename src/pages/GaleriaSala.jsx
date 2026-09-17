import { mostrarAviso } from "../services/avisos";
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import { useEffect, useRef, useState } from "react";

import { supabase } from "../lib/supabase";

export default function GaleriaSala() {
  const { id } = useParams();

  // =====================================================
  // REFERENCIAS
  // =====================================================

  const inputGaleriaRef = useRef(null);
  const inputCamaraRef = useRef(null);
  const subiendoRef = useRef(false);

  // =====================================================
  // ESTADOS
  // =====================================================

  const [sala, setSala] = useState(null);
  const [fotos, setFotos] = useState([]);

  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);

  const [fotoSeleccionada, setFotoSeleccionada] = useState(null);

  // =====================================================
  // CARGAR DATOS
  // =====================================================

  useEffect(() => {
    cargarDatos();

  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [salaResult, fotosResult] = await Promise.all([
        supabase
          .from("salas")
          .select("id, nombre, codigo")
          .eq("id", id)
          .single(),

        supabase
          .from("sala_fotos")
          .select(
            `
              id,
              sala_id,
              foto_url,
              descripcion,
              created_at
            `,
          )
          .eq("sala_id", id)
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (salaResult.error) {
        throw salaResult.error;
      }

      if (fotosResult.error) {
        throw fotosResult.error;
      }

      setSala(salaResult.data);
      setFotos(fotosResult.data || []);
    } catch (error) {
      console.error("Error cargando galería:", error);

      mostrarAviso("No fue posible cargar la galería.");
    } finally {
      setLoading(false);
    }
  };

  // Usar la cámara nativa evita depender de un stream de video del navegador.
  const abrirCamara = () => {
    if (!subiendoRef.current) inputCamaraRef.current?.click();
  };

  // =====================================================
  // SUBIR FOTOS
  // =====================================================

  const subirFotos = async (archivos) => {
    if (subiendoRef.current || !archivos || archivos.length === 0) {
      return;
    }

    subiendoRef.current = true;

    try {
      setSubiendo(true);

      for (const archivo of archivos) {
        if (!archivo.type.startsWith("image/")) {
          continue;
        }

        const extension = archivo.name.split(".").pop()?.toLowerCase() || "jpg";

        // También funciona al acceder por HTTP desde la red local.
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        const identificador = Array.from(bytes, (byte) =>
          byte.toString(16).padStart(2, "0"),
        ).join("");
        const nombreArchivo = identificador + "." + extension;

        const ruta = `${id}/galeria/${nombreArchivo}`;

        // -----------------------------------------------
        // STORAGE
        // -----------------------------------------------

        const { error: uploadError } = await supabase.storage
          .from("salas")
          .upload(ruta, archivo, {
            upsert: false,
            contentType: archivo.type,
          });

        if (uploadError) {
          throw uploadError;
        }

        // -----------------------------------------------
        // URL PUBLICA
        // -----------------------------------------------

        const { data: publicUrlData } = supabase.storage
          .from("salas")
          .getPublicUrl(ruta);

        const fotoUrl = publicUrlData.publicUrl;

        // -----------------------------------------------
        // BD
        // -----------------------------------------------

        const { error: insertError } = await supabase
          .from("sala_fotos")
          .insert({
            sala_id: id,
            foto_url: fotoUrl,
            descripcion: null,
          });

        if (insertError) {
          // Si falla BD, borrar archivo
          await supabase.storage.from("salas").remove([ruta]);

          throw insertError;
        }
      }

      await cargarDatos();
    } catch (error) {
      console.error("Error subiendo fotos:", error);

      mostrarAviso(error?.message || "No fue posible subir las fotos.");
    } finally {
      subiendoRef.current = false;
      setSubiendo(false);

      if (inputCamaraRef.current) inputCamaraRef.current.value = "";

      if (inputGaleriaRef.current) {
        inputGaleriaRef.current.value = "";
      }
    }
  };

  // =====================================================
  // GALERIA DE ARCHIVOS
  // =====================================================

  const manejarGaleria = (event) => {
    const archivos = Array.from(event.target.files || []);

    subirFotos(archivos);
  };

  // =====================================================
  // ELIMINAR FOTO
  // =====================================================

  const eliminarFoto = async (foto) => {
    try {
      // -----------------------------------------------
      // OBTENER RUTA STORAGE
      // -----------------------------------------------

      const partes = foto.foto_url.split("/salas/");

      const ruta = partes.length > 1 ? partes[1] : null;

      // -----------------------------------------------
      // ELIMINAR STORAGE
      // -----------------------------------------------

      if (ruta) {
        const { error: storageError } = await supabase.storage
          .from("salas")
          .remove([ruta]);

        if (storageError) {
          console.warn("No se pudo eliminar del Storage:", storageError);
        }
      }

      // -----------------------------------------------
      // ELIMINAR BD
      // -----------------------------------------------

      const { error } = await supabase
        .from("sala_fotos")
        .delete()
        .eq("id", foto.id);

      if (error) {
        throw error;
      }

      setFotos((prev) => prev.filter((item) => item.id !== foto.id));

      setFotoSeleccionada(null);
    } catch (error) {
      console.error("Error eliminando foto:", error);

      mostrarAviso("No fue posible eliminar la foto.");
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="text-center text-sm text-slate-500">
          Cargando galería...
        </div>
      </div>
    );
  }

  // =====================================================
  // SALA NO ENCONTRADA
  // =====================================================

  if (!sala) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-slate-600">Sala no encontrada.</p>

          <Link
            to="/salas"
            className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm text-white"
          >
            Volver a salas
          </Link>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center">
          <Link
            to={`/salas/${id}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft size={19} />
          </Link>

          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {sala.codigo || "Sin código"}
            </p>

            <h1 className="text-2xl font-bold text-slate-900">Galería</h1>

            <p className="mt-1 text-sm text-slate-500">
              {sala.nombre}
              {" · "}
              {fotos.length}
              {fotos.length === 1 ? " fotografía" : " fotografías"}
            </p>
          </div>

          {/* BOTONES */}

          <div className="flex flex-col gap-2 sm:flex-row">
            {/* ========================================= */}
            {/* TOMAR FOTO */}
            {/* ========================================= */}

            <button
              type="button"
              onClick={abrirCamara}
              disabled={subiendo}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Camera size={18} />
              Tomar foto
            </button>

            {/* ========================================= */}
            {/* AGREGAR DESDE ARCHIVOS */}
            {/* ========================================= */}

            <button
              type="button"
              onClick={() => inputGaleriaRef.current?.click()}
              disabled={subiendo}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload size={18} />
              Agregar fotos
            </button>
          </div>

          <input
            ref={inputCamaraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={manejarGaleria}
            disabled={subiendo}
            aria-label="Tomar fotografía con la cámara"
          />

          {/* INPUT SOLO PARA GALERIA */}

          <input
            ref={inputGaleriaRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={manejarGaleria}
          />
        </div>

        {/* ================================================= */}
        {/* GALERIA VACIA */}
        {/* ================================================= */}

        {subiendo && (
          <p role="status" className="mb-4 text-sm font-medium text-slate-600">
            Guardando fotografías...
          </p>
        )}

        {fotos.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center sm:p-16">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <ImageIcon size={30} className="text-slate-400" />
            </div>

            <h2 className="mt-5 font-semibold text-slate-800">
              No hay fotografías
            </h2>

            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
              Puedes tomar una fotografía directamente desde el celular o
              seleccionar varias desde tu galería.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <button
                type="button"
                onClick={abrirCamara}
                disabled={subiendo}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              >
                <Camera size={18} />
                Tomar foto
              </button>

              <button
                type="button"
                onClick={() => inputGaleriaRef.current?.click()}
                disabled={subiendo}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
              >
                <Upload size={18} />
                Seleccionar fotos
              </button>
            </div>
          </div>
        ) : (
          /* ================================================= */
          /* GALERIA */
          /* ================================================= */

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {fotos.map((foto) => (
              <div
                key={foto.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                {/* FOTO */}

                <button
                  type="button"
                  onClick={() => setFotoSeleccionada(foto)}
                  className="block aspect-square w-full"
                >
                  <img
                    src={foto.foto_url}
                    alt={foto.descripcion || "Fotografía de sala"}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </button>

                {/* ===================================== */}
                {/* ELIMINAR */}
                {/* ===================================== */}

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();

                    eliminarFoto(foto);
                  }}
                  title="Eliminar foto"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-sm transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================================================= */}
      {/* MODAL FOTO GRANDE */}
      {/* ================================================= */}

      {fotoSeleccionada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setFotoSeleccionada(null)}
        >
          <button
            type="button"
            onClick={() => setFotoSeleccionada(null)}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow"
          >
            <X size={20} />
          </button>

          <img
            src={fotoSeleccionada.foto_url}
            alt="Fotografía de sala"
            className="max-h-[90vh] max-w-full rounded-2xl object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

    </div>
  );
}
