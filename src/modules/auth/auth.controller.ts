import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  ApiSuccessResponse,
  ApiCreatedSuccessResponse,
} from 'src/common/decorators/api-success-response.decorator';
import { Response } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { User } from '../user/user.entity';

import { AuthService } from './auth.service';
import {
  AuthResponseDto,
  ErrorResponseDto,
  UserResponseDto,
} from './dto/auth-response.dto';
import { GoogleTokenDto } from './dto/google-token.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Create a new user account with email and password',
  })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedSuccessResponse(AuthResponseDto, {
    description: 'User successfully registered',
  })
  @ApiBadRequestResponse({
    description:
      'Validation error - invalid email format or password too short',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Email already registered',
    type: ErrorResponseDto,
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login with email and password',
    description: 'Authenticate user and return JWT token',
  })
  @ApiBody({ type: LoginDto })
  @ApiSuccessResponse(AuthResponseDto, {
    description: 'User successfully authenticated',
  })
  @ApiBadRequestResponse({
    description: 'Validation error - invalid email format',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
    type: ErrorResponseDto,
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('google/authenticate')
  @ApiOperation({
    summary: 'Authenticate with Google',
    description: 'Verify Google ID token and return JWT token',
  })
  @ApiBody({ type: GoogleTokenDto })
  @ApiSuccessResponse(AuthResponseDto, {
    description: 'Google token verified and JWT issued',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired Google ID token',
    type: ErrorResponseDto,
  })
  async googleAuthenticate(@Body() googleTokenDto: GoogleTokenDto) {
    return this.authService.authenticateWithGoogle(googleTokenDto);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Initiate Google OAuth flow',
    description:
      'Redirect to Google OAuth consent page (traditional OAuth flow)',
  })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth callback',
    description: 'Handle Google OAuth callback and redirect with JWT token',
  })
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const user = req.user;
    const token = this.authService.generateToken(user);
    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/success?token=${token}`,
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout user',
    description: 'Logout the authenticated user and invalidate the session',
  })
  @ApiSuccessResponse(null, {
    description: 'User successfully logged out',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logged out successfully' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
    type: ErrorResponseDto,
  })
  logout(@CurrentUser() _user: User) {
    // For JWT-based auth, the actual token invalidation happens client-side
    // This endpoint can be used for logging/auditing purposes
    // Future: implement token blacklisting if needed
    return { message: 'Logged out successfully' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Return the authenticated user profile from JWT token',
  })
  @ApiSuccessResponse(UserResponseDto, {
    description: 'User profile retrieved successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
    type: ErrorResponseDto,
  })
  getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Get('admin/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Admin only endpoint example',
    description: 'This endpoint is only accessible by users with admin role',
  })
  @ApiSuccessResponse(null, {
    description: 'Admin access granted',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Admin access granted' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'User does not have admin role',
    type: ErrorResponseDto,
  })
  adminOnly() {
    return { message: 'Admin access granted' };
  }

  @Get('organizer/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Organizer dashboard endpoint',
    description: 'Accessible by organizers and admins',
  })
  @ApiSuccessResponse(null, {
    description: 'Organizer access granted',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Organizer access granted' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'User does not have organizer or admin role',
    type: ErrorResponseDto,
  })
  organizerDashboard() {
    return { message: 'Organizer access granted' };
  }
}
