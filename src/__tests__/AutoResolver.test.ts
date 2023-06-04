import 'reflect-metadata';
import { AutoResolver, createContainer, injectContainer, IServiceContainer } from '..';

class ContainerInjectionSample {
  constructor(@injectContainer() private readonly container: IServiceContainer) {}

  resolveMessage(): string {
    return this.container.get<string>('msg');
  }
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
});
