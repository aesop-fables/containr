import { IServiceContainer } from './IServiceContainer';
import { Stack } from './Stack';

export interface IInterceptor<T> {
  resolve(currentValue: T | undefined, container: IServiceContainer, errors: Stack<Error>): T;
}

class ResolveFromContainerInterceptor<T> implements IInterceptor<T> {
  constructor(private readonly key: string) {}

  resolve(currentValue: T | undefined, container: IServiceContainer): T {
    return container.get<T>(this.key);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class InterceptorChain<T = any> {
  private readonly interceptors: IInterceptor<T>[] = [];

  constructor(private readonly key: string, private readonly resolveFromContainer: boolean = true) {
    if (this.resolveFromContainer) {
      this.add(new ResolveFromContainerInterceptor<T>(this.key));
    }
  }

  add(interceptor: IInterceptor<T>): void {
    this.interceptors.push(interceptor);
  }

  resolve(container: IServiceContainer): T {
    const errors = new Stack<Error>();
    let currentValue: T | undefined;
    for (let i = 0; i < this.interceptors.length; i++) {
      try {
        currentValue = this.interceptors[i].resolve(currentValue, container, errors);
      } catch (e) {
        errors.push(e as Error);
      }
    }

    if (errors.size() !== 0) {
      throw errors.peek();
    }

    return currentValue as T;
  }
}
