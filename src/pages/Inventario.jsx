import { mostrarAviso, pedirConfirmacion } from "../services/avisos";
import { useEffect, useMemo, useState } from "react";

import {
  Search,
  Plus,
  Package,
  Pencil,
  Power,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  RefreshCw,
  X,
  Boxes,
  Download,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { exportarInventarioExcel } from "../utils/exportarExcel";

// =====================================================
// FUNCIONES DE CÁLCULO
// =====================================================

const obtenerAgregado = (item) => {
  const movimientos = item?.inventario_movimientos || [];

  return movimientos
    .filter((movimiento) => movimiento.tipo === "INGRESO")
    .reduce((total, movimiento) => total + Number(movimiento.cantidad || 0), 0);
};

const obtenerUtilizado = (item) => {
  const movimientos = item?.inventario_movimientos || [];

  return movimientos
    .filter((movimiento) => movimiento.tipo === "CONSUMO")
    .reduce((total, movimiento) => total + Number(movimiento.cantidad || 0), 0);
};

const obtenerDisponible = (item) => {
  const inicial = Number(item?.cantidad_inicial || 0);

  const agregado = obtenerAgregado(item);

  const utilizado = obtenerUtilizado(item);

  return inicial + agregado - utilizado;
};

const obtenerEstado = (item) => {
  return obtenerDisponible(item) > 0 ? "disponible" : "agotado";
};

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function Inventario() {
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);

  const [busqueda, setBusqueda] = useState("");

  const [filtro, setFiltro] = useState("disponibles");

  const [modal, setModal] = useState(null);

  const [itemSeleccionado, setItemSeleccionado] = useState(null);

  const [movimientos, setMovimientos] = useState([]);

  const [exportando, setExportando] = useState(false);

  // ===================================================
  // CARGAR INVENTARIO
  // ===================================================

  useEffect(() => {
    cargarInventario();
  }, []);

  const cargarInventario = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("inventario_items")
        .select(
          `
          id,
          nombre,
          cantidad_inicial,
          observaciones,
          activo,
          created_at,
          inventario_movimientos (
            id,
            tipo,
            cantidad,
            observacion,
            responsable,
            created_at
          )
        `,
        )
        .order("nombre", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      setItems(data || []);
    } catch (error) {
      console.error("Error cargando inventario:", error);

      mostrarAviso("No fue posible cargar el inventario.");
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // EXPORTAR EXCEL
  // ===================================================

  const manejarExportarExcel = async () => {
    try {
      setExportando(true);

      await exportarInventarioExcel(items || []);
    } catch (error) {
      console.error("Error exportando Excel:", error);

      mostrarAviso("No fue posible generar el Excel.");
    } finally {
      setExportando(false);
    }
  };

  // ===================================================
  // FILTRADO
  // ===================================================

  const itemsFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return items.filter((item) => {
      if (!item.activo) {
        return false;
      }

      const disponible = obtenerDisponible(item);

      if (filtro === "disponibles" && disponible <= 0) {
        return false;
      }

      if (filtro === "agotados" && disponible > 0) {
        return false;
      }

      if (!texto) {
        return true;
      }

      const contenido = [item.nombre, item.observaciones]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return contenido.includes(texto);
    });
  }, [items, busqueda, filtro]);

  // ===================================================
  // ESTADÍSTICAS
  // ===================================================

  const productosDisponibles = items.filter(
    (item) => item.activo && obtenerDisponible(item) > 0,
  ).length;

  const productosAgotados = items.filter(
    (item) => item.activo && obtenerDisponible(item) <= 0,
  ).length;

  const totalProductos = items.filter((item) => item.activo).length;

  const totalMovimientos = items.reduce(
    (total, item) => total + (item.inventario_movimientos || []).length,
    0,
  );

  // ===================================================
  // CAMBIAR ESTADO
  // ===================================================

  const cambiarEstado = async (item) => {
    const nuevoEstado = !item.activo;

    const confirmar = await pedirConfirmacion(
      nuevoEstado
        ? "¿Quieres volver a mostrar este producto?"
        : "¿Quieres ocultar este producto del inventario?",
    );

    if (!confirmar) {
      return;
    }

    try {
      const { error } = await supabase
        .from("inventario_items")
        .update({
          activo: nuevoEstado,
        })
        .eq("id", item.id);

      if (error) {
        throw error;
      }

      setItems((prev) =>
        prev.map((actual) =>
          actual.id === item.id
            ? {
                ...actual,
                activo: nuevoEstado,
              }
            : actual,
        ),
      );
    } catch (error) {
      console.error(error);

      mostrarAviso("No fue posible cambiar el estado.");
    }
  };

  // ===================================================
  // MODALES
  // ===================================================

  const abrirModal = (tipo, item = null) => {
    setItemSeleccionado(item);

    setModal(tipo);
  };

  const cerrarModal = () => {
    setModal(null);

    setItemSeleccionado(null);
  };

  // ===================================================
  // HISTORIAL
  // ===================================================

  const verMovimientos = async (item) => {
    try {
      setItemSeleccionado(item);

      const { data, error } = await supabase
        .from("inventario_movimientos")
        .select(
          `
          id,
          tipo,
          cantidad,
          observacion,
          responsable,
          created_at
        `,
        )
        .eq("inventario_item_id", item.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setMovimientos(data || []);

      setModal("movimientos");
    } catch (error) {
      console.error(error);

      mostrarAviso("No fue posible cargar el historial.");
    }
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
                IDDP LOS ANDES
              </p>

              <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                Inventario
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Insumos de la convención
              </p>
            </div>

            {/* BOTONES */}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={manejarExportarExcel}
                disabled={exportando}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={18} />

                {exportando ? "Generando..." : "Exportar Excel"}
              </button>

              <button
                type="button"
                onClick={() => abrirModal("nuevo")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Plus size={18} />
                Nuevo producto
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ================================================= */}
      {/* CONTENIDO */}
      {/* ================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:px-8">
        {/* ================================================= */}
        {/* ESTADÍSTICAS */}
        {/* ================================================= */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Productos"
            value={totalProductos}
            icon={<Package size={19} />}
          />

          <StatCard
            label="Disponibles"
            value={productosDisponibles}
            icon={<Boxes size={19} />}
          />

          <StatCard
            label="Agotados"
            value={productosAgotados}
            icon={<div className="h-2.5 w-2.5 rounded-full bg-red-500" />}
          />

          <StatCard
            label="Movimientos"
            value={totalMovimientos}
            icon={<History size={19} />}
          />
        </div>

        {/* ================================================= */}
        {/* BUSCADOR */}
        {/* ================================================= */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-slate-400 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-1 rounded-xl bg-slate-100 p-1">
                <FilterButton
                  activo={filtro === "disponibles"}
                  onClick={() => setFiltro("disponibles")}
                >
                  Productos disponibles
                </FilterButton>

                <FilterButton
                  activo={filtro === "agotados"}
                  onClick={() => setFiltro("agotados")}
                >
                  Agotados
                </FilterButton>
              </div>

              <button
                type="button"
                onClick={cargarInventario}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <RefreshCw size={17} />
              </button>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* LISTADO */}
        {/* ================================================= */}

        <div className="mt-5">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

              <p className="mt-4 text-sm text-slate-500">
                Cargando inventario...
              </p>
            </div>
          ) : itemsFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Package size={40} className="mx-auto text-slate-300" />

              <h2 className="mt-4 font-semibold text-slate-800">
                {filtro === "agotados"
                  ? "No hay productos agotados"
                  : "No hay productos disponibles"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {busqueda
                  ? "No encontramos productos con esa búsqueda."
                  : "Agrega un producto al inventario."}
              </p>

              {!busqueda && filtro === "disponibles" && (
                <button
                  type="button"
                  onClick={() => abrirModal("nuevo")}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                >
                  <Plus size={17} />
                  Agregar producto
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {itemsFiltrados.map((item) => {
                const inicial = Number(item.cantidad_inicial || 0);

                const agregado = obtenerAgregado(item);

                const utilizado = obtenerUtilizado(item);

                const disponible = obtenerDisponible(item);

                const estado = obtenerEstado(item);

                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md"
                  >
                    {/* CABECERA */}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <Package size={20} />
                        </div>

                        <h2 className="truncate text-lg font-bold text-slate-900">
                          {item.nombre}
                        </h2>
                      </div>

                      <StatusBadge estado={estado} />
                    </div>

                    {/* CANTIDADES */}

                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <CantidadBox titulo="Inicial" cantidad={inicial} />

                      <CantidadBox titulo="Agregado" cantidad={agregado} />

                      <CantidadBox titulo="Utilizado" cantidad={utilizado} />
                    </div>

                    {/* DISPONIBLE */}

                    <div
                      className={`mt-3 rounded-2xl p-5 ${
                        estado === "agotado" ? "bg-red-50" : "bg-emerald-50"
                      }`}
                    >
                      <p
                        className={`text-xs font-semibold uppercase tracking-wide ${
                          estado === "agotado"
                            ? "text-red-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {estado === "agotado"
                          ? "Producto agotado"
                          : "Producto disponible"}
                      </p>

                      <p
                        className={`mt-1 text-4xl font-bold ${
                          estado === "agotado"
                            ? "text-red-700"
                            : "text-emerald-700"
                        }`}
                      >
                        {disponible}
                      </p>
                    </div>

                    {/* ACCIONES */}

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => abrirModal("ingreso", item)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        <ArrowDownToLine size={16} />
                        Agregar
                      </button>

                      <button
                        type="button"
                        disabled={disponible <= 0}
                        onClick={() => abrirModal("consumo", item)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-3 py-3 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowUpFromLine size={16} />
                        Registrar uso
                      </button>
                    </div>

                    {/* ACCIONES SECUNDARIAS */}

                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => abrirModal("editar", item)}
                        className="flex flex-col items-center gap-1 rounded-xl py-2 text-slate-500 hover:bg-slate-50"
                      >
                        <Pencil size={16} />

                        <span className="text-[11px]">Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => verMovimientos(item)}
                        className="flex flex-col items-center gap-1 rounded-xl py-2 text-slate-500 hover:bg-slate-50"
                      >
                        <History size={16} />

                        <span className="text-[11px]">Historial</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => cambiarEstado(item)}
                        className="flex flex-col items-center gap-1 rounded-xl py-2 text-slate-500 hover:bg-slate-50"
                      >
                        <Power size={16} />

                        <span className="text-[11px]">Ocultar</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ================================================= */}
      {/* MODALES */}
      {/* ================================================= */}

      {modal === "nuevo" && (
        <Modal titulo="Nuevo producto" onClose={cerrarModal}>
          <FormularioProducto
            onClose={cerrarModal}
            onGuardado={cargarInventario}
          />
        </Modal>
      )}

      {modal === "editar" && (
        <Modal titulo="Editar producto" onClose={cerrarModal}>
          <FormularioProducto
            item={itemSeleccionado}
            onClose={cerrarModal}
            onGuardado={cargarInventario}
          />
        </Modal>
      )}

      {modal === "ingreso" && (
        <Modal titulo="Agregar cantidad" onClose={cerrarModal}>
          <FormularioMovimiento
            item={itemSeleccionado}
            tipo="INGRESO"
            onClose={cerrarModal}
            onGuardado={cargarInventario}
          />
        </Modal>
      )}

      {modal === "consumo" && (
        <Modal titulo="Registrar uso" onClose={cerrarModal}>
          <FormularioMovimiento
            item={itemSeleccionado}
            tipo="CONSUMO"
            onClose={cerrarModal}
            onGuardado={cargarInventario}
          />
        </Modal>
      )}

      {modal === "movimientos" && (
        <Modal
          titulo={`Historial - ${itemSeleccionado?.nombre || ""}`}
          onClose={cerrarModal}
        >
          <Historial movimientos={movimientos} />
        </Modal>
      )}
    </div>
  );
}

// =====================================================
// CANTIDAD BOX
// =====================================================

function CantidadBox({ titulo, cantidad }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {titulo}
      </p>

      <p className="mt-1 text-xl font-bold text-slate-800">{cantidad}</p>
    </div>
  );
}

// =====================================================
// FORMULARIO PRODUCTO
// =====================================================

function FormularioProducto({ item, onClose, onGuardado }) {
  const [formulario, setFormulario] = useState({
    nombre: item?.nombre || "",

    cantidad_inicial: item?.cantidad_inicial ?? 0,

    observaciones: item?.observaciones || "",
  });

  const [guardando, setGuardando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const guardar = async () => {
    if (!formulario.nombre.trim()) {
      mostrarAviso("Ingresa el nombre del producto.", "warning");

      return;
    }

    try {
      setGuardando(true);

      const datos = {
        nombre: formulario.nombre.trim(),

        cantidad_inicial: Number(formulario.cantidad_inicial) || 0,

        observaciones: formulario.observaciones.trim() || null,
      };

      let error;

      // EDITAR

      if (item) {
        ({ error } = await supabase
          .from("inventario_items")
          .update({
            nombre: datos.nombre,

            observaciones: datos.observaciones,
          })
          .eq("id", item.id));
      }

      // NUEVO
      else {
        ({ error } = await supabase.from("inventario_items").insert({
          nombre: datos.nombre,

          cantidad_inicial: datos.cantidad_inicial,

          observaciones: datos.observaciones,

          activo: true,
        }));
      }

      if (error) {
        throw error;
      }

      onClose();

      onGuardado();
    } catch (error) {
      console.error(error);

      mostrarAviso(error?.message || "No fue posible guardar el producto.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        label="Nombre del producto"
        name="nombre"
        value={formulario.nombre}
        onChange={handleChange}
        placeholder="Ej: Lechugas"
      />

      {!item ? (
        <Input
          label="Cantidad inicial"
          name="cantidad_inicial"
          type="number"
          min="0"
          step="0.01"
          value={formulario.cantidad_inicial}
          onChange={handleChange}
          placeholder="Ej: 200"
        />
      ) : (
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs text-slate-400">Cantidad inicial</p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formulario.cantidad_inicial}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            Para aumentar la cantidad utiliza "Agregar".
          </p>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Observaciones
        </label>

        <textarea
          name="observaciones"
          value={formulario.observaciones}
          onChange={handleChange}
          rows={3}
          placeholder="Información adicional..."
          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}

// =====================================================
// FORMULARIO MOVIMIENTO
// =====================================================

function FormularioMovimiento({ item, tipo, onClose, onGuardado }) {
  const [cantidad, setCantidad] = useState("");

  const [observacion, setObservacion] = useState("");

  const [responsable, setResponsable] = useState("");

  const [guardando, setGuardando] = useState(false);

  const obtenerDisponibleActual = async () => {
    const { data, error } = await supabase
      .from("inventario_movimientos")
      .select("tipo, cantidad")
      .eq("inventario_item_id", item.id);

    if (error) {
      throw error;
    }

    const ingresos = (data || [])
      .filter((mov) => mov.tipo === "INGRESO")
      .reduce((total, mov) => total + Number(mov.cantidad || 0), 0);

    const consumos = (data || [])
      .filter((mov) => mov.tipo === "CONSUMO")
      .reduce((total, mov) => total + Number(mov.cantidad || 0), 0);

    return Number(item.cantidad_inicial || 0) + ingresos - consumos;
  };

  const guardar = async () => {
    const cantidadNumero = Number(cantidad);

    if (!cantidadNumero || cantidadNumero <= 0) {
      mostrarAviso("Ingresa una cantidad válida.", "warning");

      return;
    }

    try {
      setGuardando(true);

      if (tipo === "CONSUMO") {
        const disponible = await obtenerDisponibleActual();

        if (cantidadNumero > disponible) {
          mostrarAviso(
            `No puedes utilizar ${cantidadNumero}. Solo quedan ${disponible}.`,
          );

          return;
        }
      }

      const { error } = await supabase.from("inventario_movimientos").insert({
        inventario_item_id: item.id,

        tipo,

        cantidad: cantidadNumero,

        observacion: observacion.trim() || null,

        responsable: responsable.trim() || null,
      });

      if (error) {
        throw error;
      }

      onClose();

      onGuardado();
    } catch (error) {
      console.error(error);

      mostrarAviso(error?.message || "No fue posible registrar el movimiento.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-xs text-slate-400">Producto</p>

        <p className="mt-1 text-lg font-bold text-slate-900">{item?.nombre}</p>

        <p className="mt-3 text-xs text-slate-400">Disponible actualmente</p>

        <p className="mt-1 text-3xl font-bold text-slate-900">
          {obtenerDisponible(item)}
        </p>
      </div>

      <Input
        label={tipo === "INGRESO" ? "Cantidad a agregar" : "Cantidad utilizada"}
        type="number"
        min="0"
        step="0.01"
        value={cantidad}
        onChange={(e) => setCantidad(e.target.value)}
        placeholder="Ej: 20"
      />

      <Input
        label="Responsable"
        value={responsable}
        onChange={(e) => setResponsable(e.target.value)}
        placeholder="Opcional"
      />

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Observación
        </label>

        <textarea
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          rows={3}
          placeholder={
            tipo === "INGRESO"
              ? "Ej: Llegaron 20 productos..."
              : "Ej: Utilizados para el almuerzo..."
          }
          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 ${
            tipo === "INGRESO"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-amber-600 hover:bg-amber-700"
          }`}
        >
          {guardando
            ? "Guardando..."
            : tipo === "INGRESO"
              ? "Agregar cantidad"
              : "Registrar uso"}
        </button>
      </div>
    </div>
  );
}

// =====================================================
// HISTORIAL
// =====================================================

function Historial({ movimientos }) {
  if (movimientos.length === 0) {
    return (
      <div className="py-10 text-center">
        <History size={38} className="mx-auto text-slate-300" />

        <p className="mt-3 font-medium text-slate-700">Sin movimientos</p>

        <p className="mt-1 text-sm text-slate-400">
          Todavía no se han registrado movimientos.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[60vh] space-y-3 overflow-y-auto">
      {movimientos.map((movimiento) => {
        const ingreso = movimiento.tipo === "INGRESO";

        return (
          <div
            key={movimiento.id}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    ingreso
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {ingreso ? "AGREGADO" : "UTILIZADO"}
                </span>

                <p className="mt-2 text-xs text-slate-400">
                  {new Date(movimiento.created_at).toLocaleString("es-CL")}
                </p>
              </div>

              <p
                className={`text-lg font-bold ${
                  ingreso ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {ingreso ? "+" : "-"}

                {movimiento.cantidad}
              </p>
            </div>

            {movimiento.observacion && (
              <div className="mt-3 rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Observación</p>

                <p className="mt-1 text-sm text-slate-700">
                  {movimiento.observacion}
                </p>
              </div>
            )}

            {movimiento.responsable && (
              <p className="mt-3 text-xs text-slate-400">
                Responsable:{" "}
                <span className="font-medium text-slate-600">
                  {movimiento.responsable}
                </span>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// =====================================================
// MODAL
// =====================================================

function Modal({ titulo, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 pb-8">
          {children}
        </div>
      </div>
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
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      />
    </label>
  );
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-400">{label}</p>

          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// FILTRO
// =====================================================

function FilterButton({ activo, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition ${
        activo ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
      }`}
    >
      {children}
    </button>
  );
}

// =====================================================
// ESTADO
// =====================================================

function StatusBadge({ estado }) {
  if (estado === "agotado") {
    return (
      <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700">
        Agotado
      </span>
    );
  }

  return (
    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
      Disponible
    </span>
  );
}
