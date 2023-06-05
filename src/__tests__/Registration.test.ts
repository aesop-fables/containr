import 'reflect-metadata';
import { Scopes, inject } from '..';
import { buildContainer } from './utils';

const key = '@aesop-fables/containr/test';

describe('Registration', () => {
  // We're getting services a couple of times (here and there) because there were issues early on in dependency resolution
  describe('factory', () => {
    test('singleton', () => {
      const value = 'test it';
      const container = buildContainer((services) => services.factory<string>(key, () => value, Scopes.Singleton));
      expect(container.get<string>(key)).toBe(value);
      expect(container.get<string>(key)).toBe(value);
    });

    test('transient', () => {
      const value = 'test it';
      const container = buildContainer((services) => services.factory<string>(key, () => value, Scopes.Transient));
      expect(container.get<string>(key)).toBe(value);
      expect(container.get<string>(key)).toBe(value);
    });

    test('unique', () => {
      const value = 'test it';
      const container = buildContainer((services) => services.factory<string>(key, () => value, Scopes.Unique));
      expect(container.get<string>(key)).toBe(value);
      expect(container.get<string>(key)).toBe(value);
    });
  });

  describe('singleton', () => {
    test('register and resolve a value', () => {
      const value = 'test it';
      const container = buildContainer((services) => services.singleton<string>(key, value));
      expect(container.get<string>(key)).toBe(value);
      expect(container.get<string>(key)).toBe(value);
    });
  });

  describe('array', () => {
    test('register and resolve a value', () => {
      const item1 = 'item1';
      const item2 = 'item2';

      const container = buildContainer((services) => services.array<string>(key, item1).array<string>(key, item2));
      expect(container.get<string[]>(key)).toEqual([item1, item2]);
    });
  });

  describe('autoResolve', () => {
    const counterKey = 'counter';
    class Counter {
      private _count = 0;

      get count(): number {
        return this._count;
      }

      increment(): void {
        this._count++;
      }
    }

    class AutoResolveExample {
      constructor(@inject(counterKey) readonly counter: Counter) {}

      doStuff(): void {
        this.counter.increment();
      }
    }

    describe('arrayAutoResolve', () => {
      test('register and resolve a value', () => {
        const counter = new Counter();
        const container = buildContainer((services) => {
          services.singleton(counterKey, counter);
          services.arrayAutoResolve<AutoResolveExample>(key, AutoResolveExample);
        });

        const examples = container.get<AutoResolveExample[]>(key);
        expect(examples.length).toBe(1);

        examples[0].doStuff();

        expect(counter.count).toBe(1);
      });
    });

    describe('register and resolve a newable', () => {
      test('singleton', () => {
        const container = buildContainer((services) => {
          services.factory(counterKey, () => new Counter(), Scopes.Unique);
          services.autoResolve(key, AutoResolveExample, Scopes.Singleton);
        });

        let example = container.get<AutoResolveExample>(key);
        example.doStuff();
        example.doStuff();

        example = container.get<AutoResolveExample>(key);

        expect(example.counter.count).toBe(2);
      });

      test('transient', () => {
        const container = buildContainer((services) => {
          services.factory(counterKey, () => new Counter(), Scopes.Unique);
          services.autoResolve(key, AutoResolveExample, Scopes.Transient);
        });

        let example = container.get<AutoResolveExample>(key);
        example.doStuff();
        example.doStuff();

        example = container.get<AutoResolveExample>(key);

        expect(example.counter.count).toBe(2);
      });

      test('unique', () => {
        const container = buildContainer((services) => {
          services.factory(counterKey, () => new Counter(), Scopes.Unique);
          services.autoResolve(key, AutoResolveExample, Scopes.Unique);
        });

        let example = container.get<AutoResolveExample>(key);
        example.doStuff();
        example.doStuff();

        example = container.get<AutoResolveExample>(key);

        expect(example.counter.count).toBe(0);
      });
    });
  });
});
