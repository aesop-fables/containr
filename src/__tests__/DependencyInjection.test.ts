import 'reflect-metadata';
import {
  BootstrappingServices,
  createContainer,
  ValueFactoryDependency,
  inject,
  IServiceRegistry,
  ServiceCollection,
  IActivator,
  IServiceModule,
  Disposable,
  Scopes,
} from '..';
import { mock } from 'jest-mock-extended';

class UsingExpression<T extends Disposable> {
  constructor(private factory: () => T) {}

  do(action: (value: T) => void): void {
    const value = this.factory();
    try {
      action(value);
    } finally {
      value.dispose();
    }
  }
}

function using<T extends Disposable>(factory: () => T): UsingExpression<T> {
  return new UsingExpression(factory);
}

interface ISampleService {
  instanceId: string;
  invoke(): void;
}

let nrInstantiations = 0;
class SampleService implements ISampleService {
  constructor(private id: string) {
    ++nrInstantiations;
  }

  get instanceId(): string {
    return this.id;
  }

  public invoke(): void {
    console.log('Invoked!');
  }
}

describe('Dependency Injection', () => {
  beforeEach(() => {
    nrInstantiations = 0;
  });

  describe('ConfiguredDependency', () => {
    test('resolveValue() - happy path', () => {
      const key = 'test';
      const dependency = new ValueFactoryDependency<string>(key, () => 'foo');
      const container = new ServiceCollection().buildContainer();
      expect(dependency.resolveValue(container)).toBe('foo');
    });

    test('resolveValue() - uses factory when value is undefined', () => {
      const key = 'test';
      let invoked = false;
      const dependency = new ValueFactoryDependency<string>(key, () => {
        invoked = true;
        return 'foo';
      });
      const container = new ServiceCollection().buildContainer();
      expect(dependency.resolveValue(container)).toBe('foo');
      expect(invoked).toBeTruthy();
    });

    test('resolveValue() - uses factory and caches value', () => {
      const key = 'test';
      const dependency = new ValueFactoryDependency<string>(key, () => {
        return 'foo';
      });
      const container = new ServiceCollection().buildContainer();
      expect(dependency.resolveValue(container)).toBe('foo');
    });

    test('replaceValue() - uses value provided', () => {
      const key = 'test';
      let invoked = false;
      const dependency = new ValueFactoryDependency<string>(key, () => {
        // invoked = true; leaving this commented out for the visual cue
        return 'foo';
      });
      dependency.replaceValue(() => {
        invoked = true;
        return 'foo';
      });
      const container = new ServiceCollection().buildContainer();
      expect(dependency.resolveValue(container)).toBe('foo');
      expect(invoked).toBeTruthy();
    });

    test('replaceValue() - uses factory provided', () => {
      const key = 'test';
      const dependency = new ValueFactoryDependency<string>(key, () => {
        throw new Error('NOPE NOPE NOPE');
      });
      dependency.replaceValue(() => {
        return 'foo';
      });
      const container = new ServiceCollection().buildContainer();
      expect(dependency.resolveValue(container)).toBe('foo');
    });
  });

  describe('ServiceCollection', () => {
    // the rest of the mechanics have an integration tests
    // since we use the collection to build up the container in each test
    test('Importing services with no collisions', () => {
      const key1 = '132412341234';
      const key2 = '002892827878';
      const value1 = 'test1@test.com';
      const value2 = 'test2@test.com';

      const services1 = new ServiceCollection();
      const services2 = new ServiceCollection();
      services1.singleton(key1, value1);
      services2.singleton(key2, value2);

      services1.import(services2);

      const container = services1.buildContainer();
      expect(container.get<string>(key2)).toBe(value2);
    });

    test('Importing services with collisions', () => {
      const key1 = '132412341234';
      const key2 = '002892827878';
      const value1 = 'test1@test.com';
      const value2 = 'test2@test.com';
      const value3 = 'test3@test.com';

      const services1 = new ServiceCollection();
      const services2 = new ServiceCollection();
      services1.singleton(key1, value1);
      services2.singleton(key2, value2);
      services2.singleton(key1, value3);

      services1.import(services2);

      const container = services1.buildContainer();

      // Make sure that the imported key wins
      expect(container.get<string>(key1)).toBe(value3);
    });

    test('Importing services with collisions via a registry', () => {
      const key1 = '132412341234';
      const key2 = '002892827878';
      const value1 = 'test1@test.com';
      const value2 = 'test2@test.com';
      const value3 = 'test3@test.com';

      class SampleRegistry implements IServiceRegistry {
        configureServices(services: ServiceCollection): void {
          services.singleton(key2, value2);
          services.singleton(key1, value3);
        }
      }

      const services = new ServiceCollection();
      services.singleton(key1, value1);
      services.include(new SampleRegistry());

      const container = services.buildContainer();

      // Make sure that the imported key wins
      expect(container.get<string>(key1)).toBe(value3);
    });

    test('Import a registry', () => {
      const key1 = '132412341234';
      const key2 = '002892827878';
      const value1 = 'test1@test.com';
      const value2 = 'test2@test.com';

      class SampleRegistry implements IServiceRegistry {
        configureServices(services: ServiceCollection): void {
          services.singleton(key1, value1);
          services.singleton(key2, value2);
        }
      }

      const services = new ServiceCollection();
      services.importRegistry(SampleRegistry);

      const container = services.buildContainer();

      expect(container.get<string>(key1)).toBe(value1);
      expect(container.get<string>(key2)).toBe(value2);
    });

    test('add multiple implementations', () => {
      interface IPolicy {
        getOperand(): number;
      }

      class PolicyA implements IPolicy {
        getOperand(): number {
          return 1;
        }
      }

      class PolicyB implements IPolicy {
        getOperand(): number {
          return 9;
        }
      }

      const key = 'policies';
      const services = new ServiceCollection();
      services.arrayAutoResolve<IPolicy>(key, PolicyA);
      services.arrayAutoResolve<IPolicy>(key, PolicyB);

      const container = services.buildContainer();
      const policies = container.get<IPolicy[]>(key);

      const sum = policies.map((p) => p.getOperand()).reduce((a, b) => a + b, 0);
      expect(sum).toBe(10);
    });
  });

  describe('ServiceContainer', () => {
    test('Register and resolve a singleton value', async () => {
      const testServiceKey = '132412341234';
      const value = 'test@test.com';

      const services = new ServiceCollection();
      services.singleton(testServiceKey, value);

      const container = services.buildContainer();

      expect(container.get<string>(testServiceKey)).toBe(value);
    });

    test('Register and resolve multiple values', async () => {
      const key1 = '132412341234';
      const key2 = '002892827878';
      const value1 = 'test1@test.com';
      const value2 = 'test2@test.com';

      const services = new ServiceCollection();
      services.singleton(key1, value1);
      services.singleton(key2, value2);

      const container = services.buildContainer();

      expect(container.get<string, string>([key1, key2])).toStrictEqual([value1, value2]);
    });

    test('Register and resolve a lazy value', async () => {
      const testServiceKey = 'sample';

      const id = '1234';
      const services = new ServiceCollection();
      services.factory<ISampleService>(testServiceKey, () => new SampleService(id), Scopes.Transient);

      const container = services.buildContainer();

      expect(container.get<ISampleService>(testServiceKey).instanceId).toBe(id);
    });

    test('Resolving values only instantiates them once', async () => {
      const testServiceKey = 'sample';

      const id = '1234';
      const services = new ServiceCollection();
      services.factory<ISampleService>(testServiceKey, () => new SampleService(id), Scopes.Transient);

      const container = services.buildContainer();

      for (let i = 0; i < 5; i++) {
        container.get<ISampleService>(testServiceKey);
      }

      expect(nrInstantiations).toBe(1);
    });

    test('Disposing the container resets the instances', async () => {
      const testServiceKey = 'sample';

      const id = '1234';
      const services = new ServiceCollection();
      services.factory<ISampleService>(testServiceKey, () => new SampleService(id), Scopes.Transient);

      const container = services.buildContainer();
      for (let i = 0; i < 5; i++) {
        // This will only instantiate the instance ONCE
        container.get<ISampleService>(testServiceKey);
      }

      container.dispose();

      // Force another instantiation
      container.get<ISampleService>(testServiceKey);

      expect(nrInstantiations).toBe(2);
    });

    test('Resolving an unknown service throws an error', async () => {
      const container = new ServiceCollection().buildContainer();
      expect(() => container.get<ISampleService>('unknown')).toThrowError();
    });

    describe('Child Containers', () => {
      test('Resolving a value in the parent container persists the value into a child container', async () => {
        const testServiceKey = 'sample';
        const id = '1234';
        const services = new ServiceCollection();
        services.factory<ISampleService>(testServiceKey, () => new SampleService(id), Scopes.Transient);

        const container = services.buildContainer();
        container.get<ISampleService>(testServiceKey);

        using(() => container.createChildContainer('test')).do((childContainer) => {
          childContainer.get<ISampleService>(testServiceKey);
        });

        expect(nrInstantiations).toBe(1);
      });

      test('Resolving a value in the child container does not leak into the parent container', async () => {
        const testServiceKey = 'sample';
        const id = '1234';
        const services = new ServiceCollection();
        services.factory<ISampleService>(testServiceKey, () => new SampleService(id), Scopes.Transient);

        const container = services.buildContainer();
        using(() => container.createChildContainer('test')).do((childContainer) => {
          childContainer.get<ISampleService>(testServiceKey);
        });

        container.get<ISampleService>(testServiceKey);
        expect(nrInstantiations).toBe(2);
      });

      test('Resolving an override', async () => {
        // tODO -- implement this, publish it, consume from triginta, and inject the configured route
        const testServiceKey = 'sample';
        const id = '1234';
        const services = new ServiceCollection();
        services.factory<ISampleService>(testServiceKey, () => new SampleService(id), Scopes.Transient);

        const testOverride: IServiceModule = {
          name: 'overrides',
          configureServices(services) {
            services.singleton<string>(testServiceKey, id);
          },
        };

        const container = services.buildContainer();
        const childContainer = container.createChildContainer('test', [testOverride]);

        const service = childContainer.get<ISampleService>(testServiceKey);
        expect(typeof service).toBe('string');
      });
    });
  });
});

describe('Auto-wiring', () => {
  test('Happy path', () => {
    interface IService {
      execute(): void;
    }

    interface IDependency {
      execute(): void;
    }

    class Dependency implements IDependency {
      public executed = false;

      execute() {
        console.log('Executing');
        this.executed = true;
      }
    }

    class Service implements IService {
      constructor(@inject('Hello') private readonly dependency: IDependency) {}

      execute(): void {
        this.dependency.execute();
      }
    }

    const dependency = new Dependency();
    const services = new ServiceCollection();
    services.factory<IDependency>('Hello', () => dependency, Scopes.Transient);
    services.autoResolve('Service', Service, Scopes.Transient);

    const container = services.buildContainer();
    const service = container.get<IService>('Service');

    service.execute();

    expect(dependency.executed).toBeTruthy();
  });

  test('resolve more than once', () => {
    function bootstrapAndRunActivators() {
      const policyA = mock<IPolicy>();
      const policyB = mock<IPolicy>();
      const service = mock<IService>();

      class TestModule implements IServiceModule {
        get name(): string {
          return 'test';
        }

        configureServices(services: ServiceCollection): void {
          services.array<IPolicy>('two', policyA);
          services.array<IPolicy>('two', policyB);
          services.factory<IService>('one', () => service, Scopes.Transient);
          services.arrayAutoResolve<IActivator>(BootstrappingServices.Activators, StubActivator);
        }
      }

      createContainer([new TestModule()], { runActivators: true });
      expect(policyA.execute).toHaveBeenCalled();
      expect(policyB.execute).toHaveBeenCalled();
      expect(service.execute).toHaveBeenCalled();
    }

    bootstrapAndRunActivators();
    bootstrapAndRunActivators();
  });

  test('resolve concrete newable', () => {
    const policyA = mock<IPolicy>();
    const policyB = mock<IPolicy>();
    const service = mock<IService>();

    const services = new ServiceCollection();
    services.array<IPolicy>('two', policyA).array<IPolicy>('two', policyB);
    services.singleton<IService>('one', service);

    const container = services.buildContainer();
    const activator = container.resolve(StubActivator);
    activator.activate();

    expect(policyA.execute).toHaveBeenCalled();
    expect(policyB.execute).toHaveBeenCalled();
    expect(service.execute).toHaveBeenCalled();
  });
});

interface IPolicy {
  execute(): void;
}

interface IService {
  execute(): void;
}

class StubActivator implements IActivator {
  constructor(@inject('one') private readonly service: IService, @inject('two') private readonly policies: IPolicy[]) {}

  activate(): void {
    this.service.execute();
    this.policies.forEach((x) => x.execute());
  }
}
