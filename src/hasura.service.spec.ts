import { Test, TestingModule } from '@nestjs/testing';

import Chance from 'chance';
import { HasuraConfig } from './dto/hasura-config.dto';
import { HasuraService } from './hasura.service';

const chance = new Chance();
describe('HasuraService', () => {
  let service: HasuraService;

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
      ],
    }).compile();

    service = module.get<HasuraService>(HasuraService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have correct endpoint', () => {
    const client = service as unknown as { url: string };
    expect(client.url).toBe(mockConfig.endpoint);
  });

  it('can send a request', async () => {
    jest.spyOn(service, 'request').mockResolvedValue(true);

    const response: boolean = await service.request('query', {});

    expect(response).toBe(true);
  });
});
