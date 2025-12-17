import { Variables } from 'graphql-request';

export interface HasuraRequestBuilder {
  withHeaders(headers: Record<string, string>): HasuraRequestBuilder;
  withAdminSecret(): HasuraRequestBuilder;
  withAuthorizationToken(token: string): HasuraRequestBuilder;
  request<T = any>(document: string, variables?: Variables): Promise<T>;
}
