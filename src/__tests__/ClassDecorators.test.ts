import 'reflect-metadata';
import { AutoResolver, ContainerKey, injectArray, injectDependencies, IServiceContainer } from '..';
import { buildContainer } from './utils';

const arrayKey = 'arrayz';

@injectDependencies([ContainerKey, injectArray(arrayKey)])
class ContainerClassDecoratorSample {
  constructor(
    private readonly _container: IServiceContainer,
    private readonly _values: string[],
    private readonly _other: string,
  ) {}

  get container(): IServiceContainer {
    return this._container;
  }

  get values(): string[] {
    return this._values;
  }

  get other(): string {
    return this._other;
  }
}

describe('AutoResolver', () => {
  test('Verify class decorators', async () => {
    const item1 = 'item1';
    const item2 = 'item2';

    const container = buildContainer((services) =>
      services.array<string>(arrayKey, item1).array<string>(arrayKey, item2),
    );
    const other = 'blah';
    const sample = AutoResolver.resolve(ContainerClassDecoratorSample, container, other);
    expect(sample.container).toBe(container);
    expect(sample.values).toEqual([item1, item2]);
    expect(sample.other).toEqual(other);
  });
});
