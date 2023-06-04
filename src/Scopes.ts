import { IDependency } from './Dependencies';
import { IServiceContainer } from './IServiceContainer';
import { safeDispose } from './Internals';
import { Newable } from './Types';

export enum Scopes {
  Singleton,
  Transient,
  Unique,
}

export interface IScopedDependency<T> {
  dependency: IDependency<T>;
  clone(): IScopedDependency<T>;
  destroy(): void;
  resolveValue(container: IServiceContainer): T;
}

export class TransientScope<T> implements IScopedDependency<T> {
  value: T | undefined;
  constructor(readonly dependency: IDependency<T>) {}

  destroy(): void {
    if (this.value) {
      safeDispose(this.value);
      this.value = undefined;
    }
  }

  resolveValue(container: IServiceContainer): T {
    if (typeof this.value === 'undefined') {
      this.value = this.dependency.resolveValue(container);
    }

    return this.value;
  }

  clone(): IScopedDependency<T> {
    if (typeof this.value === 'undefined') {
      return new TransientScope<T>(this.dependency);
    }

    return this;
  }
}

export class SingletonScope<T> extends TransientScope<T> {
  clone(): IScopedDependency<T> {
    return this;
  }
}

export class UniqueScope<T> implements IScopedDependency<T> {
  constructor(readonly dependency: IDependency<T>) {}

  clone(): IScopedDependency<T> {
    return this;
  }

  destroy(): void {
    // no-op
  }

  resolveValue(container: IServiceContainer): T {
    return this.dependency.resolveValue(container);
  }
}

const scopeMap = {
  [Scopes.Singleton]: SingletonScope,
  [Scopes.Transient]: TransientScope,
  [Scopes.Unique]: UniqueScope,
};

export function createScope<T>(scope: Scopes, dependency: IDependency<T>): IScopedDependency<T> {
  const Scope = scopeMap[scope] as Newable<IScopedDependency<T>> | undefined;
  if (!Scope) {
    throw new Error(`Unrecognized scope: ${scope}`);
  }

  return new Scope(dependency);
}
