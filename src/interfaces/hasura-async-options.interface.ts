import { HasuraConfig } from './hasura-config.interface';

export interface HasuraModuleAsyncOptions {
  imports?: any[];
  useFactory: (...args: any[]) => Promise<HasuraConfig> | HasuraConfig;
  inject?: any[];
}
