import { IServiceContainer, ValueFactoryDelegate } from './IServiceContainer';
import { getDependencyMetadata, IDependencyMetadata } from './Metadata';
import { Newable } from './Types';

export function createAutoWireFactory<T>(constructor: Newable<T>): ValueFactoryDelegate<T> {
  return (container: IServiceContainer) => {
    const metadata = getDependencyMetadata(constructor);
    if (!metadata || metadata.length === 0) {
      return new constructor();
    }

    // These are coming in descending order
    const paramTypes: IDependencyMetadata[] = [...metadata].sort((a, b) => a.parameterIndex - b.parameterIndex);
    const params = paramTypes.map((metadata: IDependencyMetadata) => container.get(metadata.dependencyKey));
    return new constructor(...params);
  };
}
