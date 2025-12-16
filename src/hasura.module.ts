import { DynamicModule, Module } from '@nestjs/common';

import { HasuraConfig } from './interfaces/hasura-config.interface';
import { HasuraModuleAsyncOptions } from './interfaces/hasura-async-options.interface';
import { HasuraService } from './hasura.service';

@Module({})
export class HasuraModule {
  static forRoot(config: HasuraConfig): DynamicModule {
    return {
      module: HasuraModule,
      global: true,
      providers: [
        {
          provide: 'HASURA_CONFIG',
          useValue: config,
        },
        HasuraService,
      ],
      exports: [HasuraService],
    };
  }

  static forRootAsync(options: HasuraModuleAsyncOptions): DynamicModule {
    return {
      module: HasuraModule,
      global: true,
      imports: options.imports || [],
      providers: [
        {
          provide: 'HASURA_CONFIG',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        HasuraService,
      ],
      exports: [HasuraService],
    };
  }
}
