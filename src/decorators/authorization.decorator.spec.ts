import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { Authorization } from './authorization.decorator';
import Chance from 'chance';
import { AuthorizationOptions } from '../models';

interface ParamMetadata {
  index: number;
  factory: (data: any, ctx: ExecutionContext) => string | null;
}
describe('Authorization Decorator', () => {
  const chance = new Chance();

  function getParamDecoratorFactory(options?: AuthorizationOptions) {
    class TestController {
      public getDecoratorValue(@Authorization(options) value: string) {
        return value;
      }
    }

    const args = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      TestController,
      'getDecoratorValue',
    ) as Record<string, ParamMetadata>;

    return args[Object.keys(args)[0]].factory;
  }

  let mockExecutionContext: ExecutionContext;

  beforeEach(() => {
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
      }),
    } as unknown as ExecutionContext;
  });

  it('should extract token with Bearer prefix', () => {
    const token = chance.string({ length: 20 });
    const mockRequest = {
      headers: { authorization: `Bearer ${token}` },
    };

    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue(mockRequest);

    const factory = getParamDecoratorFactory();
    const actualToken = factory(undefined, mockExecutionContext);

    expect(actualToken).toBe(token);
  });

  it('should return null when no authorization header', () => {
    const mockRequest = { headers: {} };

    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue(mockRequest);

    const factory = getParamDecoratorFactory();
    const actualToken = factory(undefined, mockExecutionContext);

    expect(actualToken).toBeNull();
  });

  it('should extract token without prefix', () => {
    const token = chance.string({ length: 20 });
    const mockRequest = {
      headers: { authorization: token },
    };

    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue(mockRequest);

    const factory = getParamDecoratorFactory();
    const actualToken = factory(undefined, mockExecutionContext);

    expect(actualToken).toBe(token);
  });

  it('should throw when required and missing', () => {
    const mockRequest = { headers: {} };

    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue(mockRequest);

    const factory = getParamDecoratorFactory({ required: true });

    expect(() => factory({ required: true }, mockExecutionContext)).toThrow(
      UnauthorizedException,
    );
  });

  it('should handle custom prefix', () => {
    const token = chance.string({ length: 20 });
    const mockRequest = {
      headers: { authorization: `Token ${token}` },
    };

    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue(mockRequest);

    const factory = getParamDecoratorFactory({
      prefix: 'Token',
    });
    const actualToken = factory({ prefix: 'Token' }, mockExecutionContext);

    expect(actualToken).toBe(token);
  });

  it('should return token as-is when no prefix matches', () => {
    const token = chance.string({ length: 20 });
    const mockRequest = {
      headers: { authorization: `CustomPrefix ${token}` },
    };

    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue(mockRequest);

    const factory = getParamDecoratorFactory();
    const actualToken = factory(undefined, mockExecutionContext);

    expect(actualToken).toBe(`CustomPrefix ${token}`);
  });

  it('should handle empty prefix option', () => {
    const token = chance.string({ length: 20 });
    const mockRequest = {
      headers: { authorization: token },
    };

    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue(mockRequest);

    const factory = getParamDecoratorFactory({ prefix: '' });
    const actualToken = factory({ prefix: '' }, mockExecutionContext);

    expect(actualToken).toBe(token);
  });

  it('should return empty when prefix matches but token part is empty', () => {
    const mockRequest = {
      headers: { authorization: 'Bearer' },
    };

    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue(mockRequest);

    const factory = getParamDecoratorFactory();
    const actualToken = factory(undefined, mockExecutionContext);

    expect(actualToken).toBe('');
  });
});
