/* eslint-disable @typescript-eslint/no-explicit-any */
import { ContainerKey } from './Constants';
import { createAutoResolvingFactory } from './createAutoResolvingFactory';
import { IServiceContainer, ValueFactoryDelegate } from './IServiceContainer';
import { Newable } from './Types';

export interface IDependency<T> {
  key: string;
  resolveValue(container: IServiceContainer): T;
}

export class ValueFactoryDependency<T> implements IDependency<T> {
  factory: ValueFactoryDelegate<T>;

  constructor(
    readonly key: string,
    value: T | ValueFactoryDelegate<T>,
  ) {
    if (typeof value === 'function') {
      this.factory = value as ValueFactoryDelegate<T>;
    } else {
      this.factory = () => value;
    }
  }

  resolveValue(container: IServiceContainer): T {
    return this.factory(container);
  }

  replaceValue(value: T | ValueFactoryDelegate<T>): void {
    if (typeof value === 'function') {
      this.factory = value as ValueFactoryDelegate<T>;
    } else {
      this.factory = () => value;
    }
  }

  clone(): IDependency<T> {
    return new ValueFactoryDependency(this.key, this.factory);
  }
}

export class ArrayDependency<T> implements IDependency<T[]> {
  private resolved = false;

  constructor(
    readonly key: string,
    private readonly values: IDependency<T>[] = [],
  ) {}

  isResolved(): boolean {
    return this.resolved;
  }

  resolveValue(container: IServiceContainer): T[] {
    this.resolved = true;
    return this.values.map((x) => x.resolveValue(container));
  }

  register(value: T | ValueFactoryDelegate<T>): void {
    this.values.push(new ValueFactoryDependency(`${this.key}-${this.values.length}`, value));
  }

  push(clazz: Newable<T>): void {
    this.values.push(
      new ValueFactoryDependency(`${this.key}-${this.values.length}`, createAutoResolvingFactory<T>(clazz)),
    );
  }

  clone(): IDependency<T[]> {
    return new ArrayDependency<T>(this.key, this.values);
  }
}

export class UnknownDependency<T> implements IDependency<T> {
  constructor(readonly key: string) {}

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
