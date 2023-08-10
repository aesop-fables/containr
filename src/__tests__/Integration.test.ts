import 'reflect-metadata';
import { createServiceModule, Disposable, inject, Scopes } from '..';
import { bootstrap, IntegrationKeys, ITransactionProvider, Tenant } from './integration';

describe('Integration Suite', () => {
  describe('Child Containers', () => {
    test('Disposing a child container does not destroy singletons from the parent', async () => {
      const customKeys = {
        RecordingService: 'recordingService',
        LoggingHandler: 'loggingHandler',
      };
      let instantiations = 0;
      class RecordingService implements Disposable {
        isDisposed = false;
        tenant: Tenant | undefined;

        constructor() {
          ++instantiations;
        }

        logTenant(tenant: Tenant) {
          console.log(`Hello from ${tenant.name} (${tenant.id})`);
          this.tenant = tenant;
        }

        dispose() {
          this.isDisposed = true;
        }
      }

      class LoggingHandler {
        constructor(
          @inject(customKeys.RecordingService) private readonly recorder: RecordingService,
          @inject(IntegrationKeys.CurrentTenant) private readonly tenant: Tenant,
        ) {}

        async execute(): Promise<void> {
          this.recorder.logTenant(this.tenant);
        }
      }

      const useCustomServices = createServiceModule('singleton:bug', (services) => {
        services.autoResolve(customKeys.RecordingService, RecordingService, Scopes.Singleton);
      });

      const container = bootstrap([useCustomServices]);
      const provider = container.get<ITransactionProvider>(IntegrationKeys.TransactionProvider);

      const tenant: Tenant = { id: 'z7345kx3', name: 'Test Tenant' };
      await provider.executeForTenant<LoggingHandler>(tenant, LoggingHandler, async (handler) => {
        await handler.execute();
      });

      const recorder = container.get<RecordingService>(customKeys.RecordingService);
      expect(instantiations).toBe(1);
      expect(recorder.isDisposed).toBeFalsy();
      expect(recorder.tenant).toBe(tenant);
    });
  });
});
