import { IDependency } from './Dependencies';
import { IServiceContainer } from './IServiceContainer';

export interface IScopedDependency<T> {
  dependency: IDependency<T>;
  clone(): IScopedDependency<T>;
  destroy(): void;
  resolveValue(container: IServiceContainer): T;
}

export class SingletonScope<T> implements IScopedDependency<T> {
  get dependency(): IDependency<T> {
    throw new Error('Method not implemented.');
  }

  clone(): IScopedDependency<T> {
    throw new Error('Method not implemented.');
  }
  destroy(): void {
    throw new Error('Method not implemented.');
  }
  resolveValue(container: IServiceContainer): T {
    throw new Error('Method not implemented.');
  }
}

export class TransientScope<T> implements IScopedDependency<T> {
  constructor(readonly dependency: IDependency<T>) {}
  clone(): IScopedDependency<T> {
    throw new Error('Method not implemented.');
  }
  destroy(): void {
    throw new Error('Method not implemented.');
  }
  resolveValue(container: IServiceContainer): T {
    throw new Error('Method not implemented.');
  }
}

export class UniqueScope<T> implements IScopedDependency<T> {
  get dependency(): IDependency<T> {
    throw new Error('Method not implemented.');
  }

  clone(): IScopedDependency<T> {
    throw new Error('Method not implemented.');
  }
  destroy(): void {
    throw new Error('Method not implemented.');
  }
  resolveValue(container: IServiceContainer): T {
    throw new Error('Method not implemented.');
  }
}
