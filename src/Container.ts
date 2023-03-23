/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAutoWireFactory } from './createAutoWireFactory';
import { IConfiguredDependency, UnknownDependency, ConfiguredDependency } from './Dependencies';
import { IServiceContainer } from './IServiceContainer';
import { Stack } from './Stack';
import { Newable } from './Types';

export class ServiceContainer implements IServiceContainer {
  private readonly values: Record<string, IConfiguredDependency<any>>;

  constructor(values: Record<string, any>, private parent?: IServiceContainer, private provenance?: string) {
    this.values = values;
  }

  resolve<T>(clazz: Newable<T>): T {
    const factory = createAutoWireFactory(clazz);
    return factory(this);
  }

  private _getService<T>(key: string): T {
    let value = this.values[key];
    if (!value) {
      if (this.parent) {
        return this.parent.get<T>(key);
      }

      value = new UnknownDependency<T>(key, this.values);
    }

    return (value as IConfiguredDependency<T>).resolveValue(this);
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
    const dependency = this.values[key] as ConfiguredDependency<any>;
    if (dependency && dependency.value) {
      if (typeof dependency.value.dispose === 'function') {
        dependency.value.dispose();
      }

      dependency.value = undefined;
    }
  }

  createChildContainer(provenance: string): IServiceContainer {
    const values: Record<string, IConfiguredDependency<any>> = {};
    const keys = Object.entries(this.values)
      .filter(([, value]) => !value.isResolved())
      .map(([key]) => key);

    keys.forEach((key) => {
      values[key] = this.values[key].clone();
    });

    return new ServiceContainer(values, this, provenance);
  }

  dispose(): void {
    const keys = Object.entries(this.values)
      .filter(([, value]) => {
        return value.isResolved();
      })
      .map(([key]) => key);

    keys.forEach((key) => this.destroy(key));
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
