/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { HasuraConfig, HasuraService } from '../src';
import { Test, TestingModule } from '@nestjs/testing';

import Chance from 'chance';
import { GraphQLLoaderService } from '../src/graphql-loader/graphql-loader.service';

const chance = new Chance();
describe('HasuraService Integration Tests', () => {
  let hasuraService: HasuraService;
  let gqlLoader: GraphQLLoaderService;

  const mockConfig: HasuraConfig = {
    endpoint: chance.url(),
    adminSecret: chance.string({ length: 32 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphQLLoaderService,
        HasuraService,
        {
          provide: 'HASURA_CONFIG',
          useValue: mockConfig,
        },
      ],
    }).compile();

    hasuraService = module.get<HasuraService>(HasuraService);
    gqlLoader = module.get<GraphQLLoaderService>(GraphQLLoaderService);
  });

  afterEach(() => {
    gqlLoader.clearCache();
  });
  it('should load and execute query from real .gql file', async () => {
    const filePath = 'test/queries/get-users.gql';
    const variables = { limit: 10 };
    const expectedResponse = { users: [] };

    const executeRequestSpy = jest
      .spyOn(hasuraService as any, 'executeRequest')
      .mockResolvedValue(expectedResponse);

    const response: object = await hasuraService
      .requestBuilder()
      .withAdminSecret()
      .withQueryFromFile(filePath)
      .withVariables(variables)
      .execute();

    expect(response).toEqual(expectedResponse);

    expect(executeRequestSpy).toHaveBeenCalledWith(
      expect.stringContaining('query GetUsers'),
      expect.objectContaining({ limit: 10 }),
      expect.objectContaining({
        'x-hasura-admin-secret': mockConfig.adminSecret,
      }),
    );
  });

  it('should load mutation from real .gql file', async () => {
    const filePath = 'test/queries/create-user.gql';
    const variables = { name: 'John Doe', email: 'john@example.com' };
    const expectedResponse = {
      insert_users_one: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      },
    };

    const executeRequestSpy = jest
      .spyOn(hasuraService as any, 'executeRequest')
      .mockResolvedValue(expectedResponse);

    const response: object = await hasuraService
      .requestBuilder()
      .withAdminSecret()
      .withQueryFromFile(filePath)
      .withVariables(variables)
      .execute();

    expect(response).toEqual(expectedResponse);
    expect(executeRequestSpy).toHaveBeenCalledWith(
      expect.stringContaining('mutation CreateUser'),
      expect.objectContaining(variables),
      expect.any(Object),
    );
  });

  it('should throw error for non-existent real file', () => {
    const filePath = 'src/test-queries/non-existent.gql';

    expect(() => {
      hasuraService.requestBuilder().withQueryFromFile(filePath);
    }).toThrow(
      'Failed to load GraphQL query from src/test-queries/non-existent.gql',
    );
  });

  it('should handle real file with complex query', async () => {
    const filePath = 'test/queries/get-users.gql';
    const expectedResponse = { users: [{ id: 1, name: 'Test' }] };

    const executeRequestSpy = jest
      .spyOn(hasuraService as any, 'executeRequest')
      .mockResolvedValue(expectedResponse);

    const response: object = await hasuraService
      .requestBuilder()
      .withAuthorizationToken('token-123')
      .withHeaders({ 'x-hasura-role': 'user' })
      .withQueryFromFile(filePath)
      .withVariables({ limit: 5 })
      .execute();

    expect(response).toEqual(expectedResponse);

    const callArgs = executeRequestSpy.mock.calls[0];
    expect(callArgs[2]).toMatchObject({
      Authorization: 'Bearer token-123',
      'x-hasura-role': 'user',
    });
  });
});
