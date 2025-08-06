import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/modules/users/services/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    ) {
    const secret = configService.get<string>('SUPABASE_JWT_SECRET');
    console.log('🔐 JWT Strategy - SUPABASE_JWT_SECRET loaded:', secret ? 'YES' : 'NO');
    console.log('🔐 JWT Strategy - Secret length:', secret?.length || 0);
    console.log('🔐 JWT Strategy - Secret preview:', secret ? `${secret.substring(0, 10)}...` : 'N/A');
    
    if (!secret) {
      throw new Error('SUPABASE_JWT_SECRET is not defined in environment variables');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    console.log('🔐 JWT Strategy - Token payload received:', JSON.stringify(payload, null, 2));
    
    if (!payload.sub) {
      console.error('🔐 JWT Strategy - Missing sub in payload');
      throw new UnauthorizedException('Invalid token payload');
    }

    console.log('🔐 JWT Strategy - Creating/finding user with sub:', payload.sub);
    const user = await this.usersService.findOrCreate(
      payload.sub,
      payload.email,
      payload.user_metadata?.name || payload.email,
    );

    console.log('🔐 JWT Strategy - User validated successfully:', user.id);
    return user;
  }
} 