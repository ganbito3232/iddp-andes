import test from "node:test";
import assert from "node:assert/strict";
import { resumenAsignacion, resumenSala, validarAsignacion, salasParaGrupo, validarRetiro, ordenarSalasAsignadas } from "./asignacionesIglesia.js";

const iglesia = { id: "i", mujeres: 10, hombres: 8, activo: true };
const salas = [
  { id: "m1", tipo_sala: "MUJER", activo: true },
  { id: "m2", tipo_sala: "MUJER", activo: true },
  { id: "h", tipo_sala: "HOMBRE", activo: true },
  { id: "inactiva", tipo_sala: "MUJER", activo: false },
  { id: "sin-tipo", tipo_sala: null, activo: true },
];
const asignaciones = [
  { iglesia_id: "i", sala_id: "m1", cantidad: 3, activo: true },
  { iglesia_id: "i", sala_id: "m2", cantidad: 0, activo: true },
  { iglesia_id: "i", sala_id: "h", cantidad: 2, activo: true },
  { iglesia_id: "i", sala_id: "m2", cantidad: 5, activo: false },
  { iglesia_id: "otra", sala_id: "m1", cantidad: 20, activo: true },
];

test("muestra ocupación total y de la iglesia por separado, incluso en salas vacías", () => {
  assert.deepEqual(resumenSala(asignaciones, "m1", "i"), { total: 23, deEstaIglesia: 3 });
  assert.deepEqual(resumenSala(asignaciones, "m2", "i"), { total: 0, deEstaIglesia: 0 });
  assert.deepEqual(resumenSala(asignaciones, "sin-tipo", "i"), { total: 0, deEstaIglesia: 0 });
});

test("separa hombres y mujeres, excluye otras iglesias y relaciones inactivas", () => {
  assert.deepEqual(resumenAsignacion(iglesia, salas, asignaciones, "MUJER"), { stock: 10, asignados: 3, disponibles: 7 });
  assert.deepEqual(resumenAsignacion(iglesia, salas, asignaciones, "HOMBRE"), { stock: 8, asignados: 2, disponibles: 6 });
});
test("permite repartir los disponibles exactos y rechaza el exceso", () => {
  assert.doesNotThrow(() => validarAsignacion(iglesia, salas, asignaciones, "m2", "MUJER", 7));
  assert.throws(() => validarAsignacion(iglesia, salas, asignaciones, "m2", "MUJER", 8), /Solo quedan 7/);
});
test("impide ambos cruces de sexo, salas inactivas, e inexistentes", () => {
  for (const sala of ["h", "inactiva", "no-existe"]) {
    assert.throws(() => validarAsignacion(iglesia, salas, asignaciones, sala, "MUJER", 1), /No se pueden mezclar/);
  }
  assert.throws(() => validarAsignacion(iglesia, salas, asignaciones, "m1", "HOMBRE", 1), /No se pueden mezclar/);
});
test("rechaza cero, negativos, fracciones y valores inválidos", () => {
  for (const cantidad of [0, -1, 1.5, NaN, Infinity]) {
    assert.throws(() => validarAsignacion(iglesia, salas, asignaciones, "m1", "MUJER", cantidad), /entero mayor/);
  }
});
test("sin stock o con iglesia inactiva no permite agregar", () => {
  assert.throws(() => validarAsignacion({ ...iglesia, mujeres: 0 }, salas, asignaciones, "m1", "MUJER", 1), /Solo quedan 0/);
  assert.throws(() => validarAsignacion({ ...iglesia, activo: false }, salas, asignaciones, "m1", "MUJER", 1), /inactiva/);
});
test("al repartir en otra sala disminuye el stock disponible", () => {
  const actualizadas = [...asignaciones, { iglesia_id: "i", sala_id: "m2", cantidad: 4, activo: true }];
  assert.equal(resumenAsignacion(iglesia, salas, actualizadas, "MUJER").disponibles, 3);
  assert.throws(() => validarAsignacion(iglesia, salas, actualizadas, "m1", "MUJER", 4), /Solo quedan 3/);
});

test("una sala vacía sin tipo acepta hombres o mujeres en la primera asignación", () => {
  for (const tipo of ["HOMBRE", "MUJER"]) {
    assert.doesNotThrow(() => validarAsignacion(iglesia, salas, asignaciones, "sin-tipo", tipo, 1));
  }
});
test("una sala sin tipo con personas no se reclasifica automáticamente", () => {
  const ocupadas = [...asignaciones, { iglesia_id: "otra", sala_id: "sin-tipo", cantidad: 2, activo: true }];
  for (const tipo of ["HOMBRE", "MUJER"]) {
    assert.throws(() => validarAsignacion(iglesia, salas, ocupadas, "sin-tipo", tipo, 1), /No se pueden mezclar/);
  }
});
test("después de definirla para mujeres se bloquea agregar hombres", () => {
  const definidas = salas.map(sala => sala.id === "sin-tipo" ? {...sala, tipo_sala: "MUJER"} : sala);
  assert.throws(() => validarAsignacion(iglesia, definidas, asignaciones, "sin-tipo", "HOMBRE", 1), /No se pueden mezclar/);
  assert.doesNotThrow(() => validarAsignacion(iglesia, definidas, asignaciones, "sin-tipo", "MUJER", 1));
});

test("oculta el sexo contrario y conserva las salas sin tipo", () => {
  assert.deepEqual(salasParaGrupo(salas, "MUJER").map(s => s.id), ["m1", "m2", "inactiva", "sin-tipo"]);
  assert.deepEqual(salasParaGrupo(salas, "HOMBRE").map(s => s.id), ["h", "sin-tipo"]);
});
test("permite quitar parte o toda la cantidad de la iglesia y recupera disponibles", () => {
  for (const cantidad of [1, 3]) {
    const relacion = validarRetiro(asignaciones, "m1", "i", cantidad);
    const nuevas = asignaciones.map(item => item === relacion ? {...item, cantidad: item.cantidad - cantidad} : item);
    assert.equal(resumenAsignacion(iglesia, salas, nuevas, "MUJER").disponibles, 7 + cantidad);
    assert.equal(resumenSala(nuevas, "m1", "otra").deEstaIglesia, 20);
  }
});
test("no permite quitar personas ajenas, cantidades excesivas, inactivas o inválidas", () => {
  for (const cantidad of [0, -1, 1.5, NaN, 4]) assert.throws(() => validarRetiro(asignaciones, "m1", "i", cantidad));
  assert.throws(() => validarRetiro(asignaciones, "m1", "sin-asignacion", 1));
  assert.throws(() => validarRetiro(asignaciones, "m2", "i", 1));
});

test("la sala 7 asignada a esta iglesia va primero; luego orden numérico", () => {
  const lista = [{id:"14",nombre:"Sala 14"},{id:"2",nombre:"Sala 2"},{id:"7",nombre:"Sala 7"}];
  const registros = [{sala_id:"7",iglesia_id:"i",cantidad:2},{sala_id:"14",iglesia_id:"otra",cantidad:10}];
  assert.deepEqual(ordenarSalasAsignadas(lista,registros,"i").map(s=>s.id),["7","2","14"]);
  assert.equal(lista[0].id,"14");
  registros[0].cantidad=0;
  assert.deepEqual(ordenarSalasAsignadas(lista,registros,"i").map(s=>s.id),["2","7","14"]);
  registros[0].cantidad=2;
  registros[0].activo=false;
  assert.deepEqual(ordenarSalasAsignadas(lista,registros,"i").map(s=>s.id),["2","7","14"]);
});
