import { AutoResolver } from './AutoResolver';
import { IServiceContainer, ValueFactoryDelegate } from './IServiceContainer';
import { Newable } from './Types';

// The interceptor chain mechanics should be reusable
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAutoResolvingFactory<T>(constructor: Newable<T>, ...args: any[]): ValueFactoryDelegate<T> {
  return (container: IServiceContainer) => {
    return AutoResolver.resolve(constructor, container, args);
  };
}
