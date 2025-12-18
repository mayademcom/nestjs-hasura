import * as fs from 'fs';
import * as path from 'path';

import { Injectable } from '@nestjs/common';

@Injectable()
export class GraphQLLoaderService {
  private queryCache = new Map<string, string>();

  loadQuery(filePath: string): string {
    let query = this.loadQueryFromCache(filePath);
    if (!query) query = this.loadQueryFromFile(filePath);
    this.saveQueryToCache(filePath, query);
    return query;
  }

  private loadQueryFromCache(filePath: string) {
    let query: string | null = null;
    if (this.queryCache.has(filePath)) {
      query = this.queryCache.get(filePath)!;
    }
    return query;
  }

  private loadQueryFromFile(filePath: string) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      const query = fs.readFileSync(fullPath, 'utf-8');
      return query;
    } catch (error) {
      throw new Error(
        `Failed to load GraphQL query from ${filePath}: ${(error as Error).message}`,
      );
    }
  }

  private saveQueryToCache(filePath: string, query: string) {
    this.queryCache.set(filePath, query);
  }

  clearCache(): void {
    this.queryCache.clear();
  }
}
