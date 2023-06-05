import { InterceptorChain } from './Interceptors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Newable<T> = new (...args: any[]) => T;

export interface IDependencyMetadata {
  dependencyKey: string;
  parameterIndex: number;
  propertyKey: string | symbol | undefined;
  interceptors: InterceptorChain;
}
