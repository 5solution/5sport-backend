import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { Repository } from 'typeorm';

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
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async register(registerDto: RegisterDto) {
    const { username, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
    });

    await this.userRepository.save(user);

    // Generate token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        username: user.username,
      },
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
    };
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { username },
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

    // Try to find existing user by googleId
    let user = await this.userRepository.findOne({
      where: { googleId },
    });

    if (!user && email) {
      // Try to find by email
      user = await this.userRepository.findOne({
        where: { email },
      });

      if (user) {
        // Update existing user with Google ID
        user.googleId = googleId;
        user.displayName = displayName;
        user.avatarUrl = avatarUrl;
        await this.userRepository.save(user);
      }
    }

    if (!user) {
      // Create new user
      user = this.userRepository.create({
        googleId,
        email,
        displayName,
        avatarUrl,
      });
      await this.userRepository.save(user);
    }

    return user;
  }

  async authenticateWithGoogle(googleTokenDto: GoogleTokenDto) {
    const { idToken } = googleTokenDto;

    try {
      // Verify the Google ID token
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const googleId = payload.sub;
      const email = payload.email;
      const displayName = payload.name;
      const avatarUrl = payload.picture;

      // Try to find existing user by googleId
      let user = await this.userRepository.findOne({
        where: { googleId },
      });

      if (!user && email) {
        // Try to find by email
        user = await this.userRepository.findOne({
          where: { email },
        });

        if (user) {
          // Update existing user with Google ID
          user.googleId = googleId;
          user.displayName = displayName;
          user.avatarUrl = avatarUrl;
          user.email = email;
          await this.userRepository.save(user);
        }
      }

      if (!user) {
        // Create new user
        user = this.userRepository.create({
          googleId,
          email,
          displayName,
          avatarUrl,
        });
        await this.userRepository.save(user);
      }

      // Generate JWT token
      const token = this.generateToken(user);

      return {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          username: user.username,
        },
        token,
      };
    } catch (error) {
      throw new UnauthorizedException(
        'Failed to verify Google token: ' + error.message,
      );
    }
  }

  generateToken(user: User) {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
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
