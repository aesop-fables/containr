import { ContainerKey } from './Constants';
import { InterceptorChain } from './Interceptors';
import { ConstructorDecorator, getDependencyMetadata, setDependencyMetadata } from './Internals';
import { IDependencyMetadata } from './Types';

// eslint-disable-next-line @typescript-eslint/ban-types
declare type Type = Object;

// Let's only expose the 2nd gen/level of abstractions
export function registerDependency(
  target: Type,
  dependencyKey: string,
  parameterIndex: number,
  resolveFromContainer = true,
): void {
  const metadata = getDependencyMetadata(target);
  metadata.push({
    dependencyKey,
    parameterIndex,
    interceptors: new InterceptorChain(dependencyKey, resolveFromContainer),
  } as IDependencyMetadata);

  setDependencyMetadata(target, metadata);
}

function findDependency(constructor: Type, parameterIndex: number) {
  const metadata = getDependencyMetadata(constructor);
  return metadata.find((x) => x.parameterIndex === parameterIndex);
}

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
export function interceptorChainFor<T = any>(constructor: Type, parameterIndex: number) {
  let dependency = findDependency(constructor, parameterIndex);
  if (!dependency) {
    registerDependency(constructor, undefined as unknown as string, parameterIndex);
    dependency = findDependency(constructor, parameterIndex) as IDependencyMetadata;
  }

  return dependency.interceptors as InterceptorChain<T>;
}

export declare type InterceptorDecorator = <T>(chain: InterceptorChain<T>) => void;

export function createInterceptingDecorator(modifyChain: InterceptorDecorator, dependencyKey?: string) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return (target: Type, _propertyKey: string | symbol | undefined, parameterIndex: number): void => {
    if (dependencyKey) {
      registerDependency(target, dependencyKey, parameterIndex);
    }

    const chain = interceptorChainFor(target, parameterIndex);
    modifyChain(chain);
  };
}

export function inject(dependencyKey: string) {
  return createInterceptingDecorator(() => {
    // no-op
  }, dependencyKey);
}

export function injectContainer() {
  return createInterceptingDecorator(() => {
    // no-op
  }, ContainerKey);
}

type TypeDescriptor = string | ConstructorDecorator;

export function injectDependencies(descriptors: TypeDescriptor[]) {
  return (target: Type) => {
    for (let i = 0; i < descriptors.length; i++) {
      const descriptor = descriptors[i];
      if (typeof descriptor === 'string') {
        registerDependency(target, descriptor, i);
        continue;
      }

      descriptor(target, undefined, i);
    }
  };
}
