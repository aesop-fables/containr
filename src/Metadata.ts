import { InterceptorChain } from './Interceptors';
import { getDependencyMetadata, setDependencyMetadata } from './Internals';
import { IDependencyMetadata } from './Types';

// eslint-disable-next-line @typescript-eslint/ban-types
declare type Type = Object;

// Let's only expose the 2nd gen/level of abstractions
export function registerDependency(target: Type, dependencyKey: string, parameterIndex: number): void {
  const metadata = getDependencyMetadata(target);
  metadata.push({
    dependencyKey,
    parameterIndex,
    interceptors: new InterceptorChain(dependencyKey),
  } as IDependencyMetadata);

  setDependencyMetadata(target, metadata);
}

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
export function interceptorChainFor<T = any>(constructor: Type, parameterIndex: number) {
  const metadata = getDependencyMetadata(constructor);
  const dependency = metadata.find((x) => x.parameterIndex === parameterIndex);
  if (!dependency) {
    return undefined;
  }

  return dependency.interceptors as InterceptorChain<T>;
}

// Change injectMetadataKey
// InterceptorChain per reflect-target. If it doesn't exist, create it and store it (function)

// Then @inject becomes a registration of an interceptor

export function inject(dependencyKey: string) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return (target: Type, _propertyKey: string | symbol | undefined, parameterIndex: number): void => {
    registerDependency(target, dependencyKey, parameterIndex);
  };
}
