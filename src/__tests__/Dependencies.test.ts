import { ContainerDependency, createContainer } from '..';

describe('Dependencies', () => {
  describe('ContainerDependency', () => {
    test('No interceptors - just resolve from container', async () => {
      const container = createContainer([]);
      const dependency = new ContainerDependency();

      const result = dependency.resolveValue(container);
      expect(result).toBe(container);
    });
  });
});
