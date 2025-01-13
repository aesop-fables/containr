/* eslint-disable @typescript-eslint/no-wrapper-object-types */
import { IDependencyMetadata } from './Types';

 
declare type Type = Object;

export const metadataKey = Symbol('@aesop-fables/containr/metadata');

 
export const getDependencyMetadata = (constructor: Type) => {
  const metadata = (Reflect.getMetadata(metadataKey, constructor) || []) as IDependencyMetadata[];
  return metadata;
};

 
export const setDependencyMetadata = (target: Type, metadata: IDependencyMetadata[]) => {
  Reflect.defineMetadata(metadataKey, metadata, target);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeDispose(value: any) {
  try {
    if (typeof value.dispose === 'function') {
      value.dispose();
    }
  } catch {
    // no-op
  }
}

export declare type ConstructorDecorator = (
   
  constructor: Object,
  propertyKey: string | symbol | undefined,
  parameterIndex: number,
) => void;

export interface ConstructorDecoratorParams {
   
  constructor: Object;
  propertyKey?: string | symbol;
  parameterIndex: number;
}

export declare type AdaptedConstructorDecorator = (params: ConstructorDecoratorParams) => void;

export function createConstructorDecorator(decorator: AdaptedConstructorDecorator): ConstructorDecorator {
  return (constructor: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    decorator({
      constructor,
      propertyKey,
      parameterIndex,
    });
  };
}
