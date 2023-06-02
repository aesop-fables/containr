import { createAutoWireFactory } from './createAutoWireFactory';
import { IServiceContainer, ValueFactoryDelegate } from './IServiceContainer';
import { Newable } from './Types';

export declare enum DependencyType {
  Array,
  Configured,
  Unknown,
}

export interface IDependency<T> {
  key: string;
  type: DependencyType | string;
  isResolved(): boolean;
  resolveValue(container: IServiceContainer): T;
  destroy(): void;
  clone(): IDependency<T>;
}

export class ConfiguredDependency<T> implements IDependency<T> {
  readonly key: string;
  factory: ValueFactoryDelegate<T>;
  value: T | undefined;

  constructor(key: string, value: T | ValueFactoryDelegate<T>) {
    this.key = key;

    if (typeof value === 'function') {
      this.factory = value as ValueFactoryDelegate<T>;
    } else {
      this.factory = () => value;
      this.value = value;
    }
  }

  get type(): DependencyType | string {
    return DependencyType.Configured;
  }

  destroy(): void {
    if (this.value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = this.value as any;
      if (typeof value.dispose === 'function') {
        value.dispose();
      }

      this.value = undefined;
    }
  }

  isResolved(): boolean {
    return typeof this.value !== 'undefined';
  }

  resolveValue(container: IServiceContainer): T {
    if (typeof this.value === 'undefined') {
      this.value = this.factory(container);
    }

    return this.value;
  }

  // for the upcoming "inject"/configure on the container
  replaceValue(value: T | ValueFactoryDelegate<T>): void {
    if (typeof value === 'function') {
      this.factory = value as ValueFactoryDelegate<T>;
    } else {
      this.factory = () => value;
      this.value = value;
    }
  }

  clone(): IDependency<T> {
    return new ConfiguredDependency(this.key, this.factory);
  }
}

export class ArrayDependency<T> implements IDependency<T[]> {
  private resolved = false;

  constructor(readonly key: string, private readonly values: IDependency<T>[] = []) {}

  get type(): DependencyType | string {
    return DependencyType.Array;
  }

  destroy(): void {
    this.values.forEach((x) => x.destroy());
  }

  isResolved(): boolean {
    return this.resolved;
  }

  resolveValue(container: IServiceContainer): T[] {
    this.resolved = true;
    return this.values.map((x) => x.resolveValue(container));
  }

  register(value: T | ValueFactoryDelegate<T>): void {
    this.values.push(new ConfiguredDependency(`${this.key}-${this.values.length}`, value));
  }

  push(clazz: Newable<T>): void {
    this.values.push(new ConfiguredDependency(`${this.key}-${this.values.length}`, createAutoWireFactory<T>(clazz)));
  }

  clone(): IDependency<T[]> {
    return new ArrayDependency<T>(this.key, this.values);
  }
}

export class UnknownDependency<T> implements IDependency<T> {
  constructor(readonly key: string, private readonly values: Record<string, IDependency<any>>) {}

  get type(): DependencyType | string {
    return DependencyType.Unknown;
  }

  destroy(): void {
    // no-op
  }

  isResolved(): boolean {
    return false;
  }

  resolveValue(): T {
    throw new Error(`Unrecognized service: ${this.key}`);
  }

  clone(): IDependency<T> {
    return this;
  }
}
