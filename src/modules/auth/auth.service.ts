import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { Role } from 'src/common/enums/role.enum';
import { Repository } from 'typeorm';

import { BotService } from '../bot/bot.service';
import { User } from '../user/user.entity';

import { GoogleTokenDto } from './dto/google-token.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly botService: BotService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  private async notifyNewUserRegistration(
    user: User,
    registrationMethod: 'email' | 'google',
  ): Promise<void> {
    const message =
      registrationMethod === 'email'
        ? this.buildEmailRegistrationMessage(user)
        : this.buildGoogleRegistrationMessage(user);

    try {
      await this.botService.sendToTargetGroup(message);
    } catch (error) {
      console.error('Failed to send Telegram notification:', error);
    }
  }

  private buildEmailRegistrationMessage(user: User): string {
    return `
🆕 New User Registered!
━━━━━━━━━━━━━━━━━━━━
📧 Email: ${user.email}
👤 Display Name: ${user.displayName}
🎭 Role: ${user.role}
🏷️ Tags: ${user.tags.join(', ') || 'None'}
🕐 Registered: ${new Date().toISOString()}
    `.trim();
  }

  private buildGoogleRegistrationMessage(user: User): string {
    return `
🆕 New User via Google Auth!
━━━━━━━━━━━━━━━━━━━━
📧 Email: ${user.email}
👤 Display Name: ${user.displayName}
🎭 Role: ${user.role}
🖼️ Avatar: ${user.avatarUrl || 'None'}
🕐 Registered: ${new Date().toISOString()}
    `.trim();
  }

  private mapUserToResponse(user: User) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      tags: user.tags,
      avatarUrl: user.avatarUrl,
    };
  }

  private async createUser(userData: {
    email: string;
    password?: string;
    displayName: string;
    tags?: string[];
    googleId?: string;
    avatarUrl?: string;
  }): Promise<User> {
    const user = this.userRepository.create({
      ...userData,
      role: Role.USER,
      tags: userData.tags || [],
    });
    return await this.userRepository.save(user);
  }

  private async updateUserWithGoogleData(
    user: User,
    googleData: {
      googleId: string;
      displayName: string;
      avatarUrl: string;
      email?: string;
    },
  ): Promise<User> {
    user.googleId = googleData.googleId;
    user.displayName = googleData.displayName;
    user.avatarUrl = googleData.avatarUrl;
    if (googleData.email) {
      user.email = googleData.email;
    }
    return await this.userRepository.save(user);
  }

  async register(registerDto: RegisterDto) {
    const { email, password, displayName, tags } = registerDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.createUser({
      email,
      password: hashedPassword,
      displayName,
      tags,
    });

    await this.notifyNewUserRegistration(user, 'email');

    const token = this.generateToken(user);

    return {
      user: this.mapUserToResponse(user),
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user);

    return {
      user: this.mapUserToResponse(user),
      token,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (user && user.password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        const { password: _password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async findOrCreateGoogleUser(profile: any) {
    const { id: googleId, emails, displayName, photos } = profile;
    const email = emails?.[0]?.value;
    const avatarUrl = photos?.[0]?.value;

    let user = await this.userRepository.findOne({
      where: { googleId },
    });

    if (!user && email) {
      user = await this.userRepository.findOne({
        where: { email },
      });

      if (user) {
        await this.updateUserWithGoogleData(user, {
          googleId,
          displayName,
          avatarUrl,
        });
      }
    }

    if (!user) {
      user = await this.createUser({
        googleId,
        email,
        displayName,
        avatarUrl,
      });

      await this.notifyNewUserRegistration(user, 'google');
    }

    return user;
  }

  async authenticateWithGoogle(googleTokenDto: GoogleTokenDto) {
    const { idToken } = googleTokenDto;

    try {
      const payload = await this.verifyGoogleToken(idToken);
      const user = await this.findOrCreateGoogleUserFromPayload(payload);
      const token = this.generateToken(user);

      return {
        user: this.mapUserToResponse(user),
        token,
      };
    } catch (error) {
      throw new UnauthorizedException(
        'Failed to verify Google token: ' + error.message,
      );
    }
  }

  private async verifyGoogleToken(idToken: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new UnauthorizedException('Invalid Google token');
    }

    return payload;
  }

  private async findOrCreateGoogleUserFromPayload(payload: any): Promise<User> {
    const googleId = payload.sub;
    const email = payload.email;
    const displayName = payload.name;
    const avatarUrl = payload.picture;

    let user = await this.userRepository.findOne({
      where: { googleId },
    });

    if (!user && email) {
      user = await this.userRepository.findOne({
        where: { email },
      });

      if (user) {
        await this.updateUserWithGoogleData(user, {
          googleId,
          displayName,
          avatarUrl,
          email,
        });
        return user;
      }
    }

    if (!user) {
      user = await this.createUser({
        googleId,
        email,
        displayName,
        avatarUrl,
      });

      await this.notifyNewUserRegistration(user, 'google');
    }

    return user;
  }

  generateToken(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  async validateUserById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    const { password: _password, ...result } = user;
    return result;
  }
}
