import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../modules/users/users.module';

@Module({
  imports: [PassportModule, UsersModule],
  providers: [JwtStrategy],
  exports: [PassportModule],
})
export class AuthModule {} 