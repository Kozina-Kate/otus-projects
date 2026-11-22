export interface DeepEqualOptions {
  ignoreArrayOrder?: boolean;
  caseSensitive?: boolean;
}

interface ResolvedDeepEqualOptions {
  ignoreArrayOrder: boolean;
  caseSensitive: boolean;
}

export interface ComparisonContext {
  readonly options: Readonly<ResolvedDeepEqualOptions>;
  compareNested(a: unknown, b: unknown): boolean;
}

export abstract class Comparator {
  abstract canHandle(value: unknown): boolean;

  abstract compare(
    a: unknown,
    b: unknown,
    context: ComparisonContext
  ): boolean;
}

export class PrimitiveComparator extends Comparator {
  canHandle(value: unknown): boolean {
    return value == null || typeof value !== "object";
  }

  compare(a: unknown, b: unknown, context: ComparisonContext): boolean {
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

export class DateComparator extends Comparator {
  canHandle(value: unknown): boolean {
    return value instanceof Date;
  }

  compare(a: unknown, b: unknown): boolean {
    return (
      a instanceof Date &&
      b instanceof Date &&
      Object.is(a.getTime(), b.getTime())
    );
  }
}

export class RegExpComparator extends Comparator {
  canHandle(value: unknown): boolean {
    return value instanceof RegExp;
  }

  compare(a: unknown, b: unknown): boolean {
    return (
      a instanceof RegExp &&
      b instanceof RegExp &&
      a.source === b.source &&
      a.flags === b.flags
    );
  }
}

export class MapComparator extends Comparator {
  canHandle(value: unknown): boolean {
    return value instanceof Map;
  }

  compare(a: unknown, b: unknown, context: ComparisonContext): boolean {
    if (!(a instanceof Map) || !(b instanceof Map) || a.size !== b.size) {
      return false;
    }

    for (const [key, value] of a) {
      if (!b.has(key) || !context.compareNested(value, b.get(key))) {
        return false;
      }
    }

    return true;
  }
}

export class ArrayComparator extends Comparator {
  canHandle(value: unknown): boolean {
    return Array.isArray(value);
  }

  compare(a: unknown, b: unknown, context: ComparisonContext): boolean {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }

    return a.every((item, index) =>
      context.compareNested(item, b[index])
    );
  }
}

export class UnorderedArrayComparator extends ArrayComparator {
  compare(a: unknown, b: unknown, context: ComparisonContext): boolean {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }

    const usedIndexes = new Set<number>();

    return a.every((item) => {
      const index = b.findIndex(
        (candidate, candidateIndex) =>
          !usedIndexes.has(candidateIndex) &&
          context.compareNested(item, candidate)
      );

      if (index === -1) return false;
      usedIndexes.add(index);
      return true;
    });
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export class ObjectComparator extends Comparator {
  canHandle(value: unknown): boolean {
    return isPlainObject(value);
  }

  compare(a: unknown, b: unknown, context: ComparisonContext): boolean {
    if (!isPlainObject(a) || !isPlainObject(b)) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every(
      (key) =>
        Object.hasOwn(b, key) && context.compareNested(a[key], b[key])
    );
  }
}

export class DeepEqualEngine implements ComparisonContext {
  readonly options: Readonly<ResolvedDeepEqualOptions>;
  private readonly comparators: Comparator[];
  private seen = new WeakMap<object, WeakSet<object>>();

  constructor(options: DeepEqualOptions = {}) {
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
  }

  deepEqual(a: unknown, b: unknown): boolean {
    this.seen = new WeakMap<object, WeakSet<object>>();
    return this.compare(a, b);
  }

  compareNested(a: unknown, b: unknown): boolean {
    return this.compare(a, b);
  }

  addComparator(comparator: Comparator): void {
    if (!(comparator instanceof Comparator)) {
      throw new TypeError("Компаратор должен наследовать Comparator");
    }

    this.comparators.unshift(comparator);
  }

  private findComparator(value: unknown): Comparator | undefined {
    return this.comparators.find((comparator) =>
      comparator.canHandle(value)
    );
  }

  private compare(a: unknown, b: unknown): boolean {
    const bothObjects = isObjectLike(a) && isObjectLike(b);

    if (bothObjects) {
      let paired = this.seen.get(a);
      if (paired?.has(b)) return true;

      if (!paired) {
        paired = new WeakSet<object>();
        this.seen.set(a, paired);
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
      if (bothObjects) this.seen.get(a)?.delete(b);
    }
  }
}

function isObjectLike(value: unknown): value is object {
  return value !== null && typeof value === "object";
}

function describe(value: unknown): string {
  if (value === null) return "null";

  if (typeof value === "object") {
    const constructor = (value as { constructor?: { name?: string } })
      .constructor;
    return constructor?.name ?? "object";
  }

  return typeof value;
}

export function deepEqual(
  a: unknown,
  b: unknown,
  options: DeepEqualOptions = {}
): boolean {
  return new DeepEqualEngine(options).deepEqual(a, b);
}
