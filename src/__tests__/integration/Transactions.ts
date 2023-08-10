import { IServiceContainer, Newable, createServiceModuleWithOptions, injectContainer } from '../..';
import { IntegrationKeys } from './IntegrationKeys';
import { Tenant } from './Models';

export interface ITransactionProvider {
  executeForTenant<T>(tenant: Tenant, constructor: Newable<T>, action: (service: T) => Promise<void>): Promise<void>;
}

const injectTenant = createServiceModuleWithOptions<Tenant>('transction:tenant', (services, tenant) => {
  services.singleton(IntegrationKeys.CurrentTenant, tenant);
});

export class TransactionProvider implements ITransactionProvider {
  constructor(@injectContainer() private readonly container: IServiceContainer) {}

  async executeForTenant<T>(
    tenant: Tenant,
    constructor: Newable<T>,
    action: (service: T) => Promise<void>,
  ): Promise<void> {
    const childContainer = this.container.createChildContainer('transcation', [injectTenant(tenant)]);
    const handler = childContainer.resolve(constructor);

    try {
      await action(handler);
    } finally {
      childContainer.dispose();
    }
  }
}
