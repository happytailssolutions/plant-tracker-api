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
  async me(@CurrentUser() user: any): Promise<User> {
    // The user should already be created by the JwtStrategy, so we can just return it.
    // If not, we can find it by its ID.
    return this.usersService.findById(user.id);
  }
} 