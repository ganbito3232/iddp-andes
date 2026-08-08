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
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

export default function NuevaSala() {
  const navigate = useNavigate();
  const inputFotoRef = useRef(null);

  const [guardando, setGuardando] = useState(false);

  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);

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

  useEffect(() => {
    cargarCatalogos();

    return () => {
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
  // FOTO
  // =====================================================

  const handleFoto = (e) => {
    const archivo = e.target.files?.[0];

    if (!archivo) {
      return;
    }

    if (!archivo.type.startsWith("image/")) {
      alert("Selecciona una imagen válida.");
      return;
    }

    setFoto(archivo);

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(URL.createObjectURL(archivo));
  };

  const abrirCamara = () => {
    inputFotoRef.current?.click();
  };

  const eliminarFoto = () => {
    setFoto(null);

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(null);

    if (inputFotoRef.current) {
      inputFotoRef.current.value = "";
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

      const nuevaCantidad = Math.max(existe.cantidad + cambio, 0);

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
  // GUARDAR
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
      // 2. SUBIR FOTO
      // -----------------------------------------------

      if (foto) {
        const extension = foto.name.split(".").pop()?.toLowerCase() || "jpg";

        const ruta = `salas/${sala.id}/sala.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("salas")
          .upload(ruta, foto, {
            upsert: true,
            contentType: foto.type,
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
        .filter((item) => item.cantidad > 0)
        .map((item) => ({
          sala_id: sala.id,
          tipo_inventario_id: item.tipo_inventario_id || null,
          nombre_personalizado: item.nombre_personalizado || null,
          cantidad: item.cantidad,
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
      {/* HEADER */}

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
            subtitle="Una fotografía ayuda a identificar cómo quedó la sala"
          />

          <input
            ref={inputFotoRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFoto}
          />

          <div className="mt-6">
            {!preview ? (
              <button
                type="button"
                onClick={abrirCamara}
                className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center transition hover:border-slate-400 hover:bg-slate-100"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <Camera size={28} className="text-slate-500" />
                </div>

                <p className="mt-4 font-semibold text-slate-800">
                  Tomar fotografía
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Toca aquí para abrir la cámara
                </p>
              </button>
            ) : (
              <div className="relative overflow-hidden rounded-2xl border border-slate-200">
                <img
                  src={preview}
                  alt="Vista previa de la sala"
                  className="max-h-[500px] w-full object-cover"
                />

                <button
                  type="button"
                  onClick={eliminarFoto}
                  className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg"
                >
                  <X size={19} />
                </button>

                <button
                  type="button"
                  onClick={abrirCamara}
                  className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2.5 text-sm font-medium text-slate-800 shadow-lg"
                >
                  <Camera size={17} />
                  Cambiar foto
                </button>
              </div>
            )}
          </div>
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

          {/* ELEMENTOS PERSONALIZADOS */}

          {inventario
            .filter((item) => item.nombre_personalizado)
            .map((item, index) => {
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

          {/* BOTÓN AGREGAR */}

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

          {/* FORMULARIO OTRO */}

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
    </div>
  );
}

// =========================================================
// COMPONENTES
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
