import { IServiceContainer } from './IServiceContainer';
import { Stack } from './Stack';

export interface IInterceptor<T> {
  resolve(currentValue: T | undefined, container: IServiceContainer, errors: Stack<Error>): T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class InterceptorChain<T = any> {
  private readonly interceptors: IInterceptor<T>[] = [];

  constructor(private readonly key: string) {}

  add(interceptor: IInterceptor<T>): void {
    this.interceptors.push(interceptor);
  }

  resolve(container: IServiceContainer): T {
    const errors = new Stack<Error>();
    let currentValue: T | undefined;
    try {
      currentValue = container.get<T>(this.key);
    } catch (e) {
      errors.push(e as Error);
    }

    for (let i = 0; i < this.interceptors.length; i++) {
      currentValue = this.interceptors[i].resolve(currentValue, container, errors);
    }

    if (errors.size() !== 0) {
      throw errors.peek();
    }

    return currentValue as T;
  }
}
