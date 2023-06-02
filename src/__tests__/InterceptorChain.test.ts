import { createContainer, IInterceptor, InterceptorChain } from '..';

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

describe('InterceptorChain', () => {
  test('No interceptors - just resolve from container', async () => {
    const message = 'Test test test';
    const key = 'my key';
    const container = createContainer([
      {
        name: 'test',
        configureServices(services) {
          services.register<string>(key, message);
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
          services.register<string>(key, message);
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
          services.register<string>(key, message);
        },
      },
    ]);

    const chain = new InterceptorChain<string>(key);
    chain.add(new UpperCaseInterceptor());
    chain.add(new RandomInterceptor());

    const result = chain.resolve(container);

    expect(result).toBe(override);
  });
});
