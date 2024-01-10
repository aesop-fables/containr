import 'reflect-metadata';
import { IServiceRegistry, Scopes, ServiceCollection, ServiceContainer, createServiceModule, inject } from '..';
import { buildContainer } from './utils';

const key = '@aesop-fables/containr/test';

describe('ServiceContainer', () => {
  // We're getting services a couple of times (here and there) because there were issues early on in dependency resolution
  describe('configure', () => {
    test('resets a dependency that has yet to be resolved', () => {
      const value = 'test it';
      const container = buildContainer((services) =>
        services.factory<string>(key, () => value, Scopes.Singleton),
      ) as ServiceContainer;

      const newValue = 'change it';
      container.configure((services) => services.factory<string>(key, () => newValue, Scopes.Singleton));
      expect(container.get<string>(key)).toBe(newValue);
    });

    test('resets a dependency that has been resolved', () => {
      const value = 'test it';
      const container = buildContainer((services) =>
        services.factory<string>(key, () => value, Scopes.Singleton),
      ) as ServiceContainer;
      expect(container.get<string>(key)).toBe(value);

      const newValue = 'change it';
      container.configure((services) => services.factory<string>(key, () => newValue, Scopes.Singleton));
      expect(container.get<string>(key)).toBe(newValue);
    });

    test('resets a resolved dependency in a child container', () => {
      const value = 'test it';
      const container = buildContainer((services) => services.factory<string>(key, () => value, Scopes.Singleton));
      expect(container.get<string>(key)).toBe(value);
      const childContainer = container.createChildContainer('temp') as ServiceContainer;

      const newValue = 'change it';
      childContainer.configure((services) => services.factory<string>(key, () => newValue, Scopes.Singleton));
      expect(childContainer.get<string>(key)).toBe(newValue);
    });

    test('resets an unresolved dependency in a child container', () => {
      const value = 'test it';
      const container = buildContainer((services) => services.factory<string>(key, () => value, Scopes.Singleton));
      const childContainer = container.createChildContainer('temp') as ServiceContainer;

      const newValue = 'change it';
      childContainer.configure((services) => services.factory<string>(key, () => newValue, Scopes.Singleton));
      expect(childContainer.get<string>(key)).toBe(newValue);
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

  describe('include', () => {
    test('include a registry', () => {
      const key = 'test-key';

      class SampleRegistry implements IServiceRegistry {
        configureServices(services: ServiceCollection): void {
          services.singleton(key, 'Hello, World!');
        }
      }

      const services = new ServiceCollection();
      services.include(new SampleRegistry());

      const container = services.buildContainer();
      const message = container.get<string>(key);

      expect(message).toEqual('Hello, World!');
    });

    test('include a service module', () => {
      const key = 'test-key';

      const sampleModule = createServiceModule('test', (services) => {
        services.singleton(key, 'Hello, World!');
      });

      class SampleRegistry implements IServiceRegistry {
        configureServices(services: ServiceCollection): void {
          services.include(sampleModule);
        }
      }

      const services = new ServiceCollection();
      services.include(new SampleRegistry());

      const container = services.buildContainer();
      const message = container.get<string>(key);

      expect(message).toEqual('Hello, World!');
    });
  });
});
