import { Disposable } from './Disposable';
import { IServiceModule } from './Modules';
import { Newable } from './Types';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type ValueFactoryDelegate<T> = (provider: IServiceContainer) => T;

export interface IServiceContainer extends Disposable {
  /**
   * Retrieves/constructs the specified dependencies
   * @param key The service(s) to retrieve
   */
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

  /**
   * Creates a container by copying 1)the current configuration and 2) the previously resolved instances.
   * @param provenance Moniker for the child container
   * @param overrides Collection of service modules for registering services in the child container
   */
  createChildContainer(provenance: string, overrides?: IServiceModule[]): IServiceContainer;
  /**
   * Instantiates the specified class by resolving any dependencies found in the constuctor (using the @inject decorator).
   * @param clazz The class to instantiate
   */
  resolve<T>(clazz: Newable<T>): T;
}
