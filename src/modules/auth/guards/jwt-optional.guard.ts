import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard but does NOT reject unauthenticated requests.
 * If a valid JWT is present → req.user is populated.
 * If no token or invalid token → req.user is undefined, request continues.
 */
@Injectable()
export class JwtOptionalGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(_err: any, user: any) {
    // Don't throw on missing/invalid token — just return null
    return user || null;
  }
}
