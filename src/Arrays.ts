import { IServiceContainer } from '.';
import { IInterceptor } from './Interceptors';
import { createConstructorDecorator } from './Internals';
import { interceptorChainFor, registerDependency } from './Metadata';

export function injectArray(key: string) {
   
  return createConstructorDecorator(({ constructor, parameterIndex }) => {
    registerDependency(constructor, key, parameterIndex, false);
    const chain = interceptorChainFor(constructor, parameterIndex);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chain.add(new ArrayDependencyInterceptor<any>(key));
  });
}

export class ArrayDependencyInterceptor<T> implements IInterceptor<T[]> {
  constructor(private readonly key: string) {}
  resolve(currentValue: T[] | undefined, container: IServiceContainer): T[] {
    if (!container.has(this.key)) {
      return [];
    }
    return container.get<T[]>(this.key);
  }
}
