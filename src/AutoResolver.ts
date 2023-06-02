import { IServiceContainer } from './IServiceContainer';
import { getDependencyMetadata } from './Internals';
import { IDependencyMetadata, Newable } from './Types';

export class AutoResolver {
  static resolve<T>(constructor: Newable<T>, container: IServiceContainer): T {
    const metadata = getDependencyMetadata(constructor);
    const argTypes: IDependencyMetadata[] = [...metadata].sort((a, b) => a.parameterIndex - b.parameterIndex);
    const args = argTypes.map((metadata: IDependencyMetadata) => metadata.interceptors.resolve(container));
    return new constructor(...args);
  }
}
