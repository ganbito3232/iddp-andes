import { mostrarAviso } from "../services/avisos";
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Trash2,
  Upload,
  X,
  RotateCcw,
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
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // =====================================================
  // ESTADOS
  // =====================================================

  const [sala, setSala] = useState(null);
  const [fotos, setFotos] = useState([]);

  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);

  const [camaraAbierta, setCamaraAbierta] = useState(false);

  // environment = trasera
  // user = frontal
  const [camara, setCamara] = useState("environment");

  const [fotoSeleccionada, setFotoSeleccionada] = useState(null);

  // =====================================================
  // CARGAR DATOS
  // =====================================================

  useEffect(() => {
    cargarDatos();

    return () => {
      detenerCamara();
    };
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

  // =====================================================
  // INICIAR CAMARA
  // =====================================================

  const iniciarCamara = async (tipoCamara = "environment") => {
    try {
      // Detener cámara anterior
      detenerCamara();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Este navegador no permite acceder a la cámara.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: tipoCamara,
          },
          width: {
            ideal: 1920,
          },
          height: {
            ideal: 1080,
          },
        },
        audio: false,
      });

      streamRef.current = stream;

      setCamara(tipoCamara);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        try {
          await videoRef.current.play();
        } catch (error) {
          console.warn("No se pudo reproducir automáticamente:", error);
        }
      }
    } catch (error) {
      console.error("Error iniciando cámara:", error);

      throw error;
    }
  };

  // =====================================================
  // ABRIR CAMARA
  // =====================================================

  const abrirCamara = async () => {
    try {
      // Siempre comenzar con cámara trasera
      setCamara("environment");

      setCamaraAbierta(true);

      // Esperar que React monte el <video>
      await new Promise((resolve) => setTimeout(resolve, 150));

      await iniciarCamara("environment");
    } catch (error) {
      console.error("Error accediendo a cámara:", error);

      detenerCamara();

      setCamaraAbierta(false);

      let mensaje = "No fue posible acceder a la cámara.";

      if (error?.name === "NotAllowedError") {
        mensaje =
          "Permiso de cámara denegado. Autoriza la cámara en el navegador.";
      } else if (error?.name === "NotFoundError") {
        mensaje = "No se encontró ninguna cámara en este dispositivo.";
      } else if (error?.name === "NotReadableError") {
        mensaje = "La cámara está siendo utilizada por otra aplicación.";
      } else if (error?.name === "SecurityError") {
        mensaje =
          "El navegador bloqueó la cámara. La aplicación debe ejecutarse mediante HTTPS.";
      } else if (error?.message) {
        mensaje = error.message;
      }

      mostrarAviso(mensaje);
    }
  };

  // =====================================================
  // CAMBIAR CAMARA
  // =====================================================

  const cambiarCamara = async () => {
    const nuevaCamara = camara === "environment" ? "user" : "environment";

    try {
      await iniciarCamara(nuevaCamara);
    } catch (error) {
      console.error("Error cambiando cámara:", error);

      mostrarAviso("No fue posible cambiar de cámara.");
    }
  };

  // =====================================================
  // TOMAR FOTO
  // =====================================================

  const tomarFoto = async () => {
    try {
      const video = videoRef.current;

      if (!video) {
        mostrarAviso("La cámara no está disponible.");
        return;
      }

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        mostrarAviso("La cámara todavía no está lista. Espera un momento.", "warning");
        return;
      }

      const canvas = document.createElement("canvas");

      canvas.width = video.videoWidth;

      canvas.height = video.videoHeight;

      const contexto = canvas.getContext("2d");

      if (!contexto) {
        throw new Error("No fue posible crear la imagen.");
      }

      // Si es frontal, guardar la imagen
      // como espejo, igual que una selfie.
      if (camara === "user") {
        contexto.translate(canvas.width, 0);

        contexto.scale(-1, 1);
      }

      contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            mostrarAviso("No fue posible generar la fotografía.");
            return;
          }

          const archivo = new File([blob], `foto-${crypto.randomUUID()}.jpg`, {
            type: "image/jpeg",
          });

          await subirFotos([archivo]);

          cerrarCamara();
        },
        "image/jpeg",
        0.9,
      );
    } catch (error) {
      console.error("Error tomando fotografía:", error);

      mostrarAviso("No fue posible tomar la fotografía.");
    }
  };

  // =====================================================
  // DETENER CAMARA
  // =====================================================

  const detenerCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // =====================================================
  // CERRAR CAMARA
  // =====================================================

  const cerrarCamara = () => {
    detenerCamara();

    setCamaraAbierta(false);
  };

  // =====================================================
  // SUBIR FOTOS
  // =====================================================

  const subirFotos = async (archivos) => {
    if (!archivos || archivos.length === 0) {
      return;
    }

    try {
      setSubiendo(true);

      for (const archivo of archivos) {
        if (!archivo.type.startsWith("image/")) {
          continue;
        }

        const extension = archivo.name.split(".").pop()?.toLowerCase() || "jpg";

        const nombreArchivo = `${crypto.randomUUID()}.${extension}`;

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
      setSubiendo(false);

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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              >
                <Camera size={18} />
                Tomar foto
              </button>

              <button
                type="button"
                onClick={() => inputGaleriaRef.current?.click()}
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

      {/* ================================================= */}
      {/* CAMARA */}
      {/* ================================================= */}

      {camaraAbierta && (
        <div className="fixed inset-0 z-[100] bg-black">
          {/* VIDEO */}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover ${
              camara === "user" ? "-scale-x-100" : ""
            }`}
          />

          {/* =========================================== */}
          {/* BARRA SUPERIOR */}
          {/* =========================================== */}

          <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
            {/* CERRAR */}

            <button
              type="button"
              onClick={cerrarCamara}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
            >
              <X size={22} />
            </button>

            {/* TEXTO */}

            <div className="rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white backdrop-blur">
              {camara === "environment" ? "Cámara trasera" : "Cámara frontal"}
            </div>

            {/* CAMBIAR */}

            <button
              type="button"
              onClick={cambiarCamara}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
              title="Cambiar cámara"
            >
              <RotateCcw size={21} />
            </button>
          </div>

          {/* =========================================== */}
          {/* BOTON CAPTURA */}
          {/* =========================================== */}

          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center bg-gradient-to-t from-black/80 to-transparent p-8 pb-10">
            <button
              type="button"
              onClick={tomarFoto}
              disabled={subiendo}
              className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white shadow-2xl disabled:opacity-50"
              title="Tomar fotografía"
            >
              <div className="h-14 w-14 rounded-full border-2 border-slate-300 bg-white" />
            </button>
          </div>

          {/* =========================================== */}
          {/* SUBIENDO */}
          {/* =========================================== */}

          {subiendo && (
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-5 py-2 text-sm font-medium text-white backdrop-blur">
              Guardando fotografía...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
