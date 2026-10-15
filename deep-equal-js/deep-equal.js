// deepEqual: стратегия на класс, расширение без правки движка.
// Запуск тестов: node --test deep-equal-js/deep-equal.test.js

class Comparator {
  canHandle(_value) {
    throw new Error("canHandle() нужно переопределить");
  }

  compare(_a, _b, _context) {
    throw new Error("compare() нужно переопределить");
  }
}

class PrimitiveComparator extends Comparator {
  canHandle(value) {
    return value == null || typeof value !== "object";
  }

  compare(a, b, context) {
    if (
      context.options.caseSensitive === false &&
      typeof a === "string" &&
      typeof b === "string"
    ) {
      return a.toLocaleLowerCase() === b.toLocaleLowerCase();
    }
    return Object.is(a, b);
  }
}

class DateComparator extends Comparator {
  canHandle(value) {
    return value instanceof Date;
  }

  compare(a, b) {
    return b instanceof Date && Object.is(a.getTime(), b.getTime());
  }
}

class RegExpComparator extends Comparator {
  canHandle(value) {
    return value instanceof RegExp;
  }

  compare(a, b) {
    return b instanceof RegExp && a.source === b.source && a.flags === b.flags;
  }
}

class MapComparator extends Comparator {
  canHandle(value) {
    return value instanceof Map;
  }

  compare(a, b, context) {
    if (!(b instanceof Map) || a.size !== b.size) return false;
    for (const [key, value] of a) {
      if (!b.has(key)) return false;
      if (!context.compareNested(value, b.get(key))) return false;
    }
    return true;
  }
}

class ArrayComparator extends Comparator {
  canHandle(value) {
    return Array.isArray(value);
  }

  compare(a, b, context) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, index) => context.compareNested(item, b[index]));
  }
}

class UnorderedArrayComparator extends ArrayComparator {
  compare(a, b, context) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    const used = new Set();
    return a.every((item) => {
      const index = b.findIndex(
        (candidate, candidateIndex) =>
          !used.has(candidateIndex) && context.compareNested(item, candidate)
      );
      if (index === -1) return false;
      used.add(index);
      return true;
    });
  }
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

class ObjectComparator extends Comparator {
  canHandle(value) {
    return isPlainObject(value);
  }

  compare(a, b, context) {
    if (!isPlainObject(b)) return false;
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(
      (key) => Object.hasOwn(b, key) && context.compareNested(a[key], b[key])
    );
  }
}

class DeepEqualEngine {
  constructor(options = {}) {
    this.options = {
      ignoreArrayOrder: false,
      caseSensitive: true,
      ...options,
    };
    this.comparators = [
      new PrimitiveComparator(),
      new DateComparator(),
      new RegExpComparator(),
      new MapComparator(),
      this.options.ignoreArrayOrder
        ? new UnorderedArrayComparator()
        : new ArrayComparator(),
      new ObjectComparator(),
    ];
    this.#seen = new WeakMap();
  }

  #seen;

  deepEqual(a, b) {
    this.#seen = new WeakMap();
    return this.#compare(a, b);
  }

  compareNested(a, b) {
    return this.#compare(a, b);
  }

  findComparator(value) {
    return this.comparators.find((comparator) => comparator.canHandle(value));
  }

  addComparator(comparator) {
    if (!(comparator instanceof Comparator)) {
      throw new TypeError("Компаратор должен наследовать Comparator");
    }
    this.comparators.unshift(comparator);
  }

  #compare(a, b) {
    const bothObjects = isObjectLike(a) && isObjectLike(b);
    if (bothObjects) {
      let paired = this.#seen.get(a);
      if (paired?.has(b)) return true;
      if (!paired) {
        paired = new WeakSet();
        this.#seen.set(a, paired);
      }
      paired.add(b);
    }

    try {
      const comparator = this.findComparator(a);
      if (!comparator) {
        throw new Error(`Нет компаратора для ${describe(a)}`);
      }
      return comparator.compare(a, b, this);
    } finally {
      if (bothObjects) this.#seen.get(a)?.delete(b);
    }
  }
}

function isObjectLike(value) {
  return value !== null && typeof value === "object";
}

function describe(value) {
  if (value === null) return "null";
  return value.constructor?.name ?? typeof value;
}

function deepEqual(a, b, options = {}) {
  return new DeepEqualEngine(options).deepEqual(a, b);
}

module.exports = {
  Comparator,
  PrimitiveComparator,
  DateComparator,
  RegExpComparator,
  MapComparator,
  ArrayComparator,
  UnorderedArrayComparator,
  ObjectComparator,
  DeepEqualEngine,
  deepEqual,
};
