import { AutoResolver } from './AutoResolver';
import { IServiceContainer, ValueFactoryDelegate } from './IServiceContainer';
import { Newable } from './Types';

// The interceptor chain mechanics should be reusable
export function createAutoResolvingFactory<T>(constructor: Newable<T>): ValueFactoryDelegate<T> {
  return (container: IServiceContainer) => {
    return AutoResolver.resolve(constructor, container);
  };
}
