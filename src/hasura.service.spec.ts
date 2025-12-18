import { Test, TestingModule } from '@nestjs/testing';

import Chance from 'chance';
import { GraphQLLoaderService } from './graphql-loader/graphql-loader.service';
import { HasuraConfig } from './models/hasura-config.interface';
import { HasuraService } from './hasura.service';

const chance = new Chance();
describe('HasuraService', () => {
  let hasuraService: HasuraService;

  const mockConfig: HasuraConfig = {
    endpoint: chance.url(),
    adminSecret: chance.string({ length: 32 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: 'HASURA_CONFIG',
          useValue: mockConfig,
        },
        HasuraService,
        GraphQLLoaderService,
      ],
    }).compile();

    hasuraService = module.get<HasuraService>(HasuraService);
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(hasuraService).toBeDefined();
    });

    it('should have correct endpoint', () => {
      expect(hasuraService['url']).toBe(mockConfig.endpoint);
    });

    it('should initialize without admin secret', async () => {
      const configWithoutSecret: HasuraConfig = {
        endpoint: chance.url(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: 'HASURA_CONFIG',
            useValue: configWithoutSecret,
          },
          HasuraService,
          GraphQLLoaderService,
        ],
      }).compile();

      const service = module.get<HasuraService>(HasuraService);
      expect(service).toBeDefined();
    });
  });

  describe('direct request', () => {
    it('can send a direct request', async () => {
      jest.spyOn(hasuraService, 'request').mockResolvedValue(true);

      const response: boolean = await hasuraService.request('query', {});

      expect(response).toBe(true);
    });

    it('can send a direct request with variables', async () => {
      const mockData = { users: [{ id: 1, name: 'Test' }] };
      jest.spyOn(hasuraService, 'request').mockResolvedValue(mockData);

      const query = 'query GetUser($id: Int!) { user(id: $id) { id name } }';
      const variables = { id: 1 };

      const response: object = await hasuraService.request(query, variables);

      expect(response).toEqual(mockData);
    });
  });
  describe('request builder', () => {
    it('should return a request builder', () => {
      const builder = hasuraService.requestBuilder();

      expect(builder).toBeDefined();
      expect(builder.withHeaders).toBeDefined();
      expect(builder.withAdminSecret).toBeDefined();
      expect(builder.withAuthorizationToken).toBeDefined();
      expect(builder.execute).toBeDefined();
    });

    it('can send a request with admin secret', async () => {
      const expectedResponse = { data: 'test' };

      const executeRequestSpy = jest
        .spyOn(hasuraService as any, 'executeRequest')
        .mockResolvedValue(expectedResponse);

      const response: object = await hasuraService
        .requestBuilder()
        .withAdminSecret()
        .withQuery('query')
        .execute();

      expect(response).toEqual(expectedResponse);
      expect(executeRequestSpy).toHaveBeenCalledWith(
        'query',
        {},
        expect.objectContaining({
          'x-hasura-admin-secret': mockConfig.adminSecret,
        }),
      );
    });

    it('can send a request with authorization token', async () => {
      const expectedResponse = { data: 'test' };
      const token = 'jwt-token-123';

      const executeRequestSpy = jest
        .spyOn(hasuraService as any, 'executeRequest')
        .mockResolvedValue(expectedResponse);

      const response: object = await hasuraService
        .requestBuilder()
        .withAuthorizationToken(token)
        .withQuery('query')
        .execute();

      expect(response).toEqual(expectedResponse);
      expect(executeRequestSpy).toHaveBeenCalledWith(
        'query',
        {},
        expect.objectContaining({
          Authorization: `Bearer ${token}`,
        }),
      );
    });

    it('can send a request with custom headers', async () => {
      const expectedResponse = { data: 'test' };
      const customHeaders = {
        'x-hasura-role': 'user',
        'x-hasura-user-id': '123',
      };

      const executeRequestSpy = jest
        .spyOn(hasuraService as any, 'executeRequest')
        .mockResolvedValue(expectedResponse);

      const response: object = await hasuraService
        .requestBuilder()
        .withHeaders(customHeaders)
        .withQuery('query')
        .execute();

      expect(response).toEqual(expectedResponse);
      expect(executeRequestSpy).toHaveBeenCalledWith(
        'query',
        {},
        expect.objectContaining(customHeaders),
      );
    });

    it('can chain multiple headers', async () => {
      const expectedResponse = { data: 'test' };
      const token = 'jwt-token';
      const customHeaders = { 'x-tenant-id': 'tenant-123' };

      const executeRequestSpy = jest
        .spyOn(hasuraService as any, 'executeRequest')
        .mockResolvedValue(expectedResponse);

      const response: object = await hasuraService
        .requestBuilder()
        .withAdminSecret()
        .withAuthorizationToken(token)
        .withHeaders(customHeaders)
        .withQuery('query')
        .execute();

      expect(response).toEqual(expectedResponse);
      expect(executeRequestSpy).toHaveBeenCalledWith(
        'query',
        {},
        expect.objectContaining({
          'x-hasura-admin-secret': mockConfig.adminSecret,
          Authorization: `Bearer ${token}`,
          'x-tenant-id': 'tenant-123',
        }),
      );
    });

    it('should merge multiple withHeaders calls', async () => {
      const expectedResponse = { data: 'test' };

      const executeRequestSpy = jest
        .spyOn(hasuraService as any, 'executeRequest')
        .mockResolvedValue(expectedResponse);

      const response: object = await hasuraService
        .requestBuilder()
        .withHeaders({ 'x-custom-1': 'value1' })
        .withHeaders({ 'x-custom-2': 'value2' })
        .withQuery('query')
        .execute();

      expect(response).toEqual(expectedResponse);
      expect(executeRequestSpy).toHaveBeenCalledWith(
        'query',
        {},
        expect.objectContaining({
          'x-custom-1': 'value1',
          'x-custom-2': 'value2',
        }),
      );
    });

    it('should handle empty headers when no admin secret configured', async () => {
      const configWithoutSecret: HasuraConfig = {
        endpoint: chance.url(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: 'HASURA_CONFIG',
            useValue: configWithoutSecret,
          },
          HasuraService,
          GraphQLLoaderService,
        ],
      }).compile();

      const service = module.get<HasuraService>(HasuraService);
      const expectedResponse = { data: 'test' };

      const executeRequestSpy = jest
        .spyOn(service as any, 'executeRequest')
        .mockResolvedValue(expectedResponse);

      const response: object = await service
        .requestBuilder()
        .withAdminSecret()
        .withQuery('query')
        .execute();

      expect(response).toEqual(expectedResponse);
      expect(executeRequestSpy).toHaveBeenCalledWith('query', {}, {});
    });

    it('can send request with variables', async () => {
      const query =
        'mutation InsertUser($name: String!) { insert_users(objects: { name: $name }) { affected_rows } }';
      const variables = { name: 'John' };
      const expectedResponse = { affected_rows: 1 };

      const executeRequestSpy = jest
        .spyOn(hasuraService as any, 'executeRequest')
        .mockResolvedValue(expectedResponse);

      const response: object = await hasuraService
        .requestBuilder()
        .withAdminSecret()
        .withQuery(query)
        .withVariables(variables)
        .execute();

      expect(response).toEqual(expectedResponse);
      expect(executeRequestSpy).toHaveBeenCalledWith(
        query,
        variables,
        expect.objectContaining({
          'x-hasura-admin-secret': mockConfig.adminSecret,
        }),
      );
    });

    it('should store query with withQuery', () => {
      const query = 'query { users { id } }';

      const builder = hasuraService.requestBuilder().withQuery(query);

      expect(builder).toBeDefined();
    });

    it('should store variables with withVariables', () => {
      const variables = { id: 1 };
      const builder = hasuraService.requestBuilder().withVariables(variables);

      expect(builder).toBeDefined();
    });

    it('should execute request with stored query and variables', async () => {
      const query = 'query GetUser($id: Int!) { user(id: $id) { id name } }';
      const variables = { id: 1 };
      const expectedResponse = { user: { id: 1, name: 'Test' } };

      const executeRequestSpy = jest
        .spyOn(hasuraService as any, 'executeRequest')
        .mockResolvedValue(expectedResponse);

      const response: object = await hasuraService
        .requestBuilder()
        .withQuery(query)
        .withVariables(variables)
        .execute();

      expect(response).toEqual(expectedResponse);
      expect(executeRequestSpy).toHaveBeenCalledWith(query, variables, {});
    });

    it('should execute request with headers, query and variables', async () => {
      const query = 'query GetUsers { users { id } }';
      const variables = { limit: 10 };
      const expectedResponse = { users: [] };

      const executeRequestSpy = jest
        .spyOn(hasuraService as any, 'executeRequest')
        .mockResolvedValue(expectedResponse);

      const response: object = await hasuraService
        .requestBuilder()
        .withAdminSecret()
        .withQuery(query)
        .withVariables(variables)
        .execute();

      expect(response).toEqual(expectedResponse);
      expect(executeRequestSpy).toHaveBeenCalledWith(
        query,
        variables,
        expect.objectContaining({
          'x-hasura-admin-secret': mockConfig.adminSecret,
        }),
      );
    });

    it('should chain all builder methods', async () => {
      const query =
        'mutation CreateUser($name: String!) { insert_users(objects: { name: $name }) { affected_rows } }';
      const variables = { name: 'John' };
      const token = 'jwt-token-123';
      const customHeaders = { 'x-tenant-id': 'tenant-123' };
      const expectedResponse = { affected_rows: 1 };

      const executeRequestSpy = jest
        .spyOn(hasuraService as any, 'executeRequest')
        .mockResolvedValue(expectedResponse);

      const response: object = await hasuraService
        .requestBuilder()
        .withAdminSecret()
        .withAuthorizationToken(token)
        .withHeaders(customHeaders)
        .withQuery(query)
        .withVariables(variables)
        .execute();

      expect(response).toEqual(expectedResponse);
      expect(executeRequestSpy).toHaveBeenCalledWith(
        query,
        variables,
        expect.objectContaining({
          'x-hasura-admin-secret': mockConfig.adminSecret,
          Authorization: `Bearer ${token}`,
          'x-tenant-id': 'tenant-123',
        }),
      );
    });

    it('should throw error when execute called without query', async () => {
      await expect(
        hasuraService.requestBuilder().withAdminSecret().execute(),
      ).rejects.toThrow(
        'Query is required. Use withQuery() or withQueryFromFile() before calling execute()',
      );
    });

    it('should execute without variables', async () => {
      const query = 'query { users { id } }';
      const expectedResponse = { users: [] };

      const executeRequestSpy = jest
        .spyOn(hasuraService as any, 'executeRequest')
        .mockResolvedValue(expectedResponse);

      const response: object = await hasuraService
        .requestBuilder()
        .withQuery(query)
        .execute();

      expect(response).toEqual(expectedResponse);
      expect(executeRequestSpy).toHaveBeenCalledWith(query, {}, {});
    });

    it('should allow method chaining in any order', async () => {
      const query = 'query { users { id } }';
      const variables = { limit: 5 };
      const expectedResponse = { users: [] };

      const executeRequestSpy = jest
        .spyOn(hasuraService as any, 'executeRequest')
        .mockResolvedValue(expectedResponse);

      const response: object = await hasuraService
        .requestBuilder()
        .withVariables(variables)
        .withAdminSecret()
        .withQuery(query)
        .execute();

      expect(response).toEqual(expectedResponse);
      expect(executeRequestSpy).toHaveBeenCalledWith(
        query,
        variables,
        expect.objectContaining({
          'x-hasura-admin-secret': mockConfig.adminSecret,
        }),
      );
    });
  });

  describe('requestBuilder with query from file', () => {
    it('should load query from file', async () => {
      const filePath = 'test/queries/get-users.gql';
      const fileContent = 'query GetUsers { users { id name } }';
      const expectedResponse = { users: [] };

      jest
        .spyOn(hasuraService['gqlLoader'], 'loadQuery')
        .mockReturnValue(fileContent);

      const executeRequestSpy = jest
        .spyOn(hasuraService as any, 'executeRequest')
        .mockResolvedValue(expectedResponse);

      const response: object = await hasuraService
        .requestBuilder()
        .withQueryFromFile(filePath)
        .execute();

      expect(response).toEqual(expectedResponse);
      expect(executeRequestSpy).toHaveBeenCalledWith(fileContent, {}, {});
    });

    it('should load query from file with variables', async () => {
      const filePath = 'test-queries/get-user-by-id.gql';
      const fileContent =
        'query GetUserById($id: Int!) { user(id: $id) { id name } }';
      const variables = { id: 1 };
      const expectedResponse = { user: { id: 1, name: 'Test' } };

      jest
        .spyOn(hasuraService['gqlLoader'], 'loadQuery')
        .mockReturnValue(fileContent);

      const executeRequestSpy = jest
        .spyOn(hasuraService as any, 'executeRequest')
        .mockResolvedValue(expectedResponse);

      const response: object = await hasuraService
        .requestBuilder()
        .withQueryFromFile(filePath)
        .withVariables(variables)
        .execute();

      expect(response).toEqual(expectedResponse);
      expect(executeRequestSpy).toHaveBeenCalledWith(
        fileContent,
        variables,
        {},
      );
    });

    it('should load query from file with admin secret', async () => {
      const filePath = 'test-queries/create-user.gql';
      const fileContent =
        'mutation CreateUser($name: String!) { insert_users_one(object: { name: $name }) { id } }';
      const variables = { name: 'John' };
      const expectedResponse = { insert_users_one: { id: 1 } };

      jest
        .spyOn(hasuraService['gqlLoader'], 'loadQuery')
        .mockReturnValue(fileContent);

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
        fileContent,
        variables,
        expect.objectContaining({
          'x-hasura-admin-secret': mockConfig.adminSecret,
        }),
      );
    });

    it('should chain withQueryFromFile with all other methods', async () => {
      const filePath = 'test-queries/admin-query.gql';
      const fileContent = 'query AdminQuery { users { id } }';
      const variables = { limit: 5 };
      const token = 'jwt-token';
      const customHeaders = { 'x-tenant-id': 'tenant-123' };
      const expectedResponse = { users: [] };

      jest
        .spyOn(hasuraService['gqlLoader'], 'loadQuery')
        .mockReturnValue(fileContent);

      const executeRequestSpy = jest
        .spyOn(hasuraService as any, 'executeRequest')
        .mockResolvedValue(expectedResponse);

      const response: object = await hasuraService
        .requestBuilder()
        .withAdminSecret()
        .withAuthorizationToken(token)
        .withHeaders(customHeaders)
        .withQueryFromFile(filePath)
        .withVariables(variables)
        .execute();

      expect(response).toEqual(expectedResponse);
      expect(executeRequestSpy).toHaveBeenCalledWith(
        fileContent,
        variables,
        expect.objectContaining({
          'x-hasura-admin-secret': mockConfig.adminSecret,
          Authorization: `Bearer ${token}`,
          'x-tenant-id': 'tenant-123',
        }),
      );
    });

    it('should cache loaded queries', async () => {
      const filePath = 'test/queries/get-users.gql';
      const fileContent = 'query GetUsers { users { id } }';
      const expectedResponse = { users: [] };

      const loadQuerySpy = jest
        .spyOn(hasuraService['gqlLoader'], 'loadQuery')
        .mockReturnValue(fileContent);

      jest
        .spyOn(hasuraService as any, 'executeRequest')
        .mockResolvedValue(expectedResponse);

      await hasuraService
        .requestBuilder()
        .withQueryFromFile(filePath)
        .execute();

      await hasuraService
        .requestBuilder()
        .withQueryFromFile(filePath)
        .execute();

      expect(loadQuerySpy).toHaveBeenCalledTimes(2);
    });

    it('should throw error when file does not exist', () => {
      const filePath = 'non-existent-file.gql';

      jest
        .spyOn(hasuraService['gqlLoader'], 'loadQuery')
        .mockImplementation(() => {
          throw new Error(
            'Failed to load GraphQL query from non-existent-file.gql: ENOENT: no such file or directory',
          );
        });

      expect(() => {
        hasuraService.requestBuilder().withQueryFromFile(filePath);
      }).toThrow(
        'Failed to load GraphQL query from non-existent-file.gql: ENOENT: no such file or directory',
      );
    });

    it('should allow mixing withQuery and withQueryFromFile', async () => {
      const filePath = 'test/queries/get-users.gql';
      const fileContent = 'query GetUsers { users { id } }';
      const inlineQuery = 'query Inline { posts { id } }';
      const expectedResponse = { posts: [] };

      jest
        .spyOn(hasuraService['gqlLoader'], 'loadQuery')
        .mockReturnValue(fileContent);

      const executeRequestSpy = jest
        .spyOn(hasuraService as any, 'executeRequest')
        .mockResolvedValue(expectedResponse);

      const response: object = await hasuraService
        .requestBuilder()
        .withQueryFromFile(filePath)
        .withQuery(inlineQuery)
        .execute();

      expect(response).toEqual(expectedResponse);
      expect(executeRequestSpy).toHaveBeenCalledWith(inlineQuery, {}, {});
    });

    it('should work when withQueryFromFile called after withVariables', async () => {
      const filePath = 'test/queries/get-users.gql';
      const fileContent =
        'query GetUsers($limit: Int!) { users(limit: $limit) { id } }';
      const variables = { limit: 10 };
      const expectedResponse = { users: [] };

      jest
        .spyOn(hasuraService['gqlLoader'], 'loadQuery')
        .mockReturnValue(fileContent);

      const executeRequestSpy = jest
        .spyOn(hasuraService as any, 'executeRequest')
        .mockResolvedValue(expectedResponse);

      const response: object = await hasuraService
        .requestBuilder()
        .withVariables(variables)
        .withQueryFromFile(filePath)
        .execute();

      expect(response).toEqual(expectedResponse);
      expect(executeRequestSpy).toHaveBeenCalledWith(
        fileContent,
        variables,
        {},
      );
    });
  });
});
