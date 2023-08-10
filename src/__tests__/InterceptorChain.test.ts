import 'reflect-metadata';
import {
  createContainer,
  IInterceptor,
  inject,
  InterceptorChain,
  IServiceContainer,
  Scopes,
  ServiceCollection,
  Stack,
} from '..';

class UpperCaseInterceptor implements IInterceptor<string> {
  resolve(currentValue: string | undefined): string {
    return currentValue?.toUpperCase() ?? '';
  }
}

class RandomInterceptor implements IInterceptor<string> {
  resolve(currentValue: string | undefined): string {
    return `[last] ${currentValue}`;
  }
}

class ErrorDefaultInterceptor implements IInterceptor<string> {
  resolve(currentValue: string | undefined, container: IServiceContainer, errors: Stack<Error>): string {
    if (errors.size() !== 0) {
      errors.pop();
      return 'the default';
    }

    return currentValue as string;
  }
}

describe('InterceptorChain', () => {
  test('No interceptors - just resolve from container', async () => {
    const message = 'Test test test';
    const key = 'my key';
    const container = createContainer([
      {
        name: 'test',
        configureServices(services) {
          services.singleton<string>(key, message);
        },
      },
    ]);

    const chain = new InterceptorChain<string>(key);
    const result = chain.resolve(container);

    expect(result).toBe(message);
  });

  test('No interceptors and should not resolve returns undefined', async () => {
    const message = 'Test test test';
    const key = 'my key';
    const container = createContainer([
      {
        name: 'test',
        configureServices(services) {
          services.singleton<string>(key, message);
        },
      },
    ]);

    const chain = new InterceptorChain<string>(key, false);
    const result = chain.resolve(container);

    expect(result).toBeUndefined();
  });

  test('override the container with single interceptor', async () => {
    const message = 'Test test test';
    const override = 'TEST TEST TEST';
    const key = 'my key';
    const container = createContainer([
      {
        name: 'test',
        configureServices(services) {
          services.singleton<string>(key, message);
        },
      },
    ]);

    const chain = new InterceptorChain<string>(key);
    chain.add(new UpperCaseInterceptor());

    const result = chain.resolve(container);

    expect(result).toBe(override);
  });

  test('override the container with multiple interceptors', async () => {
    const message = 'Test test test';
    const override = '[last] TEST TEST TEST';
    const key = 'my key';
    const container = createContainer([
      {
        name: 'test',
        configureServices(services) {
          services.singleton<string>(key, message);
        },
      },
    ]);

    const chain = new InterceptorChain<string>(key);
    chain.add(new UpperCaseInterceptor());
    chain.add(new RandomInterceptor());

    const result = chain.resolve(container);

    expect(result).toBe(override);
  });

  test('unhandled error throws an error', () => {
    const key = 'my key';
    const container = createContainer([]);

    const chain = new InterceptorChain<string>(key);
    chain.add(new UpperCaseInterceptor());
    chain.add(new RandomInterceptor());

    expect(() => chain.resolve(container)).toThrow();
  });

  test('handled error does not throw an error', () => {
    const key = 'my key';
    const container = createContainer([]);

    const chain = new InterceptorChain<string>(key);
    chain.add(new ErrorDefaultInterceptor());
    chain.add(new UpperCaseInterceptor());

    const result = chain.resolve(container);

    expect(result).toBe('THE DEFAULT');
  });

  // Skipping for CI
  test.skip('Circular dependency error is wrapped', () => {
    const key1 = 'key1';
    const key2 = 'key2';
    const key3 = 'key3';

    class Transitive {
      constructor(@inject(key1) private readonly error: Error) {}
    }

    class Dependency {
      constructor(@inject(key3) private readonly transitive: Transitive) {}
    }

    class Service {
      constructor(@inject(key2) private readonly dependency: Dependency) {}
    }

    const services = new ServiceCollection();
    services.autoResolve(key1, Service, Scopes.Transient);
    services.autoResolve(key2, Dependency, Scopes.Transient);
    services.autoResolve(key3, Transitive, Scopes.Transient);

    const container = services.buildContainer();

    const chain = new InterceptorChain<string>(key1, true);
    expect(() => chain.resolve(container)).toThrowError(/Circular dependency detected/g);
  });
});
