import { GraphQLClient, Variables } from 'graphql-request';
import { Inject, Injectable } from '@nestjs/common';
import type { HasuraConfig, HasuraRequestBuilder } from './models';

@Injectable()
export class HasuraService extends GraphQLClient {
  constructor(@Inject('HASURA_CONFIG') private readonly config: HasuraConfig) {
    super(config.endpoint);
  }

  requestBuilder(): HasuraRequestBuilder {
    let finalHeaders: Record<string, string> = {};

    const builder: HasuraRequestBuilder = {
      withHeaders: (headers: Record<string, string>): HasuraRequestBuilder => {
        finalHeaders = { ...finalHeaders, ...headers };
        return builder;
      },

      withAdminSecret: (): HasuraRequestBuilder => {
        if (this.config.adminSecret) {
          finalHeaders['x-hasura-admin-secret'] = this.config.adminSecret;
        }
        return builder;
      },

      withAuthorizationToken: (token: string): HasuraRequestBuilder => {
        finalHeaders['Authorization'] = `Bearer ${token}`;
        return builder;
      },

      request: <T = any>(
        document: string,
        variables?: Variables,
      ): Promise<T> => {
        return this.request<T>(document, variables, finalHeaders);
      },
    };

    return builder;
  }
}
