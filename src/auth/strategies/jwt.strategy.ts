import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/modules/users/services/users.service';
import { databaseConfig } from '../../config/database.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    // Try to get from environment variables first, then fall back to config
    const secret = configService.get<string>('SUPABASE_JWT_SECRET') || databaseConfig.SUPABASE_JWT_SECRET;
    
    console.log(
      '🔐 JWT Strategy - SUPABASE_JWT_SECRET loaded:',
      secret ? 'YES' : 'NO',
    );
    console.log('🔐 JWT Strategy - Secret length:', secret?.length || 0);
    console.log(
      '🔐 JWT Strategy - Secret preview:',
      secret ? `${secret.substring(0, 10)}...` : 'N/A',
    );

    if (!secret) {
      throw new Error(
        'SUPABASE_JWT_SECRET not found in environment variables or config',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    console.log(
      '🔐 JWT Strategy - Token payload received:',
      JSON.stringify(payload, null, 2),
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!payload.sub) {
      console.error('🔐 JWT Strategy - Missing sub in payload');
      throw new UnauthorizedException('Invalid token payload');
    }

    console.log(
      '🔐 JWT Strategy - Creating/finding user with sub:',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      payload.sub,
    );
    const user = await this.usersService.findOrCreate(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      payload.sub,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      payload.email,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-member-access
      payload.user_metadata?.name || payload.email,
    );

    console.log('🔐 JWT Strategy - User validated successfully:', user.id);
    return user;
  }
}
