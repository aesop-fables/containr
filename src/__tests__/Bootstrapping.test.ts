import 'reflect-metadata';
import {
  BootstrappingServices,
  createContainer,
  createServiceModule,
  IActivator,
  IServiceModule,
  ServiceCollection,
} from '..';

class TestActivator implements IActivator {
  isActivated = false;

  activate(): void {
    this.isActivated = true;
  }
}

describe('Bootstrapping', () => {
  describe('createContainer', () => {
    test('Always configures the service modules', () => {
      const key = 'foo:bar';
      class MyServiceModule implements IServiceModule {
        get name(): string {
          return key;
        }

        configureServices(services: ServiceCollection): void {
          services.use(key, MyServiceModule);
        }
      }
      const container = createContainer([new MyServiceModule()]);
      expect(container.get<MyServiceModule>(key).name).toBe(key);
    });

    test('Runs the activators when setting is true', () => {
      const testModule = createServiceModule('test', (services) => {
        services.add<IActivator>(BootstrappingServices.Activators, TestActivator);
      });

      const container = createContainer([testModule], { runActivators: true });
      const [activator] = container.get<IActivator[]>(BootstrappingServices.Activators);
      expect((activator as TestActivator).isActivated).toBeTruthy();
    });

    test('Does not run the activators when setting is false', () => {
      const testModule = createServiceModule('test', (services) => {
        services.add<IActivator>(BootstrappingServices.Activators, TestActivator);
      });

      const container = createContainer([testModule], { runActivators: false });
      const [activator] = container.get<IActivator[]>(BootstrappingServices.Activators);
      expect((activator as TestActivator).isActivated).toBeFalsy();
    });

    // test('playing with the new syntax', () => {
    //   // Thought: What if we do a "withDefaultConventions" plugin that lets you use something like @injectAsDefaultFor(MyKey)
    //   // services
    //   //   .register<ISomething>('Something')
    //   //   .withAutoWire(Something, Scope.Transient);

    //   // this is the baseline usage (IConfiguredDependency<T>)
    //   services.register(dependency);

    //   services
    //     .factory<ISomething>(Key, Something, Scope.Transient)
    //     .singleton<ISomething>(Key, something);
    //     .autoWire<ISomething>(Key, Something, Scope.Singleton)
    //     .array<ISomething>(Key, Something, Scope.Transient)
    //     .arrayAutoWire<ISomething>(Key, Something, Scope.Transient)

    //   class MyClass {
    //     constructor(@injectSubject(Key) private readonly blah: Observable<MyModel>) {}
    //   }
    // });
  });
});
