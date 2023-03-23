const injectMetadataKey = Symbol('@aesop-fables/containr/inject');

// eslint-disable-next-line @typescript-eslint/ban-types
export const getDependencyMetadata = (constructor: Object) => {
  const metadata = (Reflect.getMetadata(injectMetadataKey, constructor) || []) as IDependencyMetadata[];
  return metadata;
};

export interface IDependencyMetadata {
  dependencyKey: string;
  parameterIndex: number;
  propertyKey: string | symbol | undefined;
}

export function inject(dependencyKey: string) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return (target: Object, propertyKey: string | symbol, parameterIndex: number): void => {
    const params = getDependencyMetadata(target);
    params.push({ dependencyKey, parameterIndex, propertyKey } as IDependencyMetadata);

    Reflect.defineMetadata(injectMetadataKey, params, target);
  };
}
