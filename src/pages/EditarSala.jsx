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

import { Link, useNavigate, useParams } from "react-router-dom";

import { supabase } from "../lib/supabase";

export default function EditarSala() {
  const { id } = useParams();
  const navigate = useNavigate();

  const inputFotoRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [sala, setSala] = useState(null);

  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);

  const [iglesias, setIglesias] = useState([]);
  const [tiposInventario, setTiposInventario] = useState([]);

  const [iglesiasSeleccionadas, setIglesiasSeleccionadas] = useState([]);

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
  // CARGAR
  // =====================================================

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // -----------------------------------------------
      // SALA
      // -----------------------------------------------

      const { data: salaData, error: salaError } = await supabase
        .from("salas")
        .select("*")
        .eq("id", id)
        .single();

      if (salaError) {
        throw salaError;
      }

      if (!salaData) {
        throw new Error("La sala no existe.");
      }

      setSala(salaData);

      setFormulario({
        nombre: salaData.nombre || "",
        codigo: salaData.codigo || "",
        ubicacion: salaData.ubicacion || "",
        piso: salaData.piso || "",
        responsable: salaData.responsable || "",
        observaciones: salaData.observaciones || "",
      });

      if (salaData.foto_url) {
        setPreview(salaData.foto_url);
      }

      // -----------------------------------------------
      // IGLESIAS
      // -----------------------------------------------

      const { data: iglesiasData, error: iglesiasError } = await supabase
        .from("iglesias")
        .select("*")
        .eq("activo", true)
        .order("nombre");

      if (iglesiasError) {
        throw iglesiasError;
      }

      setIglesias(iglesiasData || []);

      // -----------------------------------------------
      // IGLESIAS DE LA SALA
      // -----------------------------------------------

      const { data: salaIglesias, error: salaIglesiasError } = await supabase
        .from("sala_iglesias")
        .select("id, iglesia_id, activo")
        .eq("sala_id", id);

      if (salaIglesiasError) {
        throw salaIglesiasError;
      }

      setIglesiasSeleccionadas(
        (salaIglesias || [])
          .filter((item) => item.activo !== false)
          .map((item) => item.iglesia_id),
      );

      // -----------------------------------------------
      // TIPOS INVENTARIO
      // -----------------------------------------------

      const { data: tiposData, error: tiposError } = await supabase
        .from("tipos_inventario")
        .select("*")
        .eq("activo", true)
        .order("nombre");

      if (tiposError) {
        throw tiposError;
      }

      setTiposInventario(tiposData || []);

      // -----------------------------------------------
      // INVENTARIO DE LA SALA
      // -----------------------------------------------

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

      if (inventarioError) {
        throw inventarioError;
      }

      setInventario(inventarioData || []);
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
  // FOTO
  // =====================================================

  const abrirCamara = () => {
    inputFotoRef.current?.click();
  };

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

    const nuevaPreview = URL.createObjectURL(archivo);

    setPreview(nuevaPreview);
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

  const obtenerItemInventario = (tipoId) => {
    return inventario.find((item) => item.tipo_inventario_id === tipoId);
  };

  const obtenerCantidad = (tipoId) => {
    const item = obtenerItemInventario(tipoId);

    return item?.cantidad || 0;
  };

  const obtenerObservacion = (tipoId) => {
    const item = obtenerItemInventario(tipoId);

    return item?.observacion || "";
  };

  // =====================================================
  // CAMBIAR CANTIDAD
  // =====================================================

  const cambiarCantidad = (tipoId, cambio) => {
    setInventario((prev) => {
      const existe = prev.find((item) => item.tipo_inventario_id === tipoId);

      // No existe todavía
      if (!existe) {
        if (cambio <= 0) {
          return prev;
        }

        return [
          ...prev,
          {
            id: null,
            sala_id: id,
            tipo_inventario_id: tipoId,
            nombre_personalizado: null,
            cantidad: cambio,
            observacion: "",
          },
        ];
      }

      const nuevaCantidad = Math.max(Number(existe.cantidad) + cambio, 0);

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

  // =====================================================
  // CAMBIAR CANTIDAD DIRECTA
  // =====================================================

  const cambiarCantidadDirecta = (tipoId, valor) => {
    const cantidad = Math.max(parseInt(valor || "0", 10), 0);

    setInventario((prev) => {
      const existe = prev.find((item) => item.tipo_inventario_id === tipoId);

      if (!existe) {
        return [
          ...prev,
          {
            id: null,
            sala_id: id,
            tipo_inventario_id: tipoId,
            nombre_personalizado: null,
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

  // =====================================================
  // OBSERVACIÓN INVENTARIO
  // =====================================================

  const cambiarObservacion = (tipoId, observacion) => {
    setInventario((prev) => {
      const existe = prev.find((item) => item.tipo_inventario_id === tipoId);

      if (!existe) {
        return [
          ...prev,
          {
            id: null,
            sala_id: id,
            tipo_inventario_id: tipoId,
            nombre_personalizado: null,
            cantidad: 0,
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
        id: null,
        sala_id: id,
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

  const eliminarElementoVisual = (index) => {
    setInventario((prev) => prev.filter((_, i) => i !== index));
  };

  // =====================================================
  // ACTUALIZAR INVENTARIO
  // =====================================================

  const guardarInventario = async () => {
    // -------------------------------------------------
    // IMPORTANTE:
    // NO HACEMOS DELETE.
    //
    // Los registros existentes que desaparecieron
    // del formulario pasan a cantidad 0.
    // -------------------------------------------------

    const inventarioOriginal = await obtenerInventarioOriginal();

    // IDs que siguen presentes
    const idsActuales = new Set(
      inventario.filter((item) => item.id).map((item) => item.id),
    );

    // -------------------------------------------------
    // 1. DESACTIVAR INVENTARIO QUITADO
    // -------------------------------------------------

    const registrosQuitados = inventarioOriginal.filter(
      (item) => !idsActuales.has(item.id),
    );

    for (const item of registrosQuitados) {
      const { error } = await supabase
        .from("sala_inventario")
        .update({
          cantidad: 0,
        })
        .eq("id", item.id);

      if (error) {
        throw error;
      }
    }

    // -------------------------------------------------
    // 2. ACTUALIZAR / INSERTAR
    // -------------------------------------------------

    for (const item of inventario) {
      const registro = {
        sala_id: id,
        tipo_inventario_id: item.tipo_inventario_id || null,
        nombre_personalizado: item.nombre_personalizado || null,
        cantidad: Math.max(Number(item.cantidad) || 0, 0),
        observacion: item.observacion || null,
      };

      // ---------------------------------------------
      // EXISTENTE
      // ---------------------------------------------

      if (item.id) {
        const { error } = await supabase
          .from("sala_inventario")
          .update(registro)
          .eq("id", item.id);

        if (error) {
          throw error;
        }

        continue;
      }

      // ---------------------------------------------
      // NUEVO
      // ---------------------------------------------

      const { error } = await supabase.from("sala_inventario").insert(registro);

      if (error) {
        throw error;
      }
    }
  };

  const obtenerInventarioOriginal = async () => {
    const { data, error } = await supabase
      .from("sala_inventario")
      .select(
        "id, cantidad, tipo_inventario_id, nombre_personalizado, observacion",
      )
      .eq("sala_id", id);

    if (error) {
      throw error;
    }

    return data || [];
  };

  // =====================================================
  // GUARDAR TODO
  // =====================================================

  const guardarCambios = async () => {
    try {
      setGuardando(true);

      // ---------------------------------------------
      // 1. SALA
      // ---------------------------------------------

      const { error: salaError } = await supabase
        .from("salas")
        .update({
          nombre: formulario.nombre.trim() || null,

          codigo: formulario.codigo.trim() || null,

          ubicacion: formulario.ubicacion.trim() || null,

          piso: formulario.piso.trim() || null,

          responsable: formulario.responsable.trim() || null,

          observaciones: formulario.observaciones.trim() || null,
        })
        .eq("id", id);

      if (salaError) {
        throw salaError;
      }

      // ---------------------------------------------
      // 2. FOTO
      // ---------------------------------------------

      if (foto) {
        const extension = foto.name.split(".").pop()?.toLowerCase() || "jpg";

        const ruta = `salas/${id}/sala-${Date.now()}.${extension}`;

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

        const { error: fotoError } = await supabase
          .from("salas")
          .update({
            foto_url: publicUrlData.publicUrl,
          })
          .eq("id", id);

        if (fotoError) {
          throw fotoError;
        }
      }

      // ---------------------------------------------
      // 3. IGLESIAS
      // ---------------------------------------------

      const { data: relacionesIglesias, error: relacionesError } =
        await supabase
          .from("sala_iglesias")
          .select("id, iglesia_id, activo")
          .eq("sala_id", id);

      if (relacionesError) {
        throw relacionesError;
      }

      // ---------------------------------------------
      // ACTUALIZAR RELACIONES EXISTENTES
      // ---------------------------------------------

      for (const relacion of relacionesIglesias || []) {
        const debeEstarActiva = iglesiasSeleccionadas.includes(
          relacion.iglesia_id,
        );

        const { error } = await supabase
          .from("sala_iglesias")
          .update({
            activo: debeEstarActiva,
          })
          .eq("id", relacion.id);

        if (error) {
          throw error;
        }
      }

      // ---------------------------------------------
      // INSERTAR IGLESIAS NUEVAS
      // ---------------------------------------------

      const idsExistentes = new Set(
        (relacionesIglesias || []).map((item) => item.iglesia_id),
      );

      const iglesiasNuevas = iglesiasSeleccionadas
        .filter((iglesiaId) => !idsExistentes.has(iglesiaId))
        .map((iglesiaId) => ({
          sala_id: id,
          iglesia_id: iglesiaId,
          activo: true,
        }));

      if (iglesiasNuevas.length > 0) {
        const { error } = await supabase
          .from("sala_iglesias")
          .insert(iglesiasNuevas);

        if (error) {
          throw error;
        }
      }

      // ---------------------------------------------
      // 4. INVENTARIO
      // ---------------------------------------------

      await guardarInventario();

      // ---------------------------------------------
      // 5. VOLVER AL DETALLE
      // ---------------------------------------------

      navigate(`/salas/${id}`);
    } catch (error) {
      console.error("Error actualizando sala:", error);

      alert(error?.message || "No fue posible guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />

          <p className="mt-4 text-sm text-slate-500">Cargando sala...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

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
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {sala?.codigo || "Sin código"}
            </p>

            <h1 className="text-2xl font-bold text-slate-900">Editar sala</h1>

            <p className="mt-1 text-sm text-slate-500">
              Modifica el catastro de la sala
            </p>
          </div>
        </div>

        <div className="space-y-6">
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
                label="Nombre"
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
          {/* FOTO */}
          {/* ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionTitle
              icon={<Camera size={19} />}
              title="Fotografía"
              subtitle="Puedes reemplazar la fotografía"
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
              {preview ? (
                <div className="relative overflow-hidden rounded-2xl border border-slate-200">
                  <img
                    src={preview}
                    alt={sala?.nombre || "Sala"}
                    className="max-h-[500px] w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={abrirCamara}
                    className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-lg"
                  >
                    <Camera size={17} />
                    Cambiar foto
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={abrirCamara}
                  className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-14 transition hover:bg-slate-100"
                >
                  <Camera size={30} className="text-slate-500" />

                  <p className="mt-3 font-semibold text-slate-800">
                    Tomar fotografía
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Abre la cámara para reemplazarla
                  </p>
                </button>
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
              subtitle="Puedes seleccionar más de una"
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
                              : "border-slate-300 bg-white"
                          }
                        `}
                    >
                      {seleccionada && "✓"}
                    </div>
                  </button>
                );
              })}

              {iglesias.length === 0 && (
                <EmptyText>No hay iglesias registradas.</EmptyText>
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
              subtitle="Actualiza las cantidades y observaciones"
            />

            <div className="mt-6 divide-y divide-slate-100">
              {tiposInventario.map((tipo) => {
                const cantidad = obtenerCantidad(tipo.id);

                const observacion = obtenerObservacion(tipo.id);

                return (
                  <div key={tipo.id} className="py-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-slate-800">
                        {tipo.nombre}
                      </p>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          disabled={cantidad <= 0}
                          onClick={() => cambiarCantidad(tipo.id, -1)}
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
                          className="h-9 w-16 rounded-lg border border-slate-200 text-center text-sm font-semibold outline-none focus:border-slate-400"
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

            {/* ============================================= */}
            {/* PERSONALIZADOS */}
            {/* ============================================= */}

            {inventario
              .map((item, index) => ({
                item,
                index,
              }))
              .filter(({ item }) => item.nombre_personalizado)
              .map(({ item, index }) => (
                <div
                  key={item.id || `nuevo-${index}`}
                  className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
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
                      onClick={() => eliminarElementoVisual(index)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-slate-600">
                        Cantidad
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={item.cantidad}
                        onChange={(e) => {
                          const cantidad = Math.max(
                            parseInt(e.target.value || "0", 10),
                            0,
                          );

                          setInventario((prev) =>
                            prev.map((elemento, i) =>
                              i === index
                                ? {
                                    ...elemento,
                                    cantidad,
                                  }
                                : elemento,
                            ),
                          );
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium text-slate-600">
                        Observación
                      </label>

                      <input
                        type="text"
                        value={item.observacion || ""}
                        onChange={(e) => {
                          setInventario((prev) =>
                            prev.map((elemento, i) =>
                              i === index
                                ? {
                                    ...elemento,
                                    observacion: e.target.value,
                                  }
                                : elemento,
                            ),
                          );
                        }}
                        placeholder="Observación"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>
                </div>
              ))}

            {/* ============================================= */}
            {/* AGREGAR PERSONALIZADO */}
            {/* ============================================= */}

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
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      Nuevo elemento
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Para objetos que no están en el catálogo
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
                    type="text"
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
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
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
              subtitle="Información adicional"
            />

            <textarea
              name="observaciones"
              value={formulario.observaciones}
              onChange={handleChange}
              rows={5}
              placeholder="Ej: La ventana del fondo no cierra correctamente..."
              className="mt-6 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />
          </section>

          {/* ================================================= */}
          {/* BOTONES */}
          {/* ================================================= */}

          <div className="flex flex-col-reverse gap-3 pb-8 sm:flex-row sm:justify-end">
            <Link
              to={`/salas/${id}`}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Link>

            <button
              type="button"
              onClick={guardarCambios}
              disabled={guardando}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={18} />

              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// COMPONENTE INPUT
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
// SECTION TITLE
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

// =========================================================
// EMPTY
// =========================================================

function EmptyText({ children }) {
  return (
    <div className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}
