# @mayademcom/nestjs-hasura

A powerful and flexible NestJS module for seamless integration with Hasura GraphQL Engine.

[![NPM Version](https://img.shields.io/npm/v/@mayademcom/nestjs-hasura.svg)](https://www.npmjs.com/package/@mayademcom/nestjs-hasura)
[![NPM Downloads](https://img.shields.io/npm/dm/@mayademcom/nestjs-hasura.svg)](https://www.npmjs.com/package/@mayademcom/nestjs-hasura)
[![License](https://img.shields.io/npm/l/@mayademcom/nestjs-hasura.svg)](https://github.com/mayademcom/nestjs-hasura/blob/main/LICENSE)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mayadem_nestjs-hasura&metric=alert_status)](https://sonarcloud.io/dashboard?id=mayadem_nestjs-hasura)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=mayadem_nestjs-hasura&metric=coverage)](https://sonarcloud.io/dashboard?id=mayadem_nestjs-hasura)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=mayadem_nestjs-hasura&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=mayadem_nestjs-hasura)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=mayadem_nestjs-hasura&metric=security_rating)](https://sonarcloud.io/dashboard?id=mayadem_nestjs-hasura)

## Features

✨ **Fluent Builder API** - Chain methods for clean and readable code  
🔐 **Built-in Authentication** - Admin secret and JWT token support  
📁 **GraphQL File Loading** - Load queries from `.gql` files with caching  
🎯 **TypeScript First** - Full type safety and IntelliSense support  
🚀 **Flexible Configuration** - Sync and async module registration  
🎨 **Custom Decorators** - Extract auth tokens from request headers  
⚡ **Performance Optimized** - Query caching for improved performance  
🧪 **Well Tested** - Comprehensive unit and integration tests

## Installation

```bash
npm install @mayademcom/nestjs-hasura graphql-request
```

## Quick Start

### 1. Import the Module

**Synchronous Configuration:**

```typescript
import { Module } from '@nestjs/common';
import { HasuraModule } from '@mayademcom/nestjs-hasura';

@Module({
  imports: [
    HasuraModule.forRoot({
      endpoint: 'https://your-hasura.app/v1/graphql',
      adminSecret: 'your-admin-secret', // Optional
    }),
  ],
})
export class AppModule {}
```

**Asynchronous Configuration (Recommended for Production):**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HasuraModule } from '@mayademcom/nestjs-hasura';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HasuraModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        endpoint: configService.get<string>('HASURA_ENDPOINT'),
        adminSecret: configService.get<string>('HASURA_ADMIN_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### 2. Use in Your Service

```typescript
import { Injectable } from '@nestjs/common';
import { HasuraService } from '@mayademcom/nestjs-hasura';

@Injectable()
export class UserService {
  constructor(private readonly hasura: HasuraService) {}

  async getUsers(limit: number) {
    const query = `
      query GetUsers($limit: Int!) {
        users(limit: $limit) {
          id
          name
          email
        }
      }
    `;

    return this.hasura
      .requestBuilder()
      .withAdminSecret()
      .withQuery(query)
      .withVariables({ limit })
      .execute();
  }
}
```

## Usage Guide

### Request Builder API

The module provides a fluent builder API for constructing GraphQL requests:

#### Basic Query

```typescript
const result = await this.hasura
  .requestBuilder()
  .withQuery('query { users { id name } }')
  .execute();
```

#### With Variables

```typescript
const result = await this.hasura
  .requestBuilder()
  .withQuery('query GetUser($id: uuid!) { users_by_pk(id: $id) { id name } }')
  .withVariables({ id: 'user-id' })
  .execute();
```

#### With Admin Secret

```typescript
const result = await this.hasura
  .requestBuilder()
  .withAdminSecret()
  .withQuery('query { users { id } }')
  .execute();
```

#### With Authorization Token

```typescript
const result = await this.hasura
  .requestBuilder()
  .withAuthorizationToken(jwtToken)
  .withQuery('query { me { id name } }')
  .execute();
```

#### With Custom Headers

```typescript
const result = await this.hasura
  .requestBuilder()
  .withHeaders({
    'x-hasura-role': 'user',
    'x-hasura-user-id': '123',
  })
  .withQuery('query { users { id } }')
  .execute();
```

#### Chaining Multiple Methods

```typescript
const result = await this.hasura
  .requestBuilder()
  .withAdminSecret()
  .withAuthorizationToken(token)
  .withHeaders({ 'x-tenant-id': 'tenant-123' })
  .withQuery(query)
  .withVariables(variables)
  .execute();
```

### Loading Queries from Files

Store your GraphQL queries in `.gql` files for better organization:

**Create a query file:**

```graphql
# src/queries/get-users.gql
query GetUsers($limit: Int!) {
  users(limit: $limit) {
    id
    name
    email
    created_at
  }
}
```

**Use in your service:**

```typescript
@Injectable()
export class UserService {
  constructor(private readonly hasura: HasuraService) {}

  async getUsers(limit: number) {
    return this.hasura
      .requestBuilder()
      .withAdminSecret()
      .withQueryFromFile('src/queries/get-users.gql')
      .withVariables({ limit })
      .execute();
  }
}
```

**Benefits:**

- ✅ Queries are cached automatically after first load
- ✅ Better syntax highlighting in IDE
- ✅ Easier to maintain and version control
- ✅ Separation of concerns

### Authorization Decorator

Extract authorization tokens from request headers:

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { Authorization, HasuraService } from '@mayademcom/nestjs-hasura';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly hasura: HasuraService) {}

  // Optional token
  @Post('public')
  async publicWebhook(
    @Authorization() token: string | null,
    @Body() payload: any,
  ) {
    if (token) {
      // Authenticated request
      return this.hasura
        .requestBuilder()
        .withAuthorizationToken(token)
        .withQuery('query { me { id } }')
        .execute();
    }
    // Public request
    return { message: 'Public endpoint' };
  }

  // Required token
  @Post('protected')
  async protectedWebhook(
    @Authorization({ required: true }) token: string,
    @Body() payload: any,
  ) {
    return this.hasura
      .requestBuilder()
      .withAuthorizationToken(token)
      .withQuery('query { me { id name } }')
      .execute();
  }

  // Custom prefix
  @Post('api-key')
  async apiKeyWebhook(
    @Authorization({ prefix: 'ApiKey' }) apiKey: string | null,
    @Body() payload: any,
  ) {
    // Header: "ApiKey xxx-yyy-zzz"
    return { apiKey };
  }
}
```

**Decorator Options:**

| Option     | Type    | Default    | Description                                        |
| ---------- | ------- | ---------- | -------------------------------------------------- |
| `required` | boolean | `false`    | Throws `UnauthorizedException` if token is missing |
| `prefix`   | string  | `'Bearer'` | Token prefix to strip from header                  |

## Module Configuration

### Module Registration Methods

The module provides four registration methods:

#### `forRoot(config)`

Global module with synchronous configuration:

```typescript
HasuraModule.forRoot({
  endpoint: 'https://hasura.app/v1/graphql',
  adminSecret: 'secret',
});
```

#### `forRootAsync(config)`

Global module with asynchronous configuration:

```typescript
HasuraModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    endpoint: config.get('HASURA_ENDPOINT'),
    adminSecret: config.get('HASURA_ADMIN_SECRET'),
  }),
  inject: [ConfigService],
});
```

#### `register(config)`

Module-scoped with synchronous configuration:

```typescript
HasuraModule.register({
  endpoint: 'https://hasura.app/v1/graphql',
});
```

#### `registerAsync(config)`

Module-scoped with asynchronous configuration:

```typescript
HasuraModule.registerAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    endpoint: config.get('HASURA_ENDPOINT'),
  }),
  inject: [ConfigService],
});
```

### Configuration Options

```typescript
interface HasuraConfig {
  endpoint: string; // Hasura GraphQL endpoint URL
  adminSecret?: string; // Optional admin secret for admin operations
}
```

## Advanced Usage

### Multiple Hasura Instances

Use module-scoped registration for different Hasura endpoints:

```typescript
// user.module.ts
@Module({
  imports: [
    HasuraModule.register({
      endpoint: 'https://users-hasura.app/v1/graphql',
      adminSecret: 'users-secret',
    }),
  ],
  providers: [UserService],
})
export class UserModule {}

// analytics.module.ts
@Module({
  imports: [
    HasuraModule.register({
      endpoint: 'https://analytics-hasura.app/v1/graphql',
      adminSecret: 'analytics-secret',
    }),
  ],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
```

### Direct GraphQL Client Access

The `HasuraService` extends `GraphQLClient` from `graphql-request`, so you can use it directly:

```typescript
// Using the native GraphQLClient request method
const result = await this.hasura.request(query, variables, headers);
```

### TypeScript Type Safety

Define your GraphQL response types:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

interface GetUsersResponse {
  users: User[];
}

const result = await this.hasura
  .requestBuilder()
  .withQuery(query)
  .execute<GetUsersResponse>();

// result.users is now typed as User[]
```

## Testing

### Unit Testing

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { HasuraService } from '@mayademcom/nestjs-hasura';

describe('UserService', () => {
  let service: UserService;
  let hasuraService: HasuraService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: HasuraService,
          useValue: {
            requestBuilder: jest.fn().mockReturnValue({
              withAdminSecret: jest.fn().mockReturnThis(),
              withQuery: jest.fn().mockReturnThis(),
              withVariables: jest.fn().mockReturnThis(),
              execute: jest.fn().mockResolvedValue({ users: [] }),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    hasuraService = module.get<HasuraService>(HasuraService);
  });

  it('should get users', async () => {
    const result = await service.getUsers(10);
    expect(result).toEqual({ users: [] });
  });
});
```

## Environment Variables

Create a `.env` file in your project root:

```env
HASURA_ENDPOINT=https://your-hasura.app/v1/graphql
HASURA_ADMIN_SECRET=your-admin-secret
```

## API Reference

### HasuraService

#### `requestBuilder(): HasuraRequestBuilder`

Creates a new request builder instance.

### HasuraRequestBuilder

#### `withQuery(query: string): HasuraRequestBuilder`

Sets the GraphQL query string.

#### `withQueryFromFile(filePath: string): HasuraRequestBuilder`

Loads and sets the GraphQL query from a `.gql` file.

#### `withVariables(variables: Variables): HasuraRequestBuilder`

Sets the GraphQL query variables.

#### `withAdminSecret(): HasuraRequestBuilder`

Includes the admin secret header from module configuration.

#### `withAuthorizationToken(token: string): HasuraRequestBuilder`

Adds Bearer token authorization header.

#### `withHeaders(headers: Record<string, string>): HasuraRequestBuilder`

Adds custom headers to the request.

#### `execute<T>(): Promise<T>`

Executes the GraphQL request and returns the response.

### Authorization Decorator

#### `@Authorization(options?: AuthorizationOptions)`

Extracts and validates authorization token from request headers.

**Options:**

- `required?: boolean` - Throws error if token is missing (default: `false`)
- `prefix?: string` - Token prefix to remove (default: `'Bearer'`)

## Best Practices

### 1. Use Environment Variables

Never hardcode credentials:

```typescript
HasuraModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    endpoint: config.get('HASURA_ENDPOINT'),
    adminSecret: config.get('HASURA_ADMIN_SECRET'),
  }),
  inject: [ConfigService],
});
```

### 2. Organize Queries in Files

Keep your queries in `.gql` files:

```
src/
├── queries/
│   ├── users/
│   │   ├── get-users.gql
│   │   ├── create-user.gql
│   │   └── update-user.gql
│   └── posts/
│       ├── get-posts.gql
│       └── create-post.gql
```

### 3. Use Type Safety

Define response types for better IDE support:

```typescript
interface GetUsersResponse {
  users: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

const result = await hasura
  .requestBuilder()
  .withQuery(query)
  .execute<GetUsersResponse>();
```

### 4. Handle Errors Properly

```typescript
try {
  const result = await this.hasura
    .requestBuilder()
    .withAdminSecret()
    .withQuery(query)
    .execute();
  return result;
} catch (error) {
  this.logger.error('Hasura query failed', error);
  throw new InternalServerErrorException('Failed to fetch data');
}
```

## How to Release

This package uses [release-it](https://github.com/release-it/release-it) for automated releases. To create a new release:

### Prerequisites

1. Ensure you're on the `main` branch
2. All tests must pass
3. Code quality checks must pass
4. You have npm publish permissions

### Release Process

```bash
# 1. Pull latest changes
git checkout main
git pull origin main

# 2. Run release command (automated versioning)
npm run release
```

The `npm run release` command will:

- Run the tests
- Analyze commits since last release using [Conventional Commits](https://www.conventionalcommits.org/)
- Determine version bump automatically (major/minor/patch)
- Update `package.json` version
- Generate/update `CHANGELOG.md`
- Create git commit and tag
- Push changes and tags to GitHub
- Publish to npm registry

### Manual Version Specification

If you need to manually specify the version:

```bash
# Patch release (1.0.0 -> 1.0.1)
npm run release -- patch

# Minor release (1.0.0 -> 1.1.0)
npm run release -- minor

# Major release (1.0.0 -> 2.0.0)
npm run release -- major

# Specific version
npm run release -- 1.2.3

# Pre-release versions
npm run release -- prepatch --preRelease=beta  # 1.0.0 -> 1.0.1-beta.0
npm run release -- preminor --preRelease=alpha # 1.0.0 -> 1.1.0-alpha.0
```

### Dry Run

Test the release process without actually releasing:

```bash
npm run release -- --dry-run
```

This will show you what would happen without making any changes.

# .github/workflows/release.yml

name: Release

on:
push:
branches: - main

jobs:
release:
runs-on: ubuntu-latest
if: "!contains(github.event.head_commit.message, 'chore(release)')"
steps: - uses: actions/checkout@v3
with:
fetch-depth: 0
token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Release
        run: npm run release -- --ci
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

````

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/) for automatic versioning:

**Version Bumps:**

- `feat:` New feature → **MINOR** version bump (1.0.0 → 1.1.0)
- `fix:` Bug fix → **PATCH** version bump (1.0.0 → 1.0.1)
- `BREAKING CHANGE:` or `feat!:` → **MAJOR** version bump (1.0.0 → 2.0.0)

**No Version Bump:**

- `docs:` Documentation changes
- `chore:` Maintenance tasks
- `test:` Test updates
- `refactor:` Code refactoring
- `style:` Code formatting
- `perf:` Performance improvements

**Examples:**

```bash
# Feature (minor bump: 1.0.0 -> 1.1.0)
git commit -m "feat: add GraphQL subscription support"
git commit -m "feat(builder): add withSubscription() method"

# Bug fix (patch bump: 1.0.0 -> 1.0.1)
git commit -m "fix: resolve cache invalidation issue"
git commit -m "fix(loader): handle missing file gracefully"

# Breaking change (major bump: 1.0.0 -> 2.0.0)
git commit -m "feat!: change requestBuilder API signature"
# or
git commit -m "feat: redesign builder API

BREAKING CHANGE: requestBuilder() now returns a new interface"

# No version bump
git commit -m "docs: update README with examples"
git commit -m "chore: update dependencies"
git commit -m "test: add integration tests"
````

### Configuration

The release configuration is in `.release-it.json`:

```json
{
  "git": {
    "commitMessage": "chore(release): ${version}",
    "tagName": "v${version}",
    "push": true,
    "requireCleanWorkingDir": true,
    "requireUpstream": true
  },
  "npm": {
    "publish": true
  },
  "github": {
    "release": true,
    "releaseName": "Release ${version}"
  },
  "hooks": {
    "before:init": ["npm test"],
    "after:bump": "npm run build"
  },
  "plugins": {
    "@release-it/conventional-changelog": {
      "preset": "angular",
      "infile": "CHANGELOG.md"
    }
  }
}
```

### Troubleshooting

**Authentication Issues:**

```bash
# Login to npm
npm login

# Verify authentication
npm whoami
```

**Git Issues:**

```bash
# Ensure working directory is clean
git status

# Ensure you're on main branch
git checkout main

# Pull latest changes
git pull origin main
```

**Dry Run First:**

```bash
# Always test first
npm run release -- --dry-run
```

This will show you exactly what will happen without making any changes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/mayademcom/nestjs-hasura.git
cd nestjs-hasura

# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Build the package
npm run build

# Lint code
npm run lint
```

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

## License

MIT © [Mayadem](https://github.com/mayademcom)

## Support

- 📫 [Issues](https://github.com/mayademcom/nestjs-hasura/issues)
- 💬 [Discussions](https://github.com/mayademcom/nestjs-hasura/discussions)
- 📖 [Documentation](https://github.com/mayademcom/nestjs-hasura)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

---

Made with ❤️ by [Mayadem](https://github.com/mayademcom)
