import 'reflect-metadata';
import { AutoResolver, createContainer, injectArray, injectContainer, IServiceContainer } from '..';
import { buildContainer } from './utils';

class ContainerInjectionSample {
  constructor(@injectContainer() private readonly container: IServiceContainer) {}

  resolveMessage(): string {
    return this.container.get<string>('msg');
  }
}

const arrayKey = 'arrayz';
class ArrayInjectionSample {
  constructor(@injectArray(arrayKey) readonly values: string[]) {}
}

describe('AutoResolver', () => {
  test('Use the @injectContainer() decorator', async () => {
    const message = 'Test test test';
    const key = 'msg';
    const container = createContainer([
      {
        name: 'test',
        configureServices(services) {
          services.singleton<string>(key, message);
        },
      },
    ]);

    const sample = AutoResolver.resolve(ContainerInjectionSample, container);
    expect(sample.resolveMessage()).toBe(message);
  });

  test('Use the @injectArray decorator on an empty array', async () => {
    const container = createContainer([]);
    const sample = AutoResolver.resolve(ArrayInjectionSample, container);
    expect(sample.values.length).toBe(0);
  });

  test('Use the @injectArray decorator on a populated array', async () => {
    const item1 = 'item1';
    const item2 = 'item2';

    const container = buildContainer((services) =>
      services.array<string>(arrayKey, item1).array<string>(arrayKey, item2),
    );
    const sample = AutoResolver.resolve(ArrayInjectionSample, container);
    expect(sample.values).toEqual([item1, item2]);
  });
});
