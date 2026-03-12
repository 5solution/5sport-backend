import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentCourt = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const court = request.user;

    if (!court) {
      return null;
    }

    return data ? court[data] : court;
  },
);
