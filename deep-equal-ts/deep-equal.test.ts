import assert from "node:assert/strict";
import { test } from "node:test";

import { Comparator, DeepEqualEngine, deepEqual } from "./deep-equal";

test("сравнивает примитивы", () => {
  assert.equal(deepEqual(NaN, NaN), true);
  assert.equal(deepEqual(1, 1), true);
  assert.equal(deepEqual(1, 2), false);
});

test("сравнивает массивы", () => {
  assert.equal(deepEqual([1, 2, 3], [1, 2, 3]), true);
  assert.equal(deepEqual([1, 2, 3], [3, 2, 1]), false);
});

test("сравнивает вложенные объекты", () => {
  assert.equal(
    deepEqual(
      { a: 1, b: [2, 3], c: { d: 4 } },
      { c: { d: 4 }, b: [2, 3], a: 1 }
    ),
    true
  );
  assert.equal(deepEqual({ a: 1 }, { a: 1, b: undefined }), false);
});

test("сравнивает равные циклические объекты", () => {
  type CyclicNode = { name: string; self?: CyclicNode };

  const first: CyclicNode = { name: "node" };
  first.self = first;
  const second: CyclicNode = { name: "node" };
  second.self = second;

  assert.equal(deepEqual(first, second), true);
});

test("различает неравные циклические объекты", () => {
  type CyclicValue = { value: number; self?: CyclicValue };

  const first: CyclicValue = { value: 1 };
  first.self = first;
  const second: CyclicValue = { value: 2 };
  second.self = second;

  assert.equal(deepEqual(first, second), false);
});

test("различает значения разных типов", () => {
  assert.equal(deepEqual(null, {}), false);
  assert.equal(deepEqual([], {}), false);
  assert.equal(deepEqual(new Date("2024-01-02"), { getTime() {} }), false);
});

test("сравнивает поддерживаемые встроенные объекты", () => {
  assert.equal(
    deepEqual(new Date("2024-01-02"), new Date("2024-01-02")),
    true
  );
  assert.equal(deepEqual(/test/gi, /test/gi), true);
  assert.equal(deepEqual(/test/gi, /test/g), false);
  assert.equal(
    deepEqual(
      new Map<string, unknown>([
        ["a", 1],
        ["b", { ok: true }],
      ]),
      new Map<string, unknown>([
        ["b", { ok: true }],
        ["a", 1],
      ])
    ),
    true
  );
});

test("поддерживает опции сравнения", () => {
  assert.equal(
    deepEqual(
      [{ sku: "A", title: "Лампа" }, { sku: "B" }],
      [{ sku: "B" }, { sku: "A", title: "лампа" }],
      { ignoreArrayOrder: true, caseSensitive: false }
    ),
    true
  );
});

test("позволяет добавить пользовательский компаратор", () => {
  class UrlComparator extends Comparator {
    canHandle(value: unknown): boolean {
      return value instanceof URL;
    }

    compare(a: unknown, b: unknown): boolean {
      return a instanceof URL && b instanceof URL && a.href === b.href;
    }
  }

  const engine = new DeepEqualEngine();
  engine.addComparator(new UrlComparator());

  assert.equal(
    engine.deepEqual(
      new URL("https://otus.ru/lessons"),
      new URL("https://otus.ru/lessons")
    ),
    true
  );
});

test("сообщает об отсутствии компаратора", () => {
  assert.throws(() => deepEqual(new Set([1]), new Set([1])), /Set/);
});
