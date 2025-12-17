import { GraphQLClient } from 'graphql-request';
import type { HasuraConfig } from './models/hasura-config.interface';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class HasuraService extends GraphQLClient {
  constructor(@Inject('HASURA_CONFIG') private readonly config: HasuraConfig) {
    super(config.endpoint);
  }
}
