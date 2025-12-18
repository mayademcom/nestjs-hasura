import { DynamicModule, Module } from '@nestjs/common';
import { HasuraAsyncConfig, HasuraConfig } from './models';

import { GraphQLLoaderService } from './graphql-loader/graphql-loader.service';
import { HasuraService } from './hasura.service';

@Module({})
export class HasuraModule {
  /**
   * Register Hasura module with module scope (not global).
   * Each module that imports this will have its own HasuraService instance.
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     HasuraModule.register({
   *       endpoint: 'https://user-hasura.app/v1/graphql',
   *       adminSecret: 'user-secret',
   *     }),
   *   ],
   * })
   * export class UserModule {}
   * ```
   */
  static register(config: HasuraConfig): DynamicModule {
    return {
      module: HasuraModule,
      global: false,
      providers: [
        GraphQLLoaderService,
        HasuraService,
        {
          provide: 'HASURA_CONFIG',
          useValue: config,
        },
      ],
      exports: [HasuraService],
    };
  }

  /**
   * Register Hasura module asynchronously with module scope.
   * Useful when configuration depends on other providers like ConfigService.
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     HasuraModule.registerAsync({
   *       imports: [ConfigModule],
   *       useFactory: (config: ConfigService) => ({
   *         endpoint: config.get('USER_HASURA_ENDPOINT'),
   *         adminSecret: config.get('USER_HASURA_SECRET'),
   *       }),
   *       inject: [ConfigService],
   *     }),
   *   ],
   * })
   * export class UserModule {}
   * ```
   */
  static registerAsync(config: HasuraAsyncConfig): DynamicModule {
    return {
      module: HasuraModule,
      global: false,
      imports: config.imports,
      providers: [
        GraphQLLoaderService,
        HasuraService,
        {
          provide: 'HASURA_CONFIG',
          useFactory: config.useFactory,
          inject: config.inject,
        },
      ],
      exports: [HasuraService],
    };
  }

  /**
   * Register Hasura module globally (singleton).
   * HasuraService will be available in all modules without re-importing.
   * Use this when you have a single Hasura instance for the entire application.
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     HasuraModule.forRoot({
   *       endpoint: 'https://hasura.app/v1/graphql',
   *       adminSecret: 'my-secret',
   *     }),
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  static forRoot(config: HasuraConfig): DynamicModule {
    return {
      ...this.register(config),
      global: true,
    };
  }

  /**
   * Register Hasura module globally with async configuration.
   * Best practice for production applications using environment variables.
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     ConfigModule.forRoot({ isGlobal: true }),
   *     HasuraModule.forRootAsync({
   *       imports: [ConfigModule],
   *       useFactory: (config: ConfigService) => ({
   *         endpoint: config.get('HASURA_ENDPOINT'),
   *         adminSecret: config.get('HASURA_ADMIN_SECRET'),
   *       }),
   *       inject: [ConfigService],
   *     }),
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  static forRootAsync(config: HasuraAsyncConfig): DynamicModule {
    return {
      ...this.registerAsync(config),
      global: true,
    };
  }
}
