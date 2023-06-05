import { IServiceContainer } from './IServiceContainer';
import { getDependencyMetadata } from './Internals';
import { IDependencyMetadata, Newable } from './Types';

export class AutoResolver {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static resolve<T>(constructor: Newable<T>, container: IServiceContainer, ...args: any[]): T {
    const metadata = getDependencyMetadata(constructor);
    const dependencies: IDependencyMetadata[] = [...metadata].sort((a, b) => a.parameterIndex - b.parameterIndex);
    const resolvedArgs = [
      ...dependencies.map((metadata: IDependencyMetadata) => metadata.interceptors.resolve(container)),
      ...args,
    ];
    return new constructor(...resolvedArgs);
  }
}
