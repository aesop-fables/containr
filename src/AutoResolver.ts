import { IServiceContainer } from './IServiceContainer';
import { getDependencyMetadata } from './Internals';
import { IDependencyMetadata, Newable } from './Types';

export class AutoResolver {
  static resolve<T>(constructor: Newable<T>, container: IServiceContainer): T {
    const metadata = getDependencyMetadata(constructor);
    if (!metadata || metadata.length === 0) {
      return new constructor();
    }

    // These are coming in descending order
    const paramTypes: IDependencyMetadata[] = [...metadata].sort((a, b) => a.parameterIndex - b.parameterIndex);
    const params = paramTypes.map((metadata: IDependencyMetadata) => container.get(metadata.dependencyKey));
    return new constructor(...params);
  }
}
