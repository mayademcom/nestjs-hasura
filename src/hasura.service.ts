import { GraphQLClient } from 'graphql-request';
import { HasuraConfig } from './dto/hasura-config.dto';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class HasuraService extends GraphQLClient {
  constructor(@Inject('HASURA_CONFIG') private readonly config: HasuraConfig) {
    super(config.endpoint);
  }
}
