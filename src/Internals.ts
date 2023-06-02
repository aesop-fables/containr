import { IDependencyMetadata } from './Types';

// eslint-disable-next-line @typescript-eslint/ban-types
declare type Type = Object;

export const metadataKey = Symbol('@aesop-fables/containr/metadata');

// eslint-disable-next-line @typescript-eslint/ban-types
export const getDependencyMetadata = (constructor: Type) => {
  const metadata = (Reflect.getMetadata(metadataKey, constructor) || []) as IDependencyMetadata[];
  return metadata;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export const setDependencyMetadata = (target: Type, metadata: IDependencyMetadata[]) => {
  Reflect.defineMetadata(metadataKey, metadata, target);
};
