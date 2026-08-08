import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import { supabase } from "../lib/supabase";

// =====================================================
// EXPORTAR INVENTARIO GENERAL
// =====================================================

export async function exportarInventarioExcel(inventario = []) {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "IDDP Los Andes";

  const hoja = workbook.addWorksheet("Inventario");

  // ===================================================
  // TITULO
  // ===================================================

  hoja.mergeCells("A1:F1");

  hoja.getCell("A1").value = "IDDP LOS ANDES - INVENTARIO";

  hoja.getCell("A1").font = {
    bold: true,
    size: 16,
  };

  hoja.getCell("A1").alignment = {
    horizontal: "center",
  };

  hoja.getRow(1).height = 30;

  // ===================================================
  // FECHA
  // ===================================================

  hoja.mergeCells("A2:F2");

  hoja.getCell("A2").value = `Generado: ${new Date().toLocaleString("es-CL")}`;

  hoja.getCell("A2").alignment = {
    horizontal: "center",
  };

  hoja.getCell("A2").font = {
    italic: true,
    color: {
      argb: "FF64748B",
    },
  };

  hoja.addRow([]);

  // ===================================================
  // ENCABEZADOS
  // ===================================================

  const encabezado = hoja.addRow([
    "Producto",
    "Cantidad inicial",
    "Agregado",
    "Utilizado",
    "Disponible",
    "Estado",
  ]);

  formatearEncabezado(encabezado);

  // ===================================================
  // DATOS
  // ===================================================

  inventario
    .filter((item) => item.activo !== false)
    .forEach((item) => {
      const inicial = Number(item.cantidad_inicial || 0);

      const movimientos = item.inventario_movimientos || [];

      const agregado = movimientos
        .filter((m) => m.tipo === "INGRESO")
        .reduce(
          (total, movimiento) => total + Number(movimiento.cantidad || 0),
          0,
        );

      const utilizado = movimientos
        .filter((m) => m.tipo === "CONSUMO")
        .reduce(
          (total, movimiento) => total + Number(movimiento.cantidad || 0),
          0,
        );

      const disponible = inicial + agregado - utilizado;

      const estado = disponible > 0 ? "Disponible" : "Agotado";

      const fila = hoja.addRow([
        item.nombre || "",
        inicial,
        agregado,
        utilizado,
        disponible,
        estado,
      ]);

      fila.getCell(6).font = {
        bold: true,
        color: {
          argb: disponible > 0 ? "FF059669" : "FFDC2626",
        },
      };
    });

  configurarHoja(hoja, [30, 20, 16, 16, 16, 18]);

  // ===================================================
  // HOJA MOVIMIENTOS
  // ===================================================

  const hojaMovimientos = workbook.addWorksheet("Movimientos");

  hojaMovimientos.mergeCells("A1:F1");

  hojaMovimientos.getCell("A1").value = "IDDP LOS ANDES - MOVIMIENTOS";

  hojaMovimientos.getCell("A1").font = {
    bold: true,
    size: 16,
  };

  hojaMovimientos.getCell("A1").alignment = {
    horizontal: "center",
  };

  hojaMovimientos.addRow([]);

  const encabezadoMov = hojaMovimientos.addRow([
    "Producto",
    "Tipo",
    "Cantidad",
    "Responsable",
    "Observación",
    "Fecha",
  ]);

  formatearEncabezado(encabezadoMov);

  inventario.forEach((item) => {
    const movimientos = item.inventario_movimientos || [];

    movimientos.forEach((movimiento) => {
      hojaMovimientos.addRow([
        item.nombre || "",

        movimiento.tipo === "INGRESO" ? "Agregado" : "Utilizado",

        Number(movimiento.cantidad || 0),

        movimiento.responsable || "",

        movimiento.observacion || "",

        movimiento.created_at
          ? new Date(movimiento.created_at).toLocaleString("es-CL")
          : "",
      ]);
    });
  });

  configurarHoja(hojaMovimientos, [30, 18, 16, 25, 45, 25]);

  await descargarExcel(workbook, "IDDP_Inventario");
}

// =====================================================
// EXPORTAR SALAS + TODO EL INVENTARIO ENCONTRADO
// =====================================================

export async function exportarSalasExcel(salas = []) {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "IDDP Los Andes";

  // =====================================================
  // 1. INVENTARIO DE TODAS LAS SALAS
  // =====================================================

  const { data: inventarioSalas, error: errorInventario } = await supabase.from(
    "sala_inventario",
  ).select(`
      sala_id,
      tipo_inventario_id,
      nombre_personalizado,
      cantidad,
      observacion,
      tipos_inventario (
        id,
        nombre
      )
    `);

  if (errorInventario) {
    throw errorInventario;
  }

  // =====================================================
  // 2. IGLESIAS
  // =====================================================

  const { data: salasIglesias, error: errorIglesias } = await supabase.from(
    "sala_iglesias",
  ).select(`
      sala_id,
      iglesia_id,
      iglesias (
        id,
        nombre
      )
    `);

  if (errorIglesias) {
    console.warn("No fue posible cargar las iglesias:", errorIglesias);
  }

  // =====================================================
  // 3. INVENTARIO AGRUPADO POR SALA + NOMBRE
  // =====================================================

  const inventarioPorSala = {};

  /*
   * Ejemplo:
   *
   * Sala 1:
   *
   * Tele 1
   * Tele 1
   * Silla 5
   * Mesa 3
   *
   * Se transforma en:
   *
   * Sala 1:
   * Tele 2
   * Silla 5
   * Mesa 3
   */

  (inventarioSalas || []).forEach((item) => {
    const salaId = item.sala_id;

    if (!salaId) {
      return;
    }

    // ---------------------------------------------------
    // OBTENER NOMBRE
    // ---------------------------------------------------

    let nombre = "";

    // Elemento normal
    if (item.tipos_inventario?.nombre) {
      nombre = item.tipos_inventario.nombre.trim();
    }

    // Elemento personalizado
    if (!nombre && item.nombre_personalizado) {
      nombre = item.nombre_personalizado.trim();
    }

    if (!nombre) {
      return;
    }

    // ---------------------------------------------------
    // NOMBRE NORMALIZADO
    // ---------------------------------------------------

    const nombreClave = nombre.toLowerCase();

    if (!inventarioPorSala[salaId]) {
      inventarioPorSala[salaId] = {};
    }

    // ---------------------------------------------------
    // CREAR ELEMENTO
    // ---------------------------------------------------

    if (!inventarioPorSala[salaId][nombreClave]) {
      inventarioPorSala[salaId][nombreClave] = {
        nombre,
        cantidad: 0,
        observaciones: [],
      };
    }

    // ---------------------------------------------------
    // SUMAR CANTIDAD
    // ---------------------------------------------------

    inventarioPorSala[salaId][nombreClave].cantidad += Number(
      item.cantidad || 0,
    );

    // ---------------------------------------------------
    // OBSERVACIÓN
    // ---------------------------------------------------

    if (item.observacion) {
      inventarioPorSala[salaId][nombreClave].observaciones.push(
        item.observacion,
      );
    }
  });

  // =====================================================
  // 4. OBTENER TODOS LOS ELEMENTOS EXISTENTES
  // =====================================================

  const elementosEncontrados = {};

  Object.values(inventarioPorSala).forEach((inventarioSala) => {
    Object.values(inventarioSala).forEach((elemento) => {
      const clave = elemento.nombre.toLowerCase();

      if (!elementosEncontrados[clave]) {
        elementosEncontrados[clave] = elemento.nombre;
      }
    });
  });

  // =====================================================
  // 5. LISTA FINAL DE ELEMENTOS
  // =====================================================

  const elementosFinales = Object.values(elementosEncontrados).sort((a, b) =>
    a.localeCompare(b, "es"),
  );

  // =====================================================
  // 6. IGLESIAS POR SALA
  // =====================================================

  const iglesiasPorSala = {};

  (salasIglesias || []).forEach((relacion) => {
    if (!iglesiasPorSala[relacion.sala_id]) {
      iglesiasPorSala[relacion.sala_id] = [];
    }

    const nombre = relacion.iglesias?.nombre;

    if (nombre && !iglesiasPorSala[relacion.sala_id].includes(nombre)) {
      iglesiasPorSala[relacion.sala_id].push(nombre);
    }
  });

  // =====================================================
  // 7. CREAR HOJA PRINCIPAL
  // =====================================================

  const hoja = workbook.addWorksheet("Salas");

  // =====================================================
  // 8. COLUMNAS
  // =====================================================

  const columnas = [
    "Código",
    "Sala",
    "Iglesias",
    "Responsable",
    ...elementosFinales,
    "Estado",
    "Observaciones",
  ];

  // =====================================================
  // 9. TITULO
  // =====================================================

  hoja.mergeCells(1, 1, 1, columnas.length);

  hoja.getCell(1, 1).value = "IDDP LOS ANDES - INVENTARIO DE SALAS";

  hoja.getCell(1, 1).font = {
    bold: true,
    size: 16,
  };

  hoja.getCell(1, 1).alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  hoja.getRow(1).height = 30;

  // =====================================================
  // 10. FECHA
  // =====================================================

  hoja.mergeCells(2, 1, 2, columnas.length);

  hoja.getCell(2, 1).value = `Generado: ${new Date().toLocaleString("es-CL")}`;

  hoja.getCell(2, 1).alignment = {
    horizontal: "center",
  };

  hoja.getCell(2, 1).font = {
    italic: true,
    color: {
      argb: "FF64748B",
    },
  };

  // =====================================================
  // 11. ENCABEZADOS
  // =====================================================

  hoja.addRow([]);

  const encabezado = hoja.addRow(columnas);

  formatearEncabezado(encabezado);

  // =====================================================
  // 12. SALAS
  // =====================================================

  salas.forEach((sala) => {
    const fila = [];

    // -------------------------------------------------
    // CODIGO
    // -------------------------------------------------

    fila.push(sala.codigo || "");

    // -------------------------------------------------
    // NOMBRE
    // -------------------------------------------------

    fila.push(sala.nombre || "");

    // -------------------------------------------------
    // IGLESIAS
    // -------------------------------------------------

    fila.push((iglesiasPorSala[sala.id] || []).join(", "));

    // -------------------------------------------------
    // RESPONSABLE
    // -------------------------------------------------

    fila.push(sala.responsable || "");

    // -------------------------------------------------
    // INVENTARIO
    // -------------------------------------------------

    const inventarioSala = inventarioPorSala[sala.id] || {};

    elementosFinales.forEach((nombreElemento) => {
      const clave = nombreElemento.toLowerCase();

      const elemento = inventarioSala[clave];

      fila.push(elemento ? elemento.cantidad : 0);
    });

    // -------------------------------------------------
    // ESTADO
    // -------------------------------------------------

    fila.push(sala.activo !== false ? "Disponible" : "Desactivada");

    // -------------------------------------------------
    // OBSERVACIONES
    // -------------------------------------------------

    fila.push(sala.observaciones || "");

    hoja.addRow(fila);
  });

  // =====================================================
  // 13. ANCHOS
  // =====================================================

  const anchos = [16, 28, 40, 25];

  elementosFinales.forEach(() => {
    anchos.push(14);
  });

  anchos.push(18);
  anchos.push(40);

  hoja.columns.forEach((columna, index) => {
    columna.width = anchos[index] || 15;
  });

  // =====================================================
  // 14. FILTRO
  // =====================================================

  hoja.autoFilter = {
    from: "A4",
    to: `${obtenerLetraColumna(columnas.length)}${hoja.rowCount}`,
  };

  // =====================================================
  // 15. CONGELAR ENCABEZADO
  // =====================================================

  hoja.views = [
    {
      state: "frozen",
      ySplit: 4,
    },
  ];

  // =====================================================
  // 16. FORMATO
  // =====================================================

  hoja.eachRow((fila, numero) => {
    if (numero <= 4) {
      return;
    }

    fila.eachCell((celda) => {
      celda.alignment = {
        vertical: "middle",
        wrapText: true,
      };
    });
  });

  // =====================================================
  // 17. SEGUNDA HOJA
  // =====================================================

  const hojaDetalle = workbook.addWorksheet("Detalle inventario");

  const columnasDetalle = [
    "Código",
    "Sala",
    "Elemento",
    "Cantidad",
    "Responsable",
    "Observación",
  ];

  hojaDetalle.mergeCells("A1:F1");

  hojaDetalle.getCell("A1").value = "IDDP LOS ANDES - DETALLE INVENTARIO";

  hojaDetalle.getCell("A1").font = {
    bold: true,
    size: 16,
  };

  hojaDetalle.getCell("A1").alignment = {
    horizontal: "center",
  };

  hojaDetalle.addRow([]);

  const encabezadoDetalle = hojaDetalle.addRow(columnasDetalle);

  formatearEncabezado(encabezadoDetalle);

  // =====================================================
  // 18. DETALLE
  // =====================================================

  salas.forEach((sala) => {
    const inventarioSala = inventarioPorSala[sala.id] || {};

    Object.values(inventarioSala).forEach((elemento) => {
      hojaDetalle.addRow([
        sala.codigo || "",
        sala.nombre || "",
        elemento.nombre || "",
        elemento.cantidad || 0,
        sala.responsable || "",
        elemento.observaciones.join(" | "),
      ]);
    });
  });

  configurarHoja(hojaDetalle, [16, 28, 30, 15, 25, 45]);

  // =====================================================
  // 19. DESCARGAR
  // =====================================================

  await descargarExcel(workbook, "IDDP_Salas");
}

// =====================================================
// FORMATO ENCABEZADO
// =====================================================

function formatearEncabezado(fila) {
  fila.eachCell((celda) => {
    celda.font = {
      bold: true,
      color: {
        argb: "FFFFFFFF",
      },
    };

    celda.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF0F172A",
      },
    };

    celda.alignment = {
      horizontal: "center",
      vertical: "middle",
    };
  });

  fila.height = 25;
}

// =====================================================
// CONFIGURAR HOJA
// =====================================================

function configurarHoja(hoja, anchos) {
  hoja.columns.forEach((columna, index) => {
    columna.width = anchos[index] || 20;
  });

  hoja.views = [
    {
      state: "frozen",
      ySplit: 3,
    },
  ];

  hoja.eachRow((fila, numero) => {
    if (numero > 3) {
      fila.eachCell((celda) => {
        celda.alignment = {
          vertical: "middle",
          wrapText: true,
        };
      });
    }
  });

  if (hoja.rowCount >= 4) {
    const ultimaColumna = obtenerLetraColumna(hoja.columnCount);

    hoja.autoFilter = {
      from: "A3",
      to: `${ultimaColumna}${hoja.rowCount}`,
    };
  }
}

// =====================================================
// DESCARGAR
// =====================================================

async function descargarExcel(workbook, nombre) {
  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fecha = new Date().toISOString().slice(0, 10);

  saveAs(blob, `${nombre}_${fecha}.xlsx`);
}

// =====================================================
// LETRA COLUMNA EXCEL
// =====================================================

function obtenerLetraColumna(numero) {
  let resultado = "";

  while (numero > 0) {
    const residuo = (numero - 1) % 26;

    resultado = String.fromCharCode(65 + residuo) + resultado;

    numero = Math.floor((numero - 1) / 26);
  }

  return resultado;
}
