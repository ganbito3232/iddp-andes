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
  Users,
  UserRound,
} from "lucide-react";

import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function EditarSala() {
  const { id } = useParams();
  const navigate = useNavigate();

  const inputGaleriaRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [sala, setSala] = useState(null);

  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [eliminarFotoActual, setEliminarFotoActual] = useState(false);

  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [tipoCamara, setTipoCamara] = useState("environment");

  const [iglesias, setIglesias] = useState([]);
  const [iglesiasSeleccionadas, setIglesiasSeleccionadas] = useState([]);

  const [asignacionesExistentes, setAsignacionesExistentes] = useState([]);

  const [tiposInventario, setTiposInventario] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [inventarioOriginal, setInventarioOriginal] = useState([]);

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

  const [tipoSala, setTipoSala] = useState("");

  useEffect(() => {
    cargarDatos();

    return () => {
      detenerCamara();

      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [id]);

  // =====================================================
  // CARGAR SALA + CATÁLOGOS
  // =====================================================

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [
        { data: salaData, error: salaError },
        { data: iglesiasData, error: iglesiasError },
        { data: tiposData, error: tiposError },
        { data: asignacionesData, error: asignacionesError },
        { data: salasData, error: salasError },
      ] = await Promise.all([
        supabase.from("salas").select("*").eq("id", id).single(),

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

        supabase
          .from("sala_iglesias")
          .select("id, sala_id, iglesia_id, cantidad, observacion, activo"),

        supabase.from("salas").select("id, tipo_sala"),
      ]);

      if (salaError) throw salaError;
      if (iglesiasError) throw iglesiasError;
      if (tiposError) throw tiposError;
      if (asignacionesError) throw asignacionesError;
      if (salasError) throw salasError;

      setSala(salaData);
      setIglesias(iglesiasData || []);
      setTiposInventario(tiposData || []);

      setFormulario({
        nombre: salaData.nombre || "",
        codigo: salaData.codigo || "",
        ubicacion: salaData.ubicacion || "",
        piso: salaData.piso || "",
        responsable: salaData.responsable || "",
        observaciones: salaData.observaciones || "",
      });

      setTipoSala(salaData.tipo_sala || "");

      if (salaData.foto_url) {
        setPreview(salaData.foto_url);
      }

      const salasMap = {};
      (salasData || []).forEach((item) => {
        salasMap[String(item.id)] = item.tipo_sala || null;
      });

      const asignaciones = (asignacionesData || []).map((item) => ({
        id: item.id,
        sala_id: item.sala_id,
        iglesia_id: item.iglesia_id,
        cantidad: Number(item.cantidad || 0),
        observacion: item.observacion || "",
        activo: item.activo !== false,
        tipo_sala: salasMap[String(item.sala_id)] || null,
      }));

      setAsignacionesExistentes(asignaciones);

      const propias = asignaciones
        .filter(
          (item) =>
            String(item.sala_id) === String(id) && item.activo !== false,
        )
        .map((item) => ({
          id: item.id,
          iglesia_id: item.iglesia_id,
          cantidad: Number(item.cantidad || 0),
          observacion: item.observacion || "",
        }));

      setIglesiasSeleccionadas(propias);

      const { data: inventarioData, error: inventarioError } = await supabase
        .from("sala_inventario")
        .select(
          `
          id,
          sala_id,
          tipo_inventario_id,
          nombre_personalizado,
          cantidad,
          observacion
        `,
        )
        .eq("sala_id", id);

      if (inventarioError) throw inventarioError;

      setInventario(inventarioData || []);
      setInventarioOriginal(inventarioData || []);
    } catch (error) {
      console.error("Error cargando sala:", error);
      alert(error?.message || "No fue posible cargar la sala.");
      navigate("/salas");
    } finally {
      setLoading(false);
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
  // STOCK
  // =====================================================

  const obtenerStockTotal = (iglesia) => {
    if (!iglesia || !tipoSala) return 0;

    if (tipoSala === "HOMBRE") {
      return Number(iglesia.hombres || 0);
    }

    if (tipoSala === "MUJER") {
      return Number(iglesia.mujeres || 0);
    }

    return 0;
  };

  // Asignaciones de otras salas.
  // La sala que estamos editando se excluye.
  const obtenerAsignadoEnOtrasSalas = (iglesiaId) => {
    if (!tipoSala) return 0;

    return asignacionesExistentes
      .filter((item) => {
        return (
          String(item.iglesia_id) === String(iglesiaId) &&
          String(item.sala_id) !== String(id) &&
          item.tipo_sala === tipoSala &&
          item.activo !== false
        );
      })
      .reduce((total, item) => total + Number(item.cantidad || 0), 0);
  };

  const obtenerDisponibleParaEstaSala = (iglesia) => {
    const stock = obtenerStockTotal(iglesia);
    const otrasSalas = obtenerAsignadoEnOtrasSalas(iglesia.id);

    return Math.max(stock - otrasSalas, 0);
  };

  const obtenerCantidadSeleccionada = (iglesiaId) => {
    const registro = iglesiasSeleccionadas.find(
      (item) => String(item.iglesia_id) === String(iglesiaId),
    );

    return registro?.cantidad ?? 0;
  };

  const obtenerErrorStock = () => {
    return iglesiasSeleccionadas
      .map((item) => {
        const iglesia = iglesias.find(
          (i) => String(i.id) === String(item.iglesia_id),
        );

        if (!iglesia) return null;

        const cantidad = Number(item.cantidad || 0);
        const disponible = obtenerDisponibleParaEstaSala(iglesia);

        if (cantidad > disponible) {
          return {
            iglesia,
            cantidad,
            disponible,
          };
        }

        return null;
      })
      .filter(Boolean);
  };

  // =====================================================
  // TIPO DE SALA
  // =====================================================

  const cambiarTipoSala = (tipo) => {
    if (tipo === tipoSala) return;

    const cantidadesActuales = iglesiasSeleccionadas.filter(
      (item) => Number(item.cantidad || 0) > 0,
    );

    if (cantidadesActuales.length > 0) {
      const confirmar = window.confirm(
        "Cambiar el tipo de sala cambia el stock utilizado (hombres/mujeres). ¿Quieres continuar? Revisa nuevamente las cantidades.",
      );

      if (!confirmar) return;

      setIglesiasSeleccionadas([]);
    }

    setTipoSala(tipo);
  };

  // =====================================================
  // CANTIDAD IGLESIA
  // =====================================================

  const cambiarCantidadIglesia = (iglesia, nuevaCantidad) => {
    const cantidad = Math.max(Number(nuevaCantidad) || 0, 0);

    setIglesiasSeleccionadas((prev) => {
      const existe = prev.some(
        (item) => String(item.iglesia_id) === String(iglesia.id),
      );

      if (cantidad === 0) {
        return prev.filter(
          (item) => String(item.iglesia_id) !== String(iglesia.id),
        );
      }

      if (!existe) {
        return [
          ...prev,
          {
            iglesia_id: iglesia.id,
            cantidad,
            observacion: "",
          },
        ];
      }

      return prev.map((item) =>
        String(item.iglesia_id) === String(iglesia.id)
          ? {
              ...item,
              cantidad,
            }
          : item,
      );
    });
  };

  // =====================================================
  // FOTO
  // =====================================================

  const handleFoto = (e) => {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      alert("Selecciona una imagen válida.");
      e.target.value = "";
      return;
    }

    if (archivo.size > 10 * 1024 * 1024) {
      alert("La imagen no puede superar los 10 MB.");
      e.target.value = "";
      return;
    }

    setFoto(archivo);
    setEliminarFotoActual(false);

    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setPreview(URL.createObjectURL(archivo));
    e.target.value = "";
  };

  const abrirGaleria = () => {
    inputGaleriaRef.current?.click();
  };

  const eliminarFoto = () => {
    setFoto(null);

    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setPreview(null);
    setEliminarFotoActual(true);

    if (inputGaleriaRef.current) {
      inputGaleriaRef.current.value = "";
    }
  };

  // =====================================================
  // CÁMARA
  // =====================================================

  const detenerCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const abrirCamara = async (tipo = "environment") => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
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
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (error) {
      console.error("Error accediendo a la cámara:", error);

      if (error?.name === "NotAllowedError") {
        alert("Debes permitir el acceso a la cámara.");
      } else if (error?.name === "NotFoundError") {
        alert("No se encontró ninguna cámara.");
      } else if (error?.name === "NotReadableError") {
        alert("La cámara está siendo utilizada por otra aplicación.");
      } else {
        alert("No fue posible acceder a la cámara.");
      }
    }
  };

  const cerrarCamara = () => {
    detenerCamara();
    setCamaraAbierta(false);
  };

  const cambiarCamara = async () => {
    const nueva = tipoCamara === "environment" ? "user" : "environment";

    await abrirCamara(nueva);
  };

  const tomarFoto = () => {
    const video = videoRef.current;

    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      alert("La cámara todavía no está lista.");
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const contexto = canvas.getContext("2d");

    if (!contexto) return;

    if (tipoCamara === "user") {
      contexto.translate(canvas.width, 0);
      contexto.scale(-1, 1);
    }

    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const archivo = new File([blob], `sala-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        setFoto(archivo);
        setEliminarFotoActual(false);

        if (preview?.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }

        setPreview(URL.createObjectURL(archivo));

        cerrarCamara();
      },
      "image/jpeg",
      0.9,
    );
  };

  // =====================================================
  // INVENTARIO
  // =====================================================

  const obtenerCantidadInventario = (tipoId) => {
    const item = inventario.find(
      (elemento) =>
        String(elemento.tipo_inventario_id) === String(tipoId) &&
        !elemento.nombre_personalizado,
    );

    return Number(item?.cantidad || 0);
  };

  const obtenerObservacionInventario = (tipoId) => {
    const item = inventario.find(
      (elemento) =>
        String(elemento.tipo_inventario_id) === String(tipoId) &&
        !elemento.nombre_personalizado,
    );

    return item?.observacion || "";
  };

  const cambiarCantidadInventario = (tipoId, valor) => {
    const cantidad = Math.max(parseInt(valor || "0", 10), 0);

    setInventario((prev) => {
      const existe = prev.find(
        (item) =>
          String(item.tipo_inventario_id) === String(tipoId) &&
          !item.nombre_personalizado,
      );

      if (cantidad === 0) {
        return prev.filter(
          (item) =>
            !(
              String(item.tipo_inventario_id) === String(tipoId) &&
              !item.nombre_personalizado
            ),
        );
      }

      if (!existe) {
        return [
          ...prev,
          {
            tipo_inventario_id: tipoId,
            cantidad,
            observacion: "",
            nombre_personalizado: null,
          },
        ];
      }

      return prev.map((item) =>
        item === existe
          ? {
              ...item,
              cantidad,
            }
          : item,
      );
    });
  };

  const cambiarObservacionInventario = (tipoId, observacion) => {
    setInventario((prev) => {
      const existe = prev.find(
        (item) =>
          String(item.tipo_inventario_id) === String(tipoId) &&
          !item.nombre_personalizado,
      );

      if (!existe) {
        return [
          ...prev,
          {
            tipo_inventario_id: tipoId,
            cantidad: 1,
            observacion,
            nombre_personalizado: null,
          },
        ];
      }

      return prev.map((item) =>
        item === existe
          ? {
              ...item,
              observacion,
            }
          : item,
      );
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

    if (!nombre) return;

    setInventario((prev) => [
      ...prev,
      {
        id: null,
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
  // GUARDAR
  // =====================================================

  const guardarSala = async () => {
    try {
      if (!formulario.nombre.trim()) {
        alert("Debes ingresar el nombre de la sala.");
        return;
      }

      const erroresStock = obtenerErrorStock();

      if (erroresStock.length > 0) {
        const detalle = erroresStock
          .map(
            (error) =>
              `${error.iglesia.nombre}: ${error.cantidad} asignadas, máximo ${error.disponible}.`,
          )
          .join("\n");

        alert(`Hay cantidades superiores al stock disponible.\n\n${detalle}`);

        return;
      }

      setGuardando(true);

      // -----------------------------------------------
      // 1. ACTUALIZAR SALA
      // -----------------------------------------------

      const { error: salaError } = await supabase
        .from("salas")
        .update({
          nombre: formulario.nombre.trim() || null,
          codigo: formulario.codigo.trim() || null,
          ubicacion: formulario.ubicacion.trim() || null,
          piso: formulario.piso.trim() || null,
          responsable: formulario.responsable.trim() || null,
          observaciones: formulario.observaciones.trim() || null,
          tipo_sala: tipoSala || null,
        })
        .eq("id", id);

      if (salaError) {
        throw salaError;
      }

      // -----------------------------------------------
      // 2. FOTO
      // -----------------------------------------------

      if (foto) {
        const ruta = `salas/${id}/sala.jpg`;

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

        const { error: fotoError } = await supabase
          .from("salas")
          .update({
            foto_url: publicUrlData.publicUrl,
          })
          .eq("id", id);

        if (fotoError) {
          throw fotoError;
        }
      } else if (eliminarFotoActual) {
        const { error: fotoError } = await supabase
          .from("salas")
          .update({
            foto_url: null,
          })
          .eq("id", id);

        if (fotoError) {
          throw fotoError;
        }
      }

      // -----------------------------------------------
      // 3. IGLESIAS
      // -----------------------------------------------

      const relacionesActuales = asignacionesExistentes.filter(
        (item) => String(item.sala_id) === String(id),
      );

      const relacionesDeseadas = iglesiasSeleccionadas
        .map((item) => ({
          iglesia_id: item.iglesia_id,
          cantidad: Number(item.cantidad || 0),
          observacion: item.observacion || null,
        }))
        .filter((item) => item.cantidad > 0);

      const idsDeseados = new Set(
        relacionesDeseadas.map((item) => String(item.iglesia_id)),
      );

      // Eliminar relaciones que quedaron en 0
      const relacionesAEliminar = relacionesActuales.filter(
        (item) => !idsDeseados.has(String(item.iglesia_id)),
      );

      for (const relacion of relacionesAEliminar) {
        const { error } = await supabase
          .from("sala_iglesias")
          .delete()
          .eq("id", relacion.id);

        if (error) throw error;
      }

      // Actualizar o insertar.
      // Nunca usamos insert masivo para una relación que
      // puede tener UNIQUE(sala_id, iglesia_id).
      for (const relacion of relacionesDeseadas) {
        const existente = relacionesActuales.find(
          (item) => String(item.iglesia_id) === String(relacion.iglesia_id),
        );

        if (existente) {
          const { error } = await supabase
            .from("sala_iglesias")
            .update({
              cantidad: relacion.cantidad,
              observacion: relacion.observacion,
              activo: true,
            })
            .eq("id", existente.id);

          if (error) throw error;
        } else {
          const { error } = await supabase.from("sala_iglesias").insert({
            sala_id: id,
            iglesia_id: relacion.iglesia_id,
            cantidad: relacion.cantidad,
            observacion: relacion.observacion,
            activo: true,
          });

          if (error) throw error;
        }
      }

      // -----------------------------------------------
      // 4. INVENTARIO
      // -----------------------------------------------
      // No borramos todo para volver a insertar.
      // La tabla tiene UNIQUE(sala_id, tipo_inventario_id),
      // por lo que los elementos existentes se actualizan,
      // los nuevos se insertan y los eliminados se borran.

      const inventarioActual = inventario.filter(
        (item) => Number(item.cantidad || 0) > 0,
      );

      const idsActuales = new Set(
        inventarioActual
          .filter((item) => item.id)
          .map((item) => String(item.id)),
      );

      // Eliminar registros que existían al cargar la sala pero
      // que el usuario quitó o dejó en cantidad 0.
      const idsAEliminar = inventarioOriginal
        .filter((item) => item.id)
        .filter((item) => !idsActuales.has(String(item.id)))
        .map((item) => item.id);

      if (idsAEliminar.length > 0) {
        const { error: eliminarInventarioError } = await supabase
          .from("sala_inventario")
          .delete()
          .in("id", idsAEliminar)
          .eq("sala_id", id);

        if (eliminarInventarioError) {
          throw eliminarInventarioError;
        }
      }

      // Actualizar existentes / insertar nuevos.
      for (const item of inventarioActual) {
        if (item.id) {
          const { error: actualizarInventarioError } = await supabase
            .from("sala_inventario")
            .update({
              tipo_inventario_id: item.tipo_inventario_id || null,
              nombre_personalizado: item.nombre_personalizado || null,
              cantidad: Number(item.cantidad || 0),
              observacion: item.observacion || null,
            })
            .eq("id", item.id)
            .eq("sala_id", id);

          if (actualizarInventarioError) {
            throw actualizarInventarioError;
          }
        } else if (item.tipo_inventario_id) {
          // Elemento del catálogo nuevo.
          // Upsert evita el 409 de la restricción UNIQUE.
          const { error: insertarInventarioError } = await supabase
            .from("sala_inventario")
            .upsert(
              {
                sala_id: id,
                tipo_inventario_id: item.tipo_inventario_id,
                nombre_personalizado: null,
                cantidad: Number(item.cantidad || 0),
                observacion: item.observacion || null,
              },
              {
                onConflict: "sala_id,tipo_inventario_id",
              },
            );

          if (insertarInventarioError) {
            throw insertarInventarioError;
          }
        } else {
          // Elemento personalizado.
          const { error: insertarPersonalizadoError } = await supabase
            .from("sala_inventario")
            .insert({
              sala_id: id,
              tipo_inventario_id: null,
              nombre_personalizado: item.nombre_personalizado || null,
              cantidad: Number(item.cantidad || 0),
              observacion: item.observacion || null,
            });

          if (insertarPersonalizadoError) {
            throw insertarPersonalizadoError;
          }
        }
      }

      navigate(`/salas/${id}`);
    } catch (error) {
      console.error("Error guardando cambios:", error);
      alert(error?.message || "No fue posible guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  };

  // =====================================================
  // TOTALES
  // =====================================================

  const totalPersonas = iglesiasSeleccionadas.reduce(
    (total, item) => total + Number(item.cantidad || 0),
    0,
  );

  const erroresStock = obtenerErrorStock();

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Cargando sala...</p>
      </div>
    );
  }

  if (!sala) {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* HEADER */}

        <div className="mb-8 flex items-center gap-4">
          <Link
            to={`/salas/${id}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft size={19} />
          </Link>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              EDITAR SALA
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              {formulario.nombre || "Sala"}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Modifica la información y distribución de personas.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* INFORMACIÓN */}

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
              />

              <Input
                label="Código"
                name="codigo"
                value={formulario.codigo}
                onChange={handleChange}
              />

              <Input
                label="Ubicación"
                name="ubicacion"
                value={formulario.ubicacion}
                onChange={handleChange}
              />

              <Input
                label="Piso"
                name="piso"
                value={formulario.piso}
                onChange={handleChange}
              />
            </div>
          </section>

          {/* TIPO */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionTitle
              icon={<Users size={19} />}
              title="Tipo de sala"
              subtitle="Determina si se utiliza el stock de hombres o mujeres"
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => cambiarTipoSala("HOMBRE")}
                className={`rounded-2xl border p-5 text-left transition ${
                  tipoSala === "HOMBRE"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserRound size={22} />
                  <div>
                    <p className="font-semibold">Sala de hombres</p>
                    <p
                      className={`mt-1 text-sm ${
                        tipoSala === "HOMBRE"
                          ? "text-slate-300"
                          : "text-slate-500"
                      }`}
                    >
                      Usa iglesias.hombres
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => cambiarTipoSala("MUJER")}
                className={`rounded-2xl border p-5 text-left transition ${
                  tipoSala === "MUJER"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserRound size={22} />
                  <div>
                    <p className="font-semibold">Sala de mujeres</p>
                    <p
                      className={`mt-1 text-sm ${
                        tipoSala === "MUJER"
                          ? "text-slate-300"
                          : "text-slate-500"
                      }`}
                    >
                      Usa iglesias.mujeres
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {!tipoSala && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                Esta sala no tiene tipo definido. Puedes editar la información,
                pero la distribución de personas requiere seleccionar Hombres o
                Mujeres.
              </div>
            )}
          </section>

          {/* FOTO */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionTitle
              icon={<Camera size={19} />}
              title="Fotografía"
              subtitle="Puedes cambiar o eliminar la fotografía"
            />

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
                  <button
                    type="button"
                    onClick={() => abrirCamara("environment")}
                    className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center hover:bg-slate-100"
                  >
                    <Camera size={27} className="mx-auto text-slate-500" />
                    <p className="mt-3 font-semibold">Cámara trasera</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => abrirCamara("user")}
                    className="rounded-2xl border-2 border-dashed border-slate-300 bg-white px-5 py-10 text-center hover:bg-slate-50"
                  >
                    <Camera size={27} className="mx-auto text-slate-500" />
                    <p className="mt-3 font-semibold">Cámara frontal</p>
                  </button>

                  <button
                    type="button"
                    onClick={abrirGaleria}
                    className="rounded-2xl border-2 border-dashed border-slate-300 bg-white px-5 py-10 text-center hover:bg-slate-50"
                  >
                    <ImageIcon size={27} className="mx-auto text-slate-500" />
                    <p className="mt-3 font-semibold">Elegir fotografía</p>
                  </button>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-2xl border border-slate-200">
                  <img
                    src={preview}
                    alt="Sala"
                    className="max-h-[500px] w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={eliminarFoto}
                    title="Eliminar fotografía"
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg hover:text-red-600"
                  >
                    <Trash2 size={17} />
                  </button>

                  <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => abrirCamara("environment")}
                      className="flex-1 rounded-xl bg-white/95 px-4 py-2.5 text-sm font-medium shadow-lg"
                    >
                      Trasera
                    </button>

                    <button
                      type="button"
                      onClick={() => abrirCamara("user")}
                      className="flex-1 rounded-xl bg-white/95 px-4 py-2.5 text-sm font-medium shadow-lg"
                    >
                      Frontal
                    </button>

                    <button
                      type="button"
                      onClick={abrirGaleria}
                      className="flex-1 rounded-xl bg-white/95 px-4 py-2.5 text-sm font-medium shadow-lg"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* IGLESIAS */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionTitle
              icon={<Church size={19} />}
              title="Iglesias alojadas"
              subtitle="Modifica la cantidad asignada a esta sala"
            />

            {!tipoSala ? (
              <div className="mt-6 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                Selecciona Hombres o Mujeres para administrar las cantidades.
              </div>
            ) : (
              <>
                <div
                  className={`mt-6 rounded-2xl p-5 text-white ${
                    erroresStock.length > 0 ? "bg-red-600" : "bg-slate-900"
                  }`}
                >
                  <p className="text-sm text-slate-300">
                    Personas en esta sala
                  </p>

                  <p className="mt-1 text-4xl font-bold">{totalPersonas}</p>

                  <p className="mt-1 text-xs text-slate-300">
                    {tipoSala === "HOMBRE" ? "Hombres" : "Mujeres"}
                  </p>

                  {erroresStock.length > 0 && (
                    <p className="mt-3 text-sm text-red-100">
                      Hay cantidades superiores al máximo disponible.
                    </p>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  {iglesias.map((iglesia) => {
                    const stock = obtenerStockTotal(iglesia);
                    const otrasSalas = obtenerAsignadoEnOtrasSalas(iglesia.id);

                    // Máximo que esta sala puede ocupar.
                    // No considera la cantidad que ya tiene esta misma sala.
                    const disponible = obtenerDisponibleParaEstaSala(iglesia);

                    // Cantidad actualmente asignada a esta sala.
                    const cantidad = obtenerCantidadSeleccionada(iglesia.id);

                    // Cantidad que realmente queda libre para esta iglesia.
                    // Ejemplo: stock 7 - otras salas 0 - esta sala 5 = 2.
                    const disponibleRestante = Math.max(
                      disponible - Number(cantidad || 0),
                      0,
                    );

                    const excede = Number(cantidad || 0) > disponible;

                    return (
                      <div
                        key={iglesia.id}
                        className={`rounded-2xl border p-5 ${
                          excede
                            ? "border-red-300 bg-red-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-slate-800">
                              {iglesia.nombre}
                            </p>

                            {iglesia.ciudad && (
                              <p className="mt-1 text-xs text-slate-500">
                                {iglesia.ciudad}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-right">
                            <div>
                              <p className="text-xs text-slate-400">Stock</p>
                              <p className="font-bold">{stock}</p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-400">
                                Otras salas
                              </p>
                              <p className="font-bold">{otrasSalas}</p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-400">
                                Disponible
                              </p>
                              <p
                                className={`font-bold ${
                                  disponibleRestante > 0
                                    ? "text-emerald-600"
                                    : "text-red-500"
                                }`}
                              >
                                {disponibleRestante}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              Cantidad en esta sala
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Máximo para esta sala: {disponible}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={Number(cantidad || 0) <= 0}
                              onClick={() =>
                                cambiarCantidadIglesia(
                                  iglesia,
                                  Number(cantidad || 0) - 1,
                                )
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white disabled:opacity-30"
                            >
                              <Minus size={17} />
                            </button>

                            <input
                              type="number"
                              min="0"
                              value={cantidad}
                              onChange={(e) =>
                                cambiarCantidadIglesia(iglesia, e.target.value)
                              }
                              className={`h-10 w-20 rounded-xl border text-center font-bold outline-none ${
                                excede
                                  ? "border-red-400 bg-red-50 text-red-700"
                                  : "border-slate-200 bg-white"
                              }`}
                            />

                            <button
                              type="button"
                              disabled={Number(cantidad || 0) >= disponible}
                              onClick={() =>
                                cambiarCantidadIglesia(
                                  iglesia,
                                  Number(cantidad || 0) + 1,
                                )
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Plus size={17} />
                            </button>
                          </div>
                        </div>

                        {excede && (
                          <div className="mt-3 rounded-xl bg-red-100 px-4 py-3 text-xs font-medium text-red-700">
                            Esta sala puede tener como máximo {disponible}.
                            Corrige la cantidad antes de guardar.
                          </div>
                        )}

                        {disponible === 0 && Number(cantidad || 0) === 0 && (
                          <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                            No quedan personas disponibles de esta iglesia para
                            otra asignación.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          {/* INVENTARIO */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionTitle
              icon={<Package size={19} />}
              title="Inventario de la sala"
              subtitle="Modifica los elementos registrados"
            />

            <div className="mt-6 divide-y divide-slate-100">
              {tiposInventario.map((tipo) => {
                const cantidad = obtenerCantidadInventario(tipo.id);
                const observacion = obtenerObservacionInventario(tipo.id);

                return (
                  <div key={tipo.id} className="py-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-slate-800">
                        {tipo.nombre}
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={cantidad === 0}
                          onClick={() =>
                            cambiarCantidadInventario(tipo.id, cantidad - 1)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-30"
                        >
                          <Minus size={16} />
                        </button>

                        <input
                          type="number"
                          min="0"
                          value={cantidad}
                          onChange={(e) =>
                            cambiarCantidadInventario(tipo.id, e.target.value)
                          }
                          className="h-9 w-16 rounded-lg border border-slate-200 text-center text-sm font-semibold"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            cambiarCantidadInventario(tipo.id, cantidad + 1)
                          }
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
                          cambiarObservacionInventario(tipo.id, e.target.value)
                        }
                        placeholder="Observación..."
                        className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {inventario
              .filter((item) => item.nombre_personalizado)
              .map((item) => {
                const indice = inventario.indexOf(item);

                return (
                  <div
                    key={`${item.nombre_personalizado}-${indice}`}
                    className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">
                          {item.nombre_personalizado}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Elemento personalizado
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => eliminarElementoPersonalizado(indice)}
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
                              i === indice
                                ? {
                                    ...elemento,
                                    cantidad,
                                  }
                                : elemento,
                            ),
                          );
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                      />

                      <input
                        type="text"
                        value={item.observacion || ""}
                        onChange={(e) => {
                          const observacion = e.target.value;

                          setInventario((prev) =>
                            prev.map((elemento, i) =>
                              i === indice
                                ? {
                                    ...elemento,
                                    observacion,
                                  }
                                : elemento,
                            ),
                          );
                        }}
                        placeholder="Observación"
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                      />
                    </div>
                  </div>
                );
              })}

            {!mostrarAgregarElemento && (
              <button
                type="button"
                onClick={() => setMostrarAgregarElemento(true)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Plus size={17} />
                Agregar otro elemento
              </button>
            )}

            {mostrarAgregarElemento && (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Nuevo elemento</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Para objetos que no están en el listado
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMostrarAgregarElemento(false)}
                    className="text-slate-400"
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
                    placeholder="Ej: Ventilador"
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

                <input
                  name="observacion"
                  value={nuevoElemento.observacion}
                  onChange={handleNuevoElementoChange}
                  placeholder="Observación"
                  className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                />

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

          {/* RESPONSABLE */}

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
              />
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
              rows={4}
              className="mt-6 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Información adicional..."
            />
          </section>

          {/* BOTONES */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              to={`/salas/${id}`}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Link>

            <button
              type="button"
              onClick={guardarSala}
              disabled={guardando || erroresStock.length > 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={18} />
              {guardando
                ? "Guardando..."
                : erroresStock.length > 0
                  ? "Corrige las cantidades"
                  : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>

      {/* CÁMARA */}

      {camaraAbierta && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
          <div className="relative h-full w-full max-w-5xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-contain ${
                tipoCamara === "user" ? "-scale-x-100" : ""
              }`}
            />

            <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
              <button
                type="button"
                onClick={cerrarCamara}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X size={22} />
              </button>

              <div className="rounded-full bg-black/60 px-4 py-2 text-sm text-white">
                {tipoCamara === "environment"
                  ? "Cámara trasera"
                  : "Cámara frontal"}
              </div>

              <button
                type="button"
                onClick={cambiarCamara}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <RotateCcw size={21} />
              </button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 flex justify-center bg-gradient-to-t from-black/80 to-transparent p-10">
              <button
                type="button"
                onClick={tomarFoto}
                className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white shadow-2xl"
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

// =====================================================
// INPUT
// =====================================================

function Input({ label, ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-sm font-medium text-slate-700">
          {label}
        </span>
      )}

      <input
        {...props}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      />
    </label>
  );
}

// =====================================================
// SECTION
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
