/* eslint-disable @typescript-eslint/no-explicit-any */
import { ContainerKey } from './Constants';
import { createAutoResolvingFactory } from './createAutoResolvingFactory';
import { IServiceContainer, ValueFactoryDelegate } from './IServiceContainer';
import { Newable } from './Types';

export interface IDependency<T> {
  key: string;
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
    this.values.push(
      new ConfiguredDependency(`${this.key}-${this.values.length}`, createAutoResolvingFactory<T>(clazz)),
    );
  }

  clone(): IDependency<T[]> {
    return new ArrayDependency<T>(this.key, this.values);
  }
}

export class UnknownDependency<T> implements IDependency<T> {
  constructor(readonly key: string, private readonly values: Record<string, IDependency<any>>) {}

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

export class ContainerDependency implements IDependency<IServiceContainer> {
  get key(): string {
    return ContainerKey;
  }

  isResolved(): boolean {
    return true;
  }

  resolveValue(container: IServiceContainer): IServiceContainer {
    return container;
  }

  destroy(): void {
    // no-op
  }

  clone(): IDependency<IServiceContainer> {
    return this;
  }
}
