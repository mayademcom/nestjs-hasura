import { DynamicModule, Module } from '@nestjs/common';

import { HasuraConfig } from './dto/hasura-config.dto';
import { HasuraService } from './hasura.service';

@Module({})
export class HasuraModule {
  static forRoot(config: HasuraConfig): DynamicModule {
    return {
      module: HasuraModule,
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
}
