import { TransactionProvider } from './Transactions';
import { IntegrationKeys } from './IntegrationKeys';
import { IServiceContainer, IServiceModule, Scopes, createContainer, createServiceModule } from '../..';

const useTransactions = createServiceModule('transactions', (services) => {
  services.autoResolve(IntegrationKeys.TransactionProvider, TransactionProvider, Scopes.Transient);
});

export function bootstrap(overrides: IServiceModule[] = []): IServiceContainer {
  return createContainer([useTransactions, ...overrides]);
}

export * from './IntegrationKeys';
export * from './Models';
export * from './Transactions';
