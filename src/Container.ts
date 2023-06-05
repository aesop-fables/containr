/* eslint-disable @typescript-eslint/no-explicit-any */
import { ContainerKey } from './Constants';
import { createAutoResolvingFactory } from './createAutoResolvingFactory';
import {
  IDependency,
  UnknownDependency,
  ValueFactoryDependency,
  ArrayDependency,
  ContainerDependency,
} from './Dependencies';
import { IServiceContainer, ValueFactoryDelegate } from './IServiceContainer';
import { IServiceModule } from './Modules';
import { createScope, IScopedDependency, Scopes, TransientScope, UniqueScope } from './Scopes';
import { Stack } from './Stack';
import { Newable } from './Types';

export interface IServiceRegistry {
  configureServices(services: ServiceCollection): void;
}

export type RegistryConstructor<T extends IServiceRegistry> = new () => T;

/**
 * A collection of configured dependencies registered against unique keys.
 */
export class ServiceCollection {
  private values: Record<string, IScopedDependency<any>>;

  /**
   * Creates a new ServiceCollection
   * @param values Optional hash of configured dependencies (leave this unspecified in most cases).
   */
  constructor(values?: Record<string, IScopedDependency<any>>) {
    this.values = values ?? {};
  }

  /**
   * Retrieves the underlying hash of configured dependencies.
   * @returns The underlying hash of configured dependencies.
   */
  getValues(): Record<string, IScopedDependency<any>> {
    return this.values;
  }

  /**
   * Creates an implementation of IServiceContainer with all of the configured dependencies.
   * @returns The configured container.
   */
  buildContainer(): ServiceContainer {
    return new ServiceContainer({
      ...this.values,
      [ContainerKey]: new UniqueScope(new ContainerDependency()),
    });
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
  /**
   * Registers a value factory for the specified key.
   * @param key The key of the dependency.
   * @param value Value (or value factory) for resolving the dependency.
   * @param scope The scope of the dependency.
   */
  factory<T>(key: string, value: ValueFactoryDelegate<T>, scope: Scopes): ServiceCollection {
    return this.push(key, new ValueFactoryDependency<T>(key, value), scope);
  }
  /**
   * Registers a singleton value for the specified key.
   * @param key The key of the dependency.
   * @param value Value to be used.
   */
  singleton<T>(key: string, value: T): ServiceCollection {
    return this.push(key, new ValueFactoryDependency<T>(key, value), Scopes.Singleton);
  }
  /**
   * Appends the value (or factory) to the specified array dependency.
   * @param key The key of the dependency
   * @param value Value to be appended
   * @param scope The scope of the array dependency (this is required on first creation).
   */
  array<T>(key: string, value: ValueFactoryDelegate<T> | T): ServiceCollection {
    const scopedDependency = this.values[key] as IScopedDependency<T[]>;
    let dependency = scopedDependency?.dependency as ArrayDependency<T>;
    if (typeof scopedDependency?.dependency === 'undefined') {
      dependency = new ArrayDependency<T>(key);
      this.values[key] = createScope(Scopes.Transient, dependency as IDependency<T[]>);
    }

    dependency.register(value);
    return this;
  }
  /**
   * Appends the type to the specified array dependency.
   * @param key The key of the dependency.
   * @param value Value to be appended.
   * @param scope The scope of the array dependency (this is required on first creation).
   */
  arrayAutoResolve<T>(key: string, type: Newable<T>): ServiceCollection {
    const scopedDependency = this.values[key] as IScopedDependency<T[]>;
    let dependency = scopedDependency?.dependency as ArrayDependency<T>;
    if (typeof scopedDependency?.dependency === 'undefined') {
      dependency = new ArrayDependency<T>(key);
      this.values[key] = createScope(Scopes.Transient, dependency as IDependency<T[]>);
    }

    dependency.push(type);
    return this;
  }
  /**
   * Registers an auto-resolving factory for the given key.
   * @param key The key of the dependency.
   * @param clazz The class to auto-resolve.
   * @param scope The scope of the dependency.
   */
  autoResolve<T>(key: string, type: Newable<T>, scope: Scopes): ServiceCollection {
    return this.factory<T>(key, createAutoResolvingFactory(type), scope);
  }
  /**
   * Registers a dependency and wraps it with the specified scope.
   * @param key The key of the dependency.
   * @param dependency The dependency to register.
   * @param scope The scope of the dependency.
   */
  push<T>(key: string, dependency: IDependency<T>, scope: Scopes): ServiceCollection {
    this.values[key] = createScope(scope, dependency);
    return this;
  }

  // LEGACY REGISTRATION
  /**
   * Register the specified key
   * @param key The key of the dependency
   * @param value Value (or value factory) for resolving the dependency
   * @deprecated Marked for removal; please use the new registration DSL
   */
  register<T>(key: string, value: T): ServiceCollection;
  /**
   * Register the specified key
   * @param key The key of the dependency
   * @param value Value factory for resolving the dependency
   * @deprecated Marked for removal; please use the new registration DSL
   */
  register<T>(key: string, value: ValueFactoryDelegate<T>): ServiceCollection;
  /**
   * Register the specified key
   * @param key The key of the dependency
   * @param value Value (or value factory) for resolving the dependency
   * @deprecated Marked for removal; please use the new registration DSL
   */
  register<T>(key: string, value: T | ValueFactoryDelegate<T>): ServiceCollection {
    return this.push(key, new ValueFactoryDependency<T>(key, value), Scopes.Transient);
  }
  /**
   * Appends the specified dependency to the array of dependencies registered against the given key.
   * @param key The key of the dependencies
   * @param clazz A reference to the class (for auto-wiring)
   * @deprecated Marked for removal; please use the new registration DSL
   */
  add<T>(key: string, clazz: Newable<T>): ServiceCollection {
    let dependency = this.values[key]?.dependency as ArrayDependency<T>;
    if (typeof dependency === 'undefined') {
      dependency = new ArrayDependency<T>(key);
      this.values[key] = new TransientScope<T[]>(dependency as IDependency<T[]>);
    }

    dependency.push(clazz);
    return this;
  }
  /**
   * Appends the specified dependency to the array of dependencies registered against the given key.
   * @param key The key of the dependencies.
   * @param value Value (or value factory) for resolving the dependency.
   * @deprecated Marked for removal; please use the new registration DSL
   */
  addDependency<T>(key: string, value: T | ValueFactoryDelegate<T>): ServiceCollection {
    let dependency = this.values[key]?.dependency as ArrayDependency<T>;
    if (typeof dependency === 'undefined') {
      dependency = new ArrayDependency<T>(key);
      this.values[key] = new TransientScope<T[]>(dependency as IDependency<T[]>);
    }

    dependency.register(value);
    return this;
  }
  /**
   * Registers an auto-wired dependency for the given key.
   * @param key The key of the dependency.
   * @param clazz The class to auto-wire.
   * @deprecated Marked for removal; please use the new registration DSL
   */
  use<T>(key: string, clazz: Newable<T>): ServiceCollection {
    return this.push(key, new ValueFactoryDependency<T>(key, createAutoResolvingFactory<T>(clazz)), Scopes.Transient);
  }
}

export class ServiceContainer implements IServiceContainer {
  private readonly values: Record<string, IScopedDependency<any>>;

  constructor(values: Record<string, any>, private parent?: IServiceContainer, private provenance?: string) {
    this.values = values;
  }

  has(key: string): boolean {
    return typeof this.values[key] !== 'undefined';
  }

  resolve<T>(clazz: Newable<T>): T {
    const factory = createAutoResolvingFactory(clazz);
    return factory(this);
  }

  private _getService<T>(key: string): T {
    let value = this.values[key];
    if (!value) {
      if (this.parent) {
        return this.parent.get<T>(key);
      }

      value = new TransientScope<T>(new UnknownDependency<T>(key));
    }

    return (value as IScopedDependency<T>).resolveValue(this);
  }

  get<T>(key: string): T;
  get<T1, T2>(keys: string[]): [T1, T2];
  get<T1, T2, T3>(keys: string[]): [T1, T2, T3];
  get<T1, T2, T3, T4>(keys: string[]): [T1, T2, T3, T4];
  get<T1, T2, T3, T4, T5>(keys: string[]): [T1, T2, T3, T4, T5];
  get<T1, T2, T3, T4, T5, T6>(keys: string[]): [T1, T2, T3, T4, T5, T6];
  get<T1, T2, T3, T4, T5, T6, T7>(keys: string[]): [T1, T2, T3, T4, T5, T6, T7];
  get<T1, T2, T3, T4, T5, T6, T7, T8>(keys: string[]): [T1, T2, T3, T4, T5, T6, T7, T8];
  get<T1, T2, T3, T4, T5, T6, T7, T8, T9>(keys: string[]): [T1, T2, T3, T4, T5, T6, T7, T8, T9];
  get<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(keys: string[]): [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10];
  get<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    keys: string | string[],
  ):
    | T1
    | [T1, T2]
    | [T1, T2, T3]
    | [T1, T2, T3, T4]
    | [T1, T2, T3, T4, T5]
    | [T1, T2, T3, T4, T5, T6]
    | [T1, T2, T3, T4, T5, T6, T7]
    | [T1, T2, T3, T4, T5, T6, T7, T8]
    | [T1, T2, T3, T4, T5, T6, T7, T8, T9]
    | [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10] {
    if (!Array.isArray(keys)) {
      return this._getService<T1>(keys);
    }

    if (keys.length === 2) {
      return [this._getService<T1>(keys[0]), this._getService<T2>(keys[1])];
    }

    if (keys.length === 3) {
      return [this._getService<T1>(keys[0]), this._getService<T2>(keys[1]), this._getService<T3>(keys[2])];
    }

    if (keys.length === 4) {
      return [
        this._getService<T1>(keys[0]),
        this._getService<T2>(keys[1]),
        this._getService<T3>(keys[2]),
        this._getService<T4>(keys[3]),
      ];
    }

    if (keys.length === 5) {
      return [
        this._getService<T1>(keys[0]),
        this._getService<T2>(keys[1]),
        this._getService<T3>(keys[2]),
        this._getService<T4>(keys[3]),
        this._getService<T5>(keys[4]),
      ];
    }

    if (keys.length === 6) {
      return [
        this._getService<T1>(keys[0]),
        this._getService<T2>(keys[1]),
        this._getService<T3>(keys[2]),
        this._getService<T4>(keys[3]),
        this._getService<T5>(keys[4]),
        this._getService<T6>(keys[5]),
      ];
    }

    if (keys.length === 7) {
      return [
        this._getService<T1>(keys[0]),
        this._getService<T2>(keys[1]),
        this._getService<T3>(keys[2]),
        this._getService<T4>(keys[3]),
        this._getService<T5>(keys[4]),
        this._getService<T6>(keys[5]),
        this._getService<T7>(keys[6]),
      ];
    }

    if (keys.length === 8) {
      return [
        this._getService<T1>(keys[0]),
        this._getService<T2>(keys[1]),
        this._getService<T3>(keys[2]),
        this._getService<T4>(keys[3]),
        this._getService<T5>(keys[4]),
        this._getService<T6>(keys[5]),
        this._getService<T7>(keys[6]),
        this._getService<T8>(keys[7]),
      ];
    }

    if (keys.length === 9) {
      return [
        this._getService<T1>(keys[0]),
        this._getService<T2>(keys[1]),
        this._getService<T3>(keys[2]),
        this._getService<T4>(keys[3]),
        this._getService<T5>(keys[4]),
        this._getService<T6>(keys[5]),
        this._getService<T7>(keys[6]),
        this._getService<T8>(keys[7]),
        this._getService<T9>(keys[8]),
      ];
    }

    if (keys.length === 10) {
      return [
        this._getService<T1>(keys[0]),
        this._getService<T2>(keys[1]),
        this._getService<T3>(keys[2]),
        this._getService<T4>(keys[3]),
        this._getService<T5>(keys[4]),
        this._getService<T6>(keys[5]),
        this._getService<T7>(keys[6]),
        this._getService<T8>(keys[7]),
        this._getService<T9>(keys[8]),
        this._getService<T10>(keys[9]),
      ];
    }

    throw new Error('Unsupported overload');
  }

  destroy(key: string): void {
    // const dependency = this.values[key] as ConfiguredDependency<any>;
    const dependency = this.values[key];
    if (!dependency) {
      return;
    }

    dependency.destroy();
  }

  createChildContainer(provenance: string, overrides?: IServiceModule[]): IServiceContainer {
    const values: Record<string, IScopedDependency<any>> = {};
    Object.entries(this.values).forEach(([key, scope]) => (values[key] = scope.clone()));

    const services = new ServiceCollection(values);
    const modules = overrides ?? [];
    modules.forEach((m) => m.configureServices(services));

    return new ServiceContainer(values, this, provenance);
  }

  dispose(): void {
    Object.values(this.values).forEach((scope) => scope.destroy());
  }
}

export class ServiceContainerStack {
  private stack: Stack<IServiceContainer>;

  constructor(root: IServiceContainer) {
    this.stack = new Stack<IServiceContainer>();
    this.stack.push(root);
  }

  current(): IServiceContainer {
    const container = this.stack.peek();
    if (!container) {
      throw new Error('No container found');
    }

    return container;
  }

  push(container: IServiceContainer): void {
    this.stack.push(container);
  }

  pop(): void {
    this.stack.pop();
  }
}
