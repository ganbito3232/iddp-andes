import { useEffect, useRef, useState } from "react";

import {
  ArrowLeft,
  Camera,
  Plus,
  Minus,
  X,
  Save,
  Church,
  Package,
  User,
  FileText,
  School,
  Trash2,
  Image as ImageIcon,
  RotateCcw,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

export default function NuevaSala() {
  const navigate = useNavigate();

  // =====================================================
  // REFERENCIAS
  // =====================================================

  const inputGaleriaRef = useRef(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // =====================================================
  // ESTADOS
  // =====================================================

  const [guardando, setGuardando] = useState(false);

  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);

  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [tipoCamara, setTipoCamara] = useState("environment");

  const [iglesias, setIglesias] = useState([]);
  const [iglesiasSeleccionadas, setIglesiasSeleccionadas] = useState([]);

  const [tiposInventario, setTiposInventario] = useState([]);

  const [inventario, setInventario] = useState([]);

  const [mostrarAgregarElemento, setMostrarAgregarElemento] = useState(false);

  const [nuevoElemento, setNuevoElemento] = useState({
    nombre: "",
    cantidad: 1,
    observacion: "",
  });

  const [formulario, setFormulario] = useState({
    nombre: "",
    codigo: "",
    ubicacion: "",
    piso: "",
    responsable: "",
    observaciones: "",
  });

  // =====================================================
  // CARGAR CATÁLOGOS
  // =====================================================

  useEffect(() => {
    cargarCatalogos();

    return () => {
      detenerCamara();

      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, []);

  const cargarCatalogos = async () => {
    try {
      const [
        { data: iglesiasData, error: iglesiasError },
        { data: tiposData, error: tiposError },
      ] = await Promise.all([
        supabase
          .from("iglesias")
          .select("*")
          .eq("activo", true)
          .order("nombre"),

        supabase
          .from("tipos_inventario")
          .select("*")
          .eq("activo", true)
          .order("nombre"),
      ]);

      if (iglesiasError) {
        throw iglesiasError;
      }

      if (tiposError) {
        throw tiposError;
      }

      setIglesias(iglesiasData || []);
      setTiposInventario(tiposData || []);
    } catch (error) {
      console.error("Error cargando catálogos:", error);
    }
  };

  // =====================================================
  // FORMULARIO
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // FOTO DESDE GALERÍA / ARCHIVO
  // =====================================================

  const handleFoto = (e) => {
    const archivo = e.target.files?.[0];

    if (!archivo) {
      return;
    }

    if (!archivo.type.startsWith("image/")) {
      alert("Selecciona una imagen válida.");
      e.target.value = "";
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (archivo.size > maxSize) {
      alert("La imagen no puede superar los 10 MB.");
      e.target.value = "";
      return;
    }

    setFoto(archivo);

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(URL.createObjectURL(archivo));

    e.target.value = "";
  };

  // =====================================================
  // ABRIR GALERÍA
  // =====================================================

  const abrirGaleria = () => {
    inputGaleriaRef.current?.click();
  };

  // =====================================================
  // DETENER CÁMARA
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
  // ABRIR CÁMARA
  // environment = trasera
  // user        = frontal
  // =====================================================

  const abrirCamara = async (tipo = "environment") => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Tu navegador no permite acceder a la cámara.");
        return;
      }

      detenerCamara();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: tipo,
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

      setTipoCamara(tipo);
      setCamaraAbierta(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current.play().catch((error) => {
            console.error("Error reproduciendo cámara:", error);
          });
        }
      }, 100);
    } catch (error) {
      console.error("Error accediendo a la cámara:", error);

      if (error?.name === "NotAllowedError") {
        alert("Debes permitir el acceso a la cámara en Chrome.");
        return;
      }

      if (error?.name === "NotFoundError") {
        alert("No se encontró ninguna cámara en este dispositivo.");
        return;
      }

      if (error?.name === "NotReadableError") {
        alert("La cámara está siendo utilizada por otra aplicación.");
        return;
      }

      alert("No fue posible acceder a la cámara.");
    }
  };

  // =====================================================
  // CERRAR CÁMARA
  // =====================================================

  const cerrarCamara = () => {
    detenerCamara();
    setCamaraAbierta(false);
  };

  // =====================================================
  // CAMBIAR CÁMARA
  // =====================================================

  const cambiarCamara = async () => {
    const nuevaCamara = tipoCamara === "environment" ? "user" : "environment";

    await abrirCamara(nuevaCamara);
  };

  // =====================================================
  // TOMAR FOTO DESDE LA CÁMARA
  // =====================================================

  const tomarFoto = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      alert("La cámara todavía no está lista.");
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;

    canvas.height = video.videoHeight;

    const contexto = canvas.getContext("2d");

    if (!contexto) {
      return;
    }

    /*
      Si es cámara frontal,
      espejamos la imagen.
    */

    if (tipoCamara === "user") {
      contexto.translate(canvas.width, 0);

      contexto.scale(-1, 1);
    }

    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return;
        }

        const archivo = new File([blob], `sala-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        setFoto(archivo);

        if (preview) {
          URL.revokeObjectURL(preview);
        }

        const nuevaPreview = URL.createObjectURL(archivo);

        setPreview(nuevaPreview);

        cerrarCamara();
      },
      "image/jpeg",
      0.9,
    );
  };

  // =====================================================
  // ELIMINAR FOTO
  // =====================================================

  const eliminarFoto = () => {
    setFoto(null);

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(null);

    if (inputGaleriaRef.current) {
      inputGaleriaRef.current.value = "";
    }
  };

  // =====================================================
  // IGLESIAS
  // =====================================================

  const toggleIglesia = (iglesiaId) => {
    setIglesiasSeleccionadas((prev) => {
      if (prev.includes(iglesiaId)) {
        return prev.filter((id) => id !== iglesiaId);
      }

      return [...prev, iglesiaId];
    });
  };

  // =====================================================
  // INVENTARIO
  // =====================================================

  const obtenerCantidad = (tipoId) => {
    const elemento = inventario.find(
      (item) => item.tipo_inventario_id === tipoId,
    );

    return elemento?.cantidad || 0;
  };

  const obtenerObservacion = (tipoId) => {
    const elemento = inventario.find(
      (item) => item.tipo_inventario_id === tipoId,
    );

    return elemento?.observacion || "";
  };

  const cambiarCantidad = (tipoId, cambio) => {
    setInventario((prev) => {
      const existe = prev.find((item) => item.tipo_inventario_id === tipoId);

      if (!existe) {
        if (cambio <= 0) {
          return prev;
        }

        return [
          ...prev,
          {
            tipo_inventario_id: tipoId,
            cantidad: cambio,
            observacion: "",
          },
        ];
      }

      const nuevaCantidad = Math.max(Number(existe.cantidad || 0) + cambio, 0);

      if (nuevaCantidad === 0) {
        return prev.filter((item) => item.tipo_inventario_id !== tipoId);
      }

      return prev.map((item) => {
        if (item.tipo_inventario_id !== tipoId) {
          return item;
        }

        return {
          ...item,
          cantidad: nuevaCantidad,
        };
      });
    });
  };

  const cambiarCantidadDirecta = (tipoId, valor) => {
    const cantidad = Math.max(parseInt(valor || "0", 10), 0);

    setInventario((prev) => {
      const existe = prev.find((item) => item.tipo_inventario_id === tipoId);

      if (cantidad === 0) {
        return prev.filter((item) => item.tipo_inventario_id !== tipoId);
      }

      if (!existe) {
        return [
          ...prev,
          {
            tipo_inventario_id: tipoId,
            cantidad,
            observacion: "",
          },
        ];
      }

      return prev.map((item) => {
        if (item.tipo_inventario_id !== tipoId) {
          return item;
        }

        return {
          ...item,
          cantidad,
        };
      });
    });
  };

  const cambiarObservacion = (tipoId, observacion) => {
    setInventario((prev) => {
      const existe = prev.find((item) => item.tipo_inventario_id === tipoId);

      if (!existe) {
        return [
          ...prev,
          {
            tipo_inventario_id: tipoId,
            cantidad: 1,
            observacion,
          },
        ];
      }

      return prev.map((item) => {
        if (item.tipo_inventario_id !== tipoId) {
          return item;
        }

        return {
          ...item,
          observacion,
        };
      });
    });
  };

  // =====================================================
  // ELEMENTO PERSONALIZADO
  // =====================================================

  const handleNuevoElementoChange = (e) => {
    const { name, value } = e.target;

    setNuevoElemento((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const agregarElementoPersonalizado = () => {
    const nombre = nuevoElemento.nombre.trim();

    if (!nombre) {
      return;
    }

    setInventario((prev) => [
      ...prev,
      {
        tipo_inventario_id: null,
        nombre_personalizado: nombre,
        cantidad: Math.max(parseInt(nuevoElemento.cantidad || "1", 10), 1),
        observacion: nuevoElemento.observacion.trim(),
      },
    ]);

    setNuevoElemento({
      nombre: "",
      cantidad: 1,
      observacion: "",
    });

    setMostrarAgregarElemento(false);
  };

  const eliminarElementoPersonalizado = (index) => {
    setInventario((prev) => prev.filter((_, i) => i !== index));
  };

  // =====================================================
  // GUARDAR SALA
  // =====================================================

  const guardarSala = async () => {
    try {
      setGuardando(true);

      // -----------------------------------------------
      // 1. CREAR SALA
      // -----------------------------------------------

      const { data: sala, error: salaError } = await supabase
        .from("salas")
        .insert({
          nombre: formulario.nombre.trim() || null,

          codigo: formulario.codigo.trim() || null,

          ubicacion: formulario.ubicacion.trim() || null,

          piso: formulario.piso.trim() || null,

          responsable: formulario.responsable.trim() || null,

          observaciones: formulario.observaciones.trim() || null,
        })
        .select()
        .single();

      if (salaError) {
        throw salaError;
      }

      // -----------------------------------------------
      // 2. SUBIR FOTO SI EXISTE
      // -----------------------------------------------

      if (foto) {
        const ruta = `salas/${sala.id}/sala.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("salas")
          .upload(ruta, foto, {
            upsert: true,
            contentType: "image/jpeg",
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from("salas")
          .getPublicUrl(ruta);

        const fotoUrl = publicUrlData.publicUrl;

        const { error: fotoUpdateError } = await supabase
          .from("salas")
          .update({
            foto_url: fotoUrl,
          })
          .eq("id", sala.id);

        if (fotoUpdateError) {
          throw fotoUpdateError;
        }
      }

      // -----------------------------------------------
      // 3. IGLESIAS
      // -----------------------------------------------

      if (iglesiasSeleccionadas.length > 0) {
        const registros = iglesiasSeleccionadas.map((iglesiaId) => ({
          sala_id: sala.id,

          iglesia_id: iglesiaId,
        }));

        const { error: iglesiasError } = await supabase
          .from("sala_iglesias")
          .insert(registros);

        if (iglesiasError) {
          throw iglesiasError;
        }
      }

      // -----------------------------------------------
      // 4. INVENTARIO
      // -----------------------------------------------

      const inventarioGuardar = inventario
        .filter((item) => Number(item.cantidad || 0) > 0)
        .map((item) => ({
          sala_id: sala.id,

          tipo_inventario_id: item.tipo_inventario_id || null,

          nombre_personalizado: item.nombre_personalizado || null,

          cantidad: Number(item.cantidad || 0),

          observacion: item.observacion || null,
        }));

      if (inventarioGuardar.length > 0) {
        const { error: inventarioError } = await supabase
          .from("sala_inventario")
          .insert(inventarioGuardar);

        if (inventarioError) {
          throw inventarioError;
        }
      }

      // -----------------------------------------------
      // 5. IR AL DETALLE
      // -----------------------------------------------

      navigate(`/salas/${sala.id}`);
    } catch (error) {
      console.error("Error guardando sala:", error);

      alert(error?.message || "No fue posible guardar la sala.");
    } finally {
      setGuardando(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mx-auto mb-8 flex max-w-4xl items-center gap-4">
        <Link
          to="/salas"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft size={19} />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nueva sala</h1>

          <p className="mt-1 text-sm text-slate-500">
            Registra todo lo que encontrarás dentro de esta sala
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6">
        {/* ================================================= */}
        {/* INFORMACIÓN */}
        {/* ================================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={<School size={19} />}
            title="Información de la sala"
            subtitle="Datos generales"
          />

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Input
              label="Nombre de la sala"
              name="nombre"
              value={formulario.nombre}
              onChange={handleChange}
              placeholder="Ej: Sala 101"
            />

            <Input
              label="Código"
              name="codigo"
              value={formulario.codigo}
              onChange={handleChange}
              placeholder="Ej: SALA-101"
            />

            <Input
              label="Ubicación"
              name="ubicacion"
              value={formulario.ubicacion}
              onChange={handleChange}
              placeholder="Ej: Edificio A"
            />

            <Input
              label="Piso"
              name="piso"
              value={formulario.piso}
              onChange={handleChange}
              placeholder="Ej: Primer piso"
            />
          </div>
        </section>

        {/* ================================================= */}
        {/* FOTOGRAFÍA */}
        {/* ================================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={<Camera size={19} />}
            title="Fotografía de la sala"
            subtitle="Puedes tomar una fotografía o elegirla desde el dispositivo"
          />

          {/* SOLO GALERÍA / ARCHIVO */}

          <input
            ref={inputGaleriaRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFoto}
          />

          <div className="mt-6">
            {!preview ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {/* ----------------------------------------- */}
                {/* CÁMARA TRASERA */}
                {/* ----------------------------------------- */}

                <button
                  type="button"
                  onClick={() => abrirCamara("environment")}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center transition hover:border-slate-400 hover:bg-slate-100"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <Camera size={27} className="text-slate-500" />
                  </div>

                  <p className="mt-4 font-semibold text-slate-800">
                    Cámara trasera
                  </p>

                  <p className="mt-1 text-sm text-slate-500">Recomendada</p>
                </button>

                {/* ----------------------------------------- */}
                {/* CÁMARA FRONTAL */}
                {/* ----------------------------------------- */}

                <button
                  type="button"
                  onClick={() => abrirCamara("user")}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white px-5 py-10 text-center transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <Camera size={27} className="text-slate-500" />
                  </div>

                  <p className="mt-4 font-semibold text-slate-800">
                    Cámara frontal
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Usar cámara frontal
                  </p>
                </button>

                {/* ----------------------------------------- */}
                {/* GALERÍA */}
                {/* ----------------------------------------- */}

                <button
                  type="button"
                  onClick={abrirGaleria}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white px-5 py-10 text-center transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <ImageIcon size={27} className="text-slate-500" />
                  </div>

                  <p className="mt-4 font-semibold text-slate-800">
                    Elegir fotografía
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Desde el dispositivo
                  </p>
                </button>
              </div>
            ) : (
              /* =========================================== */
              /* FOTO SELECCIONADA */
              /* =========================================== */

              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <img
                  src={preview}
                  alt="Vista previa de la sala"
                  className="max-h-[500px] w-full object-cover"
                />

                {/* ELIMINAR FOTO */}

                <button
                  type="button"
                  onClick={eliminarFoto}
                  title="Eliminar fotografía"
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={17} />
                </button>

                {/* CAMBIAR FOTO */}

                <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => abrirCamara("environment")}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/95 px-4 py-2.5 text-sm font-medium text-slate-800 shadow-lg"
                  >
                    <Camera size={17} />
                    Trasera
                  </button>

                  <button
                    type="button"
                    onClick={() => abrirCamara("user")}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/95 px-4 py-2.5 text-sm font-medium text-slate-800 shadow-lg"
                  >
                    <Camera size={17} />
                    Frontal
                  </button>

                  <button
                    type="button"
                    onClick={abrirGaleria}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/95 px-4 py-2.5 text-sm font-medium text-slate-800 shadow-lg"
                  >
                    <ImageIcon size={17} />
                    Cambiar
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="mt-3 text-xs text-slate-400">
            La fotografía es opcional. Puedes guardar la sala sin agregar una
            imagen.
          </p>
        </section>

        {/* ================================================= */}
        {/* IGLESIAS */}
        {/* ================================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={<Church size={19} />}
            title="Iglesias alojadas"
            subtitle="Puedes seleccionar más de una iglesia"
          />

          <div className="mt-6 space-y-2">
            {iglesias.map((iglesia) => {
              const seleccionada = iglesiasSeleccionadas.includes(iglesia.id);

              return (
                <button
                  key={iglesia.id}
                  type="button"
                  onClick={() => toggleIglesia(iglesia.id)}
                  className={`
                      flex w-full items-center justify-between rounded-xl border p-4 text-left transition
                      ${
                        seleccionada
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 hover:bg-slate-50"
                      }
                    `}
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {iglesia.nombre}
                    </p>

                    {iglesia.ciudad && (
                      <p className="mt-1 text-xs text-slate-500">
                        {iglesia.ciudad}
                      </p>
                    )}
                  </div>

                  <div
                    className={`
                        flex h-6 w-6 items-center justify-center rounded-lg border text-sm
                        ${
                          seleccionada
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300"
                        }
                      `}
                  >
                    {seleccionada && "✓"}
                  </div>
                </button>
              );
            })}

            {iglesias.length === 0 && (
              <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                Todavía no hay iglesias registradas.
              </div>
            )}
          </div>
        </section>

        {/* ================================================= */}
        {/* INVENTARIO */}
        {/* ================================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={<Package size={19} />}
            title="Inventario de la sala"
            subtitle="Registra todo lo que encuentres dentro de ella"
          />

          <div className="mt-6 divide-y divide-slate-100">
            {tiposInventario.map((tipo) => {
              const cantidad = obtenerCantidad(tipo.id);

              const observacion = obtenerObservacion(tipo.id);

              return (
                <div key={tipo.id} className="py-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">
                        {tipo.nombre}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(tipo.id, -1)}
                        disabled={cantidad === 0}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Minus size={16} />
                      </button>

                      <input
                        type="number"
                        min="0"
                        value={cantidad}
                        onChange={(e) =>
                          cambiarCantidadDirecta(tipo.id, e.target.value)
                        }
                        className="h-9 w-14 rounded-lg border border-slate-200 text-center text-sm font-semibold outline-none focus:border-slate-400"
                      />

                      <button
                        type="button"
                        onClick={() => cambiarCantidad(tipo.id, 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {cantidad > 0 && (
                    <input
                      type="text"
                      value={observacion}
                      onChange={(e) =>
                        cambiarObservacion(tipo.id, e.target.value)
                      }
                      placeholder={`Observación de ${tipo.nombre.toLowerCase()}...`}
                      className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* ================================================= */}
          {/* ELEMENTOS PERSONALIZADOS */}
          {/* ================================================= */}

          {inventario
            .filter((item) => item.nombre_personalizado)
            .map((item) => {
              const indiceReal = inventario.indexOf(item);

              return (
                <div
                  key={`${item.nombre_personalizado}-${indiceReal}`}
                  className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-800">
                        {item.nombre_personalizado}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Elemento personalizado
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => eliminarElementoPersonalizado(indiceReal)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => {
                        const cantidad = Math.max(
                          parseInt(e.target.value || "1", 10),
                          1,
                        );

                        setInventario((prev) =>
                          prev.map((elemento, i) =>
                            i === indiceReal
                              ? {
                                  ...elemento,
                                  cantidad,
                                }
                              : elemento,
                          ),
                        );
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none"
                    />

                    <input
                      type="text"
                      value={item.observacion || ""}
                      onChange={(e) => {
                        const observacion = e.target.value;

                        setInventario((prev) =>
                          prev.map((elemento, i) =>
                            i === indiceReal
                              ? {
                                  ...elemento,
                                  observacion,
                                }
                              : elemento,
                          ),
                        );
                      }}
                      placeholder="Observación"
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none"
                    />
                  </div>
                </div>
              );
            })}

          {/* ================================================= */}
          {/* AGREGAR ELEMENTO */}
          {/* ================================================= */}

          {!mostrarAgregarElemento && (
            <button
              type="button"
              onClick={() => setMostrarAgregarElemento(true)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Plus size={17} />
              Agregar otro elemento
            </button>
          )}

          {mostrarAgregarElemento && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">
                    Nuevo elemento
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Para objetos que no están en el listado
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMostrarAgregarElemento(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Input
                  label="Nombre"
                  name="nombre"
                  value={nuevoElemento.nombre}
                  onChange={handleNuevoElementoChange}
                  placeholder="Ej: Ventilador industrial"
                />

                <Input
                  label="Cantidad"
                  name="cantidad"
                  type="number"
                  min="1"
                  value={nuevoElemento.cantidad}
                  onChange={handleNuevoElementoChange}
                />
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Observación
                </span>

                <input
                  name="observacion"
                  value={nuevoElemento.observacion}
                  onChange={handleNuevoElementoChange}
                  placeholder="Ej: Uno está malo"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                />
              </label>

              <button
                type="button"
                onClick={agregarElementoPersonalizado}
                disabled={!nuevoElemento.nombre.trim()}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                <Plus size={17} />
                Agregar elemento
              </button>
            </div>
          )}
        </section>

        {/* ================================================= */}
        {/* RESPONSABLE */}
        {/* ================================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={<User size={19} />}
            title="Responsable"
            subtitle="Campo opcional"
          />

          <div className="mt-6">
            <Input
              label="Nombre"
              name="responsable"
              value={formulario.responsable}
              onChange={handleChange}
              placeholder="Ej: Gabriel Mena"
            />
          </div>
        </section>

        {/* ================================================= */}
        {/* OBSERVACIONES */}
        {/* ================================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={<FileText size={19} />}
            title="Observaciones generales"
            subtitle="Cualquier información adicional"
          />

          <textarea
            name="observaciones"
            value={formulario.observaciones}
            onChange={handleChange}
            rows={4}
            placeholder="Ej: La ventana del fondo no cierra correctamente..."
            className="mt-6 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
          />
        </section>

        {/* ================================================= */}
        {/* BOTONES */}
        {/* ================================================= */}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/salas"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>

          <button
            type="button"
            onClick={guardarSala}
            disabled={guardando}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={18} />

            {guardando ? "Guardando..." : "Guardar sala"}
          </button>
        </div>
      </div>

      {/* =================================================== */}
      {/* MODAL CÁMARA */}
      {/* =================================================== */}

      {camaraAbierta && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
          <div className="relative h-full w-full max-w-5xl bg-black">
            {/* VIDEO */}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-contain ${
                tipoCamara === "user" ? "-scale-x-100" : ""
              }`}
            />

            {/* PARTE SUPERIOR */}

            <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
              {/* CERRAR */}

              <button
                type="button"
                onClick={cerrarCamara}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
                title="Cerrar cámara"
              >
                <X size={22} />
              </button>

              {/* NOMBRE */}

              <div className="rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                {tipoCamara === "environment"
                  ? "Cámara trasera"
                  : "Cámara frontal"}
              </div>

              {/* CAMBIAR */}

              <button
                type="button"
                onClick={cambiarCamara}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
                title="Cambiar cámara"
              >
                <RotateCcw size={21} />
              </button>
            </div>

            {/* PARTE INFERIOR */}

            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center bg-gradient-to-t from-black/80 to-transparent p-10">
              <button
                type="button"
                onClick={tomarFoto}
                className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white shadow-2xl transition active:scale-95"
                title="Tomar fotografía"
              >
                <div className="h-14 w-14 rounded-full border-2 border-slate-300" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================
// INPUT
// =========================================================

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <input
        {...props}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      />
    </label>
  );
}

// =========================================================
// TITULO DE SECCIÓN
// =========================================================

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
