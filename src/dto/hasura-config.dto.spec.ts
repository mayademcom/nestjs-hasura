import { HasuraConfig } from './hasura-config.dto';

describe('HasuraConfig', () => {
  it('should be defined', () => {
    expect(new HasuraConfig()).toBeDefined();
  });
});
