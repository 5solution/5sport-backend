import { Role } from '../enums/role.enum';

/** Shape returned by JwtStrategy.validate() and injected by @CurrentUser() */
export interface RequestUser {
  id: string;
  email: string;
  role: Role;
  tags: string[];
  googleId: string;
  displayName: string;
  avatarUrl: string;
  created_at: Date;
  updated_at: Date;
}
