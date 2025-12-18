import { GraphQLClient, Variables } from 'graphql-request';
import { Inject, Injectable } from '@nestjs/common';
import type { HasuraConfig, HasuraRequestBuilder } from './models';
import { GraphQLLoaderService } from './graphql-loader/graphql-loader.service';

@Injectable()
export class HasuraService extends GraphQLClient {
  constructor(
    @Inject('HASURA_CONFIG') private readonly config: HasuraConfig,
    private readonly gqlLoader: GraphQLLoaderService,
  ) {
    super(config.endpoint);
  }

  /**
   * Internal request execution
   * @private
   */
  private executeRequest<T = any>(
    document: string,
    variables?: Variables,
    headers?: Record<string, string>,
  ): Promise<T> {
    return super.request<T>(document, variables, headers);
  }

  requestBuilder(): HasuraRequestBuilder {
    let finalHeaders: Record<string, string> = {};
    let storedQuery: string | undefined;
    let storedVariables: Variables = {};

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

      withQuery: (query: string): HasuraRequestBuilder => {
        storedQuery = query;
        return builder;
      },

      withVariables: (variables: Variables): HasuraRequestBuilder => {
        storedVariables = variables;
        return builder;
      },

      withQueryFromFile: (filePath: string): HasuraRequestBuilder => {
        const query = this.gqlLoader.loadQuery(filePath);
        storedQuery = query;
        return builder;
      },

      execute: <T = any>(): Promise<T> => {
        if (!storedQuery) {
          return Promise.reject(
            new Error(
              'Query is required. Use withQuery() or withQueryFromFile() before calling execute()',
            ),
          );
        }

        return this.executeRequest<T>(
          storedQuery,
          storedVariables,
          finalHeaders,
        );
      },
    };

    return builder;
  }
}
