// hasura.module.spec.ts

import { Test, TestingModule } from '@nestjs/testing';

import Chance from 'chance';
import { HasuraModule } from './hasura.module';
import { HasuraService } from './hasura.service';

const chance = new Chance();

describe('HasuraModule', () => {
  describe('register', () => {
    it('should create module with HasuraService', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          HasuraModule.register({
            endpoint: chance.url(),
            adminSecret: chance.string(),
          }),
        ],
      }).compile();

      const service = module.get<HasuraService>(HasuraService);
      expect(service).toBeDefined();
    });

    it('should not be global', () => {
      const dynamicModule = HasuraModule.register({
        endpoint: chance.url(),
      });

      expect(dynamicModule.global).toBe(false);
    });
  });

  describe('registerAsync', () => {
    it('should create module with async config', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          HasuraModule.registerAsync({
            useFactory: () => ({
              endpoint: chance.url(),
              adminSecret: chance.string(),
            }),
          }),
        ],
      }).compile();

      const service = module.get<HasuraService>(HasuraService);
      expect(service).toBeDefined();
    });

    it('should not be global', () => {
      const dynamicModule = HasuraModule.registerAsync({
        useFactory: () => ({
          endpoint: chance.url(),
        }),
      });

      expect(dynamicModule.global).toBe(false);
    });
  });

  describe('forRoot', () => {
    it('should create global module with HasuraService', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          HasuraModule.forRoot({
            endpoint: chance.url(),
            adminSecret: chance.string(),
          }),
        ],
      }).compile();

      const service = module.get<HasuraService>(HasuraService);
      expect(service).toBeDefined();
    });

    it('should be global', () => {
      const dynamicModule = HasuraModule.forRoot({
        endpoint: chance.url(),
      });

      expect(dynamicModule.global).toBe(true);
    });
  });

  describe('forRootAsync', () => {
    it('should create global module with async config', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          HasuraModule.forRootAsync({
            useFactory: () => ({
              endpoint: chance.url(),
              adminSecret: chance.string(),
            }),
          }),
        ],
      }).compile();

      const service = module.get<HasuraService>(HasuraService);
      expect(service).toBeDefined();
    });

    it('should be global', () => {
      const dynamicModule = HasuraModule.forRootAsync({
        useFactory: () => ({
          endpoint: chance.url(),
        }),
      });

      expect(dynamicModule.global).toBe(true);
    });
  });
});
