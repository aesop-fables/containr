import { createContainer, IInterceptor, InterceptorChain, IServiceContainer, Stack } from '..';

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
});
