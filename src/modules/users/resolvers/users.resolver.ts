import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { UsersService } from '../services/users.service';
import { User } from '../entities/user.entity';

@Resolver(() => User)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() user: User): Promise<User> {
    // The user object is injected by the GqlAuthGuard after being processed
    // by the JwtStrategy (which finds or creates the user).
    // We can simply return the user object directly.
    return user;
  }
} 