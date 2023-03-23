import { ServiceCollection } from './Container';

export type ServiceModuleMiddleware = (services: ServiceCollection) => void;
export type ServiceModuleMiddlewareWithOptions<Options> = (services: ServiceCollection, options: Options) => void;

export type ServiceModuleMiddlewareWithOptionsFactory<Options> = (options: Options) => IServiceModule;

/**
 * Represents a set of services to be registered in the IServiceContainer
 */
export interface IServiceModule {
  name: string;
  configureServices: ServiceModuleMiddleware;
}
