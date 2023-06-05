import 'reflect-metadata';
import { ValueFactoryDependency, Disposable, IDependency, ServiceCollection } from '..';
import { SingletonScope, TransientScope, UniqueScope } from '../Scopes';

class TrackingDependency implements IDependency<string> {
  private invocations = 0;

  constructor(readonly key: string = 'tracking') {}

  get nrInvocations() {
    return this.invocations;
  }

  resolveValue(): string {
    ++this.invocations;
    return 'dependency';
  }
}

class MyDisposable implements Disposable {
  private invocations = 0;

  get nrInvocations() {
    return this.invocations;
  }

  dispose(): void {
    ++this.invocations;
  }
}

describe('Scopes', () => {
  describe('Transient', () => {
    test('resolves and caches value', () => {
      const dependency = new TrackingDependency();
      const scope = new TransientScope(dependency);
      const container = new ServiceCollection().buildContainer();

      expect(scope.resolveValue(container)).toBe('dependency');
      scope.resolveValue(container);

      expect(dependency.nrInvocations).toBe(1);
    });

    test('destroy unresolved value', () => {
      const disposable = new MyDisposable();
      const dependency = new ValueFactoryDependency<MyDisposable>('test', disposable);
      const scope = new TransientScope(dependency);

      scope.destroy();

      expect(disposable.nrInvocations).toBe(0);
    });

    test('destroy resolved value', () => {
      const disposable = new MyDisposable();
      const dependency = new ValueFactoryDependency<MyDisposable>('test', disposable);
      const scope = new TransientScope(dependency);
      const container = new ServiceCollection().buildContainer();
      scope.resolveValue(container);

      scope.destroy();

      expect(disposable.nrInvocations).toBe(1);
    });

    test('clone resolved value', () => {
      const dependency = new TrackingDependency();
      const scope = new TransientScope(dependency);
      const container = new ServiceCollection().buildContainer();
      scope.resolveValue(container);

      const cloned = scope.clone();
      cloned.resolveValue(container);

      expect(dependency.nrInvocations).toBe(1);
    });

    test('clone unresolved value', () => {
      const dependency = new TrackingDependency();
      const scope = new TransientScope(dependency);
      const container = new ServiceCollection().buildContainer();
      const cloned = scope.clone();

      scope.resolveValue(container);
      cloned.resolveValue(container);

      expect(dependency.nrInvocations).toBe(2);
    });
  });

  describe('Singleton', () => {
    test('clone resolved value', () => {
      const dependency = new TrackingDependency();
      const scope = new SingletonScope(dependency);
      const container = new ServiceCollection().buildContainer();
      scope.resolveValue(container);

      const cloned = scope.clone();
      cloned.resolveValue(container);

      expect(dependency.nrInvocations).toBe(1);
    });

    test('clone unresolved value', () => {
      const dependency = new TrackingDependency();
      const scope = new SingletonScope(dependency);
      const container = new ServiceCollection().buildContainer();
      const cloned = scope.clone();

      scope.resolveValue(container);
      cloned.resolveValue(container);

      expect(dependency.nrInvocations).toBe(1);
    });
  });

  describe('Unique', () => {
    test('resolves and does not cache value', () => {
      const dependency = new TrackingDependency();
      const scope = new UniqueScope(dependency);
      const container = new ServiceCollection().buildContainer();

      expect(scope.resolveValue(container)).toBe('dependency');
      scope.resolveValue(container);

      expect(dependency.nrInvocations).toBe(2);
    });
  });
});
