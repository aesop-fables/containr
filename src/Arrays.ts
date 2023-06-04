import { IServiceContainer } from './IServiceContainer';
import { IInterceptor } from './Interceptors';
import { createConstructorDecorator } from './Internals';
import { interceptorChainFor, registerDependency } from './Metadata';
import { Stack } from './Stack';

export function injectArray(key: string) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return createConstructorDecorator(({ constructor, parameterIndex }) => {
    registerDependency(constructor, key, parameterIndex);
    const chain = interceptorChainFor(constructor, parameterIndex);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chain.add(new ArrayDependencyInterceptor<any>());
  });
}

export class ArrayDependencyInterceptor<T> implements IInterceptor<T[]> {
  resolve(currentValue: T[] | undefined, _container: IServiceContainer, errors: Stack<Error>): T[] {
    if (errors.size() !== 0) {
      errors.pop();
      return [];
    }

    return currentValue as T[];
  }
}
