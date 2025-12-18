import { Variables } from 'graphql-request';

export interface HasuraRequestBuilder {
  withHeaders(headers: Record<string, string>): HasuraRequestBuilder;
  withAdminSecret(): HasuraRequestBuilder;
  withAuthorizationToken(token: string): HasuraRequestBuilder;
  withQuery(query: string): HasuraRequestBuilder;
  withVariables(variables: Variables): HasuraRequestBuilder;
  execute<T = any>(): Promise<T>;
}
