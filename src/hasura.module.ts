import { HasuraService } from './hasura.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [HasuraService],
})
export class HasuraModule {}
