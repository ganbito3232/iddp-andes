import {
  School,
  Church,
  Armchair,
  Table2,
  Plus,
  ArrowRight,
  Package,
  Camera,
  Boxes,
  ClipboardList,
  Image as ImageIcon,
  AlertTriangle,
} from "lucide-react";

import { Link } from "react-router-dom";

import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";

export default function Dashboard() {
  // =====================================================
  // ESTADOS
  // =====================================================

  const [loading, setLoading] = useState(true);

  const [salas, setSalas] = useState([]);

  const [iglesias, setIglesias] = useState([]);

  const [inventario, setInventario] = useState([]);

  const [salaInventario, setSalaInventario] = useState([]);

  const [fotos, setFotos] = useState([]);

  // =====================================================
  // CARGAR DASHBOARD
  // =====================================================

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      setLoading(true);

      const [
        salasResult,
        iglesiasResult,
        inventarioResult,
        salaInventarioResult,
        fotosResult,
      ] = await Promise.all([
        // -------------------------------------------
        // SALAS
        // -------------------------------------------

        supabase
          .from("salas")
          .select(
            `
                id,
                nombre,
                codigo,
                ubicacion,
                activo,
                created_at
              `,
          )
          .order("created_at", {
            ascending: false,
          }),

        // -------------------------------------------
        // IGLESIAS
        // -------------------------------------------

        supabase.from("iglesias").select("id, nombre, ciudad, activo"),

        // -------------------------------------------
        // INVENTARIO GENERAL
        // -------------------------------------------

        supabase.from("inventario_items").select(`
    id,
    nombre,
    cantidad_inicial
  `),
        // -------------------------------------------
        // INVENTARIO DE SALAS
        // -------------------------------------------

        supabase.from("sala_inventario").select(`
                id,
                sala_id,
                cantidad,
                tipo_inventario_id,
                nombre_personalizado,
                tipos_inventario (
                  id,
                  nombre
                )
              `),

        // -------------------------------------------
        // FOTOS
        // -------------------------------------------

        supabase.from("sala_fotos").select("id, sala_id, foto_url"),
      ]);

      if (salasResult.error) {
        throw salasResult.error;
      }

      if (iglesiasResult.error) {
        throw iglesiasResult.error;
      }

      if (inventarioResult.error) {
        console.warn("Error inventario:", inventarioResult.error);
      }

      if (salaInventarioResult.error) {
        console.warn("Error inventario salas:", salaInventarioResult.error);
      }

      if (fotosResult.error) {
        console.warn("Error fotos:", fotosResult.error);
      }

      setSalas(salasResult.data || []);

      setIglesias(iglesiasResult.data || []);

      setInventario(inventarioResult.data || []);

      setSalaInventario(salaInventarioResult.data || []);

      setFotos(fotosResult.data || []);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CALCULOS
  // =====================================================

  const salasActivas = salas.filter((sala) => sala.activo !== false);

  const iglesiasActivas = iglesias.filter(
    (iglesia) => iglesia.activo !== false,
  );

  // =====================================================
  // INVENTARIO SALAS
  // =====================================================

  const obtenerNombreInventarioSala = (item) => {
    if (item.tipos_inventario?.nombre) {
      return item.tipos_inventario.nombre.trim();
    }

    if (item.nombre_personalizado) {
      return item.nombre_personalizado.trim();
    }

    return "Sin nombre";
  };

  const totalSillas = salaInventario
    .filter(
      (item) => obtenerNombreInventarioSala(item).toLowerCase() === "silla",
    )
    .reduce((total, item) => total + Number(item.cantidad || 0), 0);

  const totalMesas = salaInventario
    .filter(
      (item) => obtenerNombreInventarioSala(item).toLowerCase() === "mesa",
    )
    .reduce((total, item) => total + Number(item.cantidad || 0), 0);

  // =====================================================
  // TOTAL PRODUCTOS INVENTARIO
  // =====================================================

  const totalProductos = inventario.reduce(
    (total, item) =>
      total +
      Number(
        item.cantidad_disponible ??
          Number(item.cantidad_inicial || 0) - Number(item.cantidad_usada || 0),
      ),
    0,
  );

  // =====================================================
  // PRODUCTOS DISPONIBLES
  // =====================================================

  const productosDisponibles = inventario.filter(
    (item) => item.disponible !== false,
  ).length;

  // =====================================================
  // SALAS CON INVENTARIO
  // =====================================================

  const salasConInventario = new Set(
    salaInventario.map((item) => item.sala_id),
  );

  const salasSinInventario = salasActivas.filter(
    (sala) => !salasConInventario.has(sala.id),
  );

  // =====================================================
  // ESTADISTICAS
  // =====================================================

  const stats = [
    {
      title: "Salas registradas",

      value: salasActivas.length,

      icon: School,

      link: "/salas",
    },

    {
      title: "Iglesias",

      value: iglesiasActivas.length,

      icon: Church,

      link: "/iglesias",
    },

    {
      title: "Sillas",

      value: totalSillas,

      icon: Armchair,

      link: "/salas",
    },

    {
      title: "Mesas",

      value: totalMesas,

      icon: Table2,

      link: "/salas",
    },
  ];

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 w-64 rounded bg-slate-200" />

            <div className="mt-2 h-4 w-80 rounded bg-slate-200" />

            <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-36 rounded-2xl bg-slate-200" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Convención de Jóvenes
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              IDDP Los Andes
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Catastro y administración de salas
            </p>
          </div>

          <Link
            to="/salas/nueva"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus size={18} />
            Nueva sala
          </Link>
        </div>

        {/* ================================================= */}
        {/* ESTADISTICAS */}
        {/* ================================================= */}

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Link
                key={stat.title}
                to={stat.link}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <Icon size={20} className="text-slate-700" />
                  </div>

                  <ArrowRight
                    size={17}
                    className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-600"
                  />
                </div>

                <p className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </p>

                <p className="mt-1 text-sm text-slate-500">{stat.title}</p>
              </Link>
            );
          })}
        </div>

        {/* ================================================= */}
        {/* RESUMEN */}
        {/* ================================================= */}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* INVENTARIO */}

          <Link
            to="/inventario"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <Package size={19} className="text-slate-700" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Inventario
                </p>

                <p className="text-xs text-slate-500">Productos disponibles</p>
              </div>
            </div>

            <p className="mt-5 text-2xl font-bold text-slate-900">
              {productosDisponibles}
            </p>

            <p className="mt-1 text-xs text-slate-500">productos registrados</p>
          </Link>

          {/* CANTIDAD INVENTARIO */}

          <Link
            to="/inventario"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <Boxes size={19} className="text-slate-700" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Existencias
                </p>

                <p className="text-xs text-slate-500">Cantidad disponible</p>
              </div>
            </div>

            <p className="mt-5 text-2xl font-bold text-slate-900">
              {totalProductos}
            </p>

            <p className="mt-1 text-xs text-slate-500">unidades disponibles</p>
          </Link>

          {/* FOTOS */}

          <Link
            to="/salas"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <ImageIcon size={19} className="text-slate-700" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Fotografías
                </p>

                <p className="text-xs text-slate-500">Galería de salas</p>
              </div>
            </div>

            <p className="mt-5 text-2xl font-bold text-slate-900">
              {fotos.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              fotografías registradas
            </p>
          </Link>

          {/* SALAS SIN INVENTARIO */}

          <Link
            to="/salas"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <ClipboardList size={19} className="text-slate-700" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">Catastro</p>

                <p className="text-xs text-slate-500">Salas pendientes</p>
              </div>
            </div>

            <p className="mt-5 text-2xl font-bold text-slate-900">
              {salasSinInventario.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">salas sin inventario</p>
          </Link>
        </div>

        {/* ================================================= */}
        {/* CONTENIDO PRINCIPAL */}
        {/* ================================================= */}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* ================================================= */}
          {/* SALAS RECIENTES */}
          {/* ================================================= */}

          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Salas recientes
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Últimas salas registradas
                </p>
              </div>

              <Link
                to="/salas"
                className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Ver todas
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {salas.slice(0, 5).map((sala) => (
                <Link
                  key={sala.id}
                  to={`/salas/${sala.id}`}
                  className="flex items-center gap-4 p-5 transition hover:bg-slate-50"
                >
                  {/* ICONO */}

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <School size={20} className="text-slate-600" />
                  </div>

                  {/* INFORMACION */}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800">
                      {sala.nombre || "Sin nombre"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {sala.codigo || "Sin código"}

                      {sala.ubicacion ? ` · ${sala.ubicacion}` : ""}
                    </p>
                  </div>

                  {/* ESTADO */}

                  <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:inline-flex">
                    Disponible
                  </span>

                  <ArrowRight size={17} className="text-slate-300" />
                </Link>
              ))}

              {salas.length === 0 && (
                <div className="p-10 text-center">
                  <School size={32} className="mx-auto text-slate-300" />

                  <p className="mt-3 font-medium text-slate-700">
                    Aún no hay salas
                  </p>

                  <Link
                    to="/salas/nueva"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
                  >
                    <Plus size={17} />
                    Crear sala
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ================================================= */}
          {/* ESTADO DEL CATASTRO */}
          {/* ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-semibold text-slate-900">
                Estado del catastro
              </h2>

              <p className="mt-1 text-sm text-slate-500">Resumen general</p>
            </div>

            <div className="space-y-5 p-5">
              {/* SALAS */}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-slate-600">Salas</span>

                  <span className="text-sm font-semibold text-slate-900">
                    {salasActivas.length}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-800"
                    style={{
                      width:
                        salas.length > 0
                          ? `${Math.min(
                              100,
                              (salasActivas.length / salas.length) * 100,
                            )}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              {/* IGLESIAS */}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-slate-600">Iglesias</span>

                  <span className="text-sm font-semibold text-slate-900">
                    {iglesiasActivas.length}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-800"
                    style={{
                      width:
                        iglesias.length > 0
                          ? `${Math.min(
                              100,
                              (iglesiasActivas.length / iglesias.length) * 100,
                            )}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              {/* INVENTARIO */}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    Salas con inventario
                  </span>

                  <span className="text-sm font-semibold text-slate-900">
                    {salasActivas.length > 0
                      ? `${Math.round(
                          (salasConInventario.size / salasActivas.length) * 100,
                        )}%`
                      : "0%"}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-800"
                    style={{
                      width:
                        salasActivas.length > 0
                          ? `${Math.min(
                              100,
                              (salasConInventario.size / salasActivas.length) *
                                100,
                            )}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              {/* FOTOS */}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    Salas documentadas
                  </span>

                  <span className="text-sm font-semibold text-slate-900">
                    {salasActivas.length > 0
                      ? `${Math.round(
                          (new Set(fotos.map((foto) => foto.sala_id)).size /
                            salasActivas.length) *
                            100,
                        )}%`
                      : "0%"}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-800"
                    style={{
                      width:
                        salasActivas.length > 0
                          ? `${Math.min(
                              100,
                              (new Set(fotos.map((foto) => foto.sala_id)).size /
                                salasActivas.length) *
                                100,
                            )}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              {/* ALERTA */}

              {salasSinInventario.length > 0 && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <AlertTriangle
                      size={18}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />

                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        Catastro pendiente
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-700">
                        Hay {salasSinInventario.length}{" "}
                        {salasSinInventario.length === 1 ? "sala" : "salas"} sin
                        elementos de inventario registrados.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* ACCESOS RAPIDOS */}
        {/* ================================================= */}

        <div className="mt-6">
          <h2 className="mb-4 font-semibold text-slate-900">Accesos rápidos</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* SALAS */}

            <Link
              to="/salas"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <School size={21} className="text-slate-700" />

              <p className="mt-4 font-semibold text-slate-800">
                Administrar salas
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Revisar salas, inventario y galería.
              </p>

              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-slate-700">
                Ir a salas
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-1"
                />
              </div>
            </Link>

            {/* IGLESIAS */}

            <Link
              to="/iglesias"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <Church size={21} className="text-slate-700" />

              <p className="mt-4 font-semibold text-slate-800">Iglesias</p>

              <p className="mt-1 text-sm text-slate-500">
                Administrar iglesias alojadas.
              </p>

              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-slate-700">
                Ver iglesias
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-1"
                />
              </div>
            </Link>

            {/* INVENTARIO */}

            <Link
              to="/inventario"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <Package size={21} className="text-slate-700" />

              <p className="mt-4 font-semibold text-slate-800">
                Inventario general
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Controlar productos y existencias.
              </p>

              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-slate-700">
                Ver inventario
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-1"
                />
              </div>
            </Link>

            {/* NUEVA SALA */}

            <Link
              to="/salas/nueva"
              className="group rounded-2xl border border-dashed border-slate-300 bg-white p-5 transition hover:border-slate-400 hover:shadow-md"
            >
              <Plus size={21} className="text-slate-700" />

              <p className="mt-4 font-semibold text-slate-800">Nueva sala</p>

              <p className="mt-1 text-sm text-slate-500">
                Registrar una nueva sala.
              </p>

              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-slate-700">
                Crear sala
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-1"
                />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
