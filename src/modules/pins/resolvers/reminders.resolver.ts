import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
  ID,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { RemindersService } from '../services/reminders.service';
import { Reminder } from '../entities/reminder.entity';
import { CreateReminderInput, UpdateReminderInput } from '../dto';
import { Pin } from '../entities/pin.entity';

@Resolver(() => Reminder)
@UseGuards(GqlAuthGuard)
export class RemindersResolver {
  constructor(private readonly remindersService: RemindersService) {}

  @Mutation(() => Reminder)
  async createReminder(
    @Args('input') createReminderInput: CreateReminderInput,
    @CurrentUser() user: User,
  ): Promise<Reminder> {
    return this.remindersService.createReminder(createReminderInput, user.id);
  }

  @Mutation(() => Reminder)
  async updateReminder(
    @Args('input') updateReminderInput: UpdateReminderInput,
    @CurrentUser() user: User,
  ): Promise<Reminder> {
    return this.remindersService.updateReminder(updateReminderInput, user.id);
  }

  @Mutation(() => Boolean)
  async deleteReminder(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.remindersService.deleteReminder(id, user.id);
  }

  @Mutation(() => Reminder)
  async markReminderAsCompleted(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<Reminder> {
    return this.remindersService.markReminderAsCompleted(id, user.id);
  }

  @Query(() => [Reminder])
  async remindersByPlant(
    @Args('plantId', { type: () => ID }) plantId: string,
    @CurrentUser() user: User,
  ): Promise<Reminder[]> {
    return this.remindersService.findRemindersByPlant(plantId, user.id);
  }

  @Query(() => [Reminder])
  async activeRemindersForUser(@CurrentUser() user: User): Promise<Reminder[]> {
    return this.remindersService.findActiveRemindersForUser(user.id);
  }

  @Query(() => [Reminder])
  async overdueRemindersForUser(
    @CurrentUser() user: User,
  ): Promise<Reminder[]> {
    return this.remindersService.findOverdueRemindersForUser(user.id);
  }

  @Mutation(() => Reminder)
  async createQuickReminder(
    @Args('plantId', { type: () => ID }) plantId: string,
    @Args('type') type: 'weekly' | 'monthly' | 'yearly' | 'photo',
    @CurrentUser() user: User,
  ): Promise<Reminder> {
    return this.remindersService.createQuickReminder(plantId, user.id, type);
  }

  @ResolveField(() => Pin)
  plant(@Parent() reminder: Reminder): Pin {
    // Return the plant relation that should already be loaded
    return reminder.plant;
  }
}
