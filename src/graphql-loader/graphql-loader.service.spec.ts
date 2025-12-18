import * as fs from 'fs';
import * as path from 'path';

import { Test, TestingModule } from '@nestjs/testing';

import { GraphQLLoaderService } from './graphql-loader.service';

jest.mock('fs');
jest.mock('path');

describe('GraphQLLoaderService', () => {
  let service: GraphQLLoaderService;

  const mockFilePath = 'queries/test.graphql';
  const mockFullPath = '/app/queries/test.graphql';
  const mockQuery = 'query Test { test }';
  const mockedReadFileSync = fs.readFileSync as jest.MockedFunction<
    typeof fs.readFileSync
  >;

  beforeEach(async () => {
    jest.clearAllMocks();

    (path.join as jest.Mock).mockReturnValue(mockFullPath);

    const module: TestingModule = await Test.createTestingModule({
      providers: [GraphQLLoaderService],
    }).compile();

    service = module.get<GraphQLLoaderService>(GraphQLLoaderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should load query from file when cache is empty', () => {
    mockedReadFileSync.mockReturnValue(mockQuery as string);

    const result = service.loadQuery(mockFilePath);

    expect(result).toBe(mockQuery);
    expect(fs.readFileSync).toHaveBeenCalledWith(mockFullPath, 'utf-8');
  });

  it('should cache the query after loading from file', () => {
    mockedReadFileSync.mockReturnValue(mockQuery as string);

    service.loadQuery(mockFilePath);
    mockedReadFileSync.mockClear();

    const cachedResult = service.loadQuery(mockFilePath);

    expect(cachedResult).toBe(mockQuery);
    expect(mockedReadFileSync).not.toHaveBeenCalled();
  });

  it('should throw error if file read fails', () => {
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('File not found');
    });

    expect(() => service.loadQuery(mockFilePath)).toThrow(
      `Failed to load GraphQL query from ${mockFilePath}: File not found`,
    );
  });

  it('should clear cache', () => {
    (fs.readFileSync as jest.Mock).mockReturnValue(mockQuery);

    service.loadQuery(mockFilePath);
    service.clearCache();

    service.loadQuery(mockFilePath);

    expect(fs.readFileSync).toHaveBeenCalledTimes(2);
  });
});
