// decorators/authorization.decorator.ts

import {
  ExecutionContext,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';

import { AuthorizationOptions } from '../models';

/**
 * Extract authorization token from request headers
 * @example
 * // Required token (throws if missing)
 * async webhook(@Authorization({ required: true }) token: string) {}
 *
 * // Optional token
 * async webhook(@Authorization() token: string | null) {}
 *
 * // Custom prefix
 * async webhook(@Authorization({ prefix: 'Token' }) token: string) {}
 */
export const Authorization = createParamDecorator(
  (
    data: AuthorizationOptions | undefined,
    ctx: ExecutionContext,
  ): string | null => {
    const { required = false, prefix = 'Bearer' } = data || {};

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = ctx.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const authHeader = request.headers.authorization as string;
    if (required && !authHeader)
      throw new UnauthorizedException('Authorization header is required');

    if (authHeader) return parseToken(authHeader, prefix);

    return null;
  },
);

function addSpaceToPrefix(prefix: string) {
  return `${prefix} `;
}

function parseToken(authHeader: string, prefix?: string) {
  if (prefix) {
    prefix = addSpaceToPrefix(prefix);
    if (authHeader.startsWith(prefix))
      return authHeader.substring(prefix.length);
  }
  return authHeader;
}
