import { createAutoWireFactory } from './createAutoWireFactory';
import { IServiceContainer, ValueFactoryDelegate } from './IServiceContainer';
import { Newable } from './Types';

export declare enum DependencyType {
  Array,
  Configured,
  Unknown,
}

export interface IConfiguredDependency<T> {
  key: string;
  type: DependencyType | string;
  isResolved(): boolean;
  resolveValue(container: IServiceContainer): T;
  clone(): IConfiguredDependency<T>;
}

export class ConfiguredDependency<T> implements IConfiguredDependency<T> {
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

  clone(): IConfiguredDependency<T> {
    return new ConfiguredDependency(this.key, this.factory);
  }
}

export class ArrayDependency<T> implements IConfiguredDependency<T[]> {
  private resolved = false;

  constructor(readonly key: string, private readonly values: IConfiguredDependency<T>[] = []) {}

  get type(): DependencyType | string {
    return DependencyType.Array;
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

  clone(): IConfiguredDependency<T[]> {
    return new ArrayDependency<T>(this.key, this.values);
  }
}

export class UnknownDependency<T> implements IConfiguredDependency<T> {
  constructor(readonly key: string, private readonly values: Record<string, IConfiguredDependency<any>>) {}

  get type(): DependencyType | string {
    return DependencyType.Unknown;
  }

  isResolved(): boolean {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  resolveValue(container: IServiceContainer): T {
    console.log(Object.keys(this.values));
    throw new Error(`Unrecognized service: ${this.key}`);
  }

  clone(): IConfiguredDependency<T> {
    return this;
  }
}
