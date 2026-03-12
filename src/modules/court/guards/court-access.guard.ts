import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CourtAccessGuard extends AuthGuard('court-jwt') {}
