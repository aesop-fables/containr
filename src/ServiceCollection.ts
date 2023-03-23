import { ServiceContainer } from './Container';
import { createAutoWireFactory } from './createAutoWireFactory';
import { ArrayDependency, ConfiguredDependency, IConfiguredDependency } from './Dependencies';
import { ValueFactoryDelegate } from './IServiceContainer';
import { Newable } from './Types';

export interface IServiceRegistry {
  configureServices(services: ServiceCollection): void;
}

export type RegistryConstructor<T extends IServiceRegistry> = new () => T;

/**
 * A collection of configured dependencies registered against unique keys.
 */
export class ServiceCollection {
  private values: Record<string, IConfiguredDependency<any>>;

  /**
   * Creates a new ServiceCollection
   * @param values Optional hash of configured dependencies (leave this unspecified in most cases).
   */
  constructor(values?: Record<string, IConfiguredDependency<any>>) {
    this.values = values ?? {};
  }

  /**
   * Register the specified key
   * @param key The key of the dependency
   * @param value Value (or value factory) for resolving the dependency
   */
  register<T>(key: string, value: T): ServiceCollection;
  register<T>(key: string, value: ValueFactoryDelegate<T>): ServiceCollection;
  register<T>(key: string, value: T | ValueFactoryDelegate<T>): ServiceCollection {
    this.values[key] = new ConfiguredDependency<T>(key, value);
    return this;
  }

  /**
   * Appends the specified dependency to the array of dependencies registered against the given key.
   * @param key The key of the dependencies
   * @param clazz A reference to the class (for auto-wiring)
   */
  add<T>(key: string, clazz: Newable<T>): ServiceCollection {
    let dependency = this.values[key] as ArrayDependency<T>;
    if (typeof dependency === 'undefined') {
      dependency = this.values[key] = new ArrayDependency<T>(key);
    }

    dependency.push(clazz);
    return this;
  }

  /**
   * Appends the specified dependency to the array of dependencies registered against the given key.
   * @param key The key of the dependencies.
   * @param value Value (or value factory) for resolving the dependency.
   */
  addDependency<T>(key: string, value: T | ValueFactoryDelegate<T>): ServiceCollection {
    let dependency = this.values[key] as ArrayDependency<T>;
    if (typeof dependency === 'undefined') {
      dependency = this.values[key] = new ArrayDependency<T>(key);
    }

    dependency.register(value);
    return this;
  }

  /**
   * Registers an auto-wired dependency for the given key.
   * @param key The key of the dependency.
   * @param clazz The class to auto-wire.
   */
  use<T>(key: string, clazz: Newable<T>): ServiceCollection {
    return this.register(key, createAutoWireFactory<T>(clazz));
  }

  /**
   * Retrieves the underlying hash of configured dependencies.
   * @returns The underlying hash of configured dependencies.
   */
  getValues(): Record<string, IConfiguredDependency<any>> {
    return this.values;
  }

  /**
   * Creates an implementation of IServiceContainer with all of the configured dependencies.
   * @returns The configured container.
   */
  buildContainer(): ServiceContainer {
    return new ServiceContainer(this.values);
  }

  /**
   * Whether the key has been registered.
   * @param key The dependency to query for.
   * @returns Whether the key has been registered.
   */
  isRegistered(key: string): boolean {
    return typeof this.values[key] !== 'undefined';
  }

  /**
   * Imports the service collection and copies over the configured dependencies.
   * @param collection The collection to import.
   */
  import(collection: ServiceCollection): void {
    this.values = {
      ...this.values,
      ...collection.values,
    };
  }

  /**
   * Runs the specified registry and imports the configured dependencies.
   * @param registry The registry to import.
   */
  importRegistry<Registry extends IServiceRegistry>(registry: RegistryConstructor<Registry>): void {
    const instance = new registry();
    instance.configureServices(this);
  }

  /**
   * Runs the specified registry and imports the configured dependencies.
   * @param registry The registry to import.
   */
  include(registry: IServiceRegistry): void {
    const services = new ServiceCollection();
    registry.configureServices(services);

    this.import(services);
  }

  /**
   * USE THIS WITH EXTREME CAUTION!
   * Order matters here since you're creating a temporary container.
   * This is typically only used in the registration process for resolving settings.
   * @param key The key of the dependency to resolve
   */
  resolve<T>(key: string): T {
    const container = this.buildContainer();
    try {
      return container.get<T>(key);
    } finally {
      container.dispose();
    }
  }
}
