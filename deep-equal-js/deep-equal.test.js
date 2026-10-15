const test = require("node:test");
const assert = require("node:assert/strict");

const {
  Comparator,
  DeepEqualEngine,
  deepEqual,
} = require("./deep-equal");

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
  const first = { name: "node" };
  first.self = first;
  const second = { name: "node" };
  second.self = second;

  assert.equal(deepEqual(first, second), true);
});

test("различает неравные циклические объекты", () => {
  const first = { value: 1 };
  first.self = first;
  const second = { value: 2 };
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
      new Map([
        ["a", 1],
        ["b", { ok: true }],
      ]),
      new Map([
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
    canHandle(value) {
      return value instanceof URL;
    }

    compare(a, b) {
      return b instanceof URL && a.href === b.href;
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
