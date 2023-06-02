import { IServiceContainer } from './IServiceContainer';

export interface IInterceptor<T> {
  resolve(currentValue: T | undefined, container: IServiceContainer): T;
}

export class InterceptorChain<T> {
  private readonly interceptors: IInterceptor<T>[] = [];

  constructor(private readonly key: string) {}

  add(interceptor: IInterceptor<T>): void {
    this.interceptors.push(interceptor);
  }

  resolve(container: IServiceContainer): T {
    let currentValue: T | undefined = container.get<T>(this.key);
    for (let i = 0; i < this.interceptors.length; i++) {
      currentValue = this.interceptors[i].resolve(currentValue, container);
    }

    return currentValue as T;
  }
}
