import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Reminder,
  ReminderStatus,
  NotificationType,
  RecurringPattern,
} from '../entities/reminder.entity';
import { CreateReminderInput, UpdateReminderInput } from '../dto';
import { Pin } from '../entities/pin.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(Reminder)
    private remindersRepository: Repository<Reminder>,
    @InjectRepository(Pin)
    private pinsRepository: Repository<Pin>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createReminder(
    createReminderInput: CreateReminderInput,
    userId: string,
  ): Promise<Reminder> {
    // Check if the plant exists and user has access
    const plant = await this.pinsRepository.findOne({
      where: { id: createReminderInput.plantId, isActive: true },
      relations: ['project'],
    });

    if (!plant) {
      throw new NotFoundException('Plant not found');
    }

    // Check if user has access to the project
    // This would need to be implemented based on your project access logic
    // For now, we'll assume the user has access if they can see the plant

    const reminder = this.remindersRepository.create({
      ...createReminderInput,
      createdById: userId,
      dueDate: new Date(createReminderInput.dueDate),
      isRecurring: createReminderInput.isRecurring || false,
      recurringPattern:
        createReminderInput.recurringPattern || RecurringPattern.NONE,
    });

    return this.remindersRepository.save(reminder);
  }

  async updateReminder(
    updateReminderInput: UpdateReminderInput,
    userId: string,
  ): Promise<Reminder> {
    const reminder = await this.remindersRepository.findOne({
      where: { id: updateReminderInput.id },
      relations: ['plantId'],
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    // Check if user owns the reminder or has access to the plant
    if (reminder.createdById !== userId) {
      throw new ForbiddenException('Access denied to this reminder');
    }

    // Update the reminder
    Object.assign(reminder, updateReminderInput);

    // Handle date conversion if dueDate is provided
    if (updateReminderInput.dueDate) {
      reminder.dueDate = new Date(updateReminderInput.dueDate);
    }

    // Handle completedAt conversion if provided
    if (updateReminderInput.completedAt) {
      reminder.completedAt = new Date(updateReminderInput.completedAt);
    }

    return this.remindersRepository.save(reminder);
  }

  async deleteReminder(id: string, userId: string): Promise<boolean> {
    const reminder = await this.remindersRepository.findOne({
      where: { id },
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    // Check if user owns the reminder
    if (reminder.createdById !== userId) {
      throw new ForbiddenException('Access denied to this reminder');
    }

    await this.remindersRepository.remove(reminder);
    return true;
  }

  async findRemindersByPlant(
    plantId: string,
    userId: string,
  ): Promise<Reminder[]> {
    // Check if user has access to the plant
    const plant = await this.pinsRepository.findOne({
      where: { id: plantId, isActive: true },
    });

    if (!plant) {
      throw new NotFoundException('Plant not found');
    }

    return this.remindersRepository.find({
      where: { plantId, createdById: userId },
      order: { dueDate: 'ASC' },
    });
  }

  async findActiveRemindersForUser(userId: string): Promise<Reminder[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.remindersRepository.find({
      where: {
        createdById: userId,
        status: ReminderStatus.ACTIVE,
        dueDate: today,
      },
      relations: ['plantId'],
      order: { dueDate: 'ASC' },
    });
  }

  async findOverdueRemindersForUser(userId: string): Promise<Reminder[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.remindersRepository.find({
      where: {
        createdById: userId,
        status: ReminderStatus.ACTIVE,
        dueDate: today,
      },
      relations: ['plantId'],
      order: { dueDate: 'ASC' },
    });
  }

  async markReminderAsCompleted(id: string, userId: string): Promise<Reminder> {
    const reminder = await this.remindersRepository.findOne({
      where: { id },
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    if (reminder.createdById !== userId) {
      throw new ForbiddenException('Access denied to this reminder');
    }

    reminder.status = ReminderStatus.COMPLETED;
    reminder.completedAt = new Date();

    // If it's a recurring reminder, create the next one
    if (
      reminder.isRecurring &&
      reminder.recurringPattern !== RecurringPattern.NONE
    ) {
      await this.createNextRecurringReminder(reminder);
    }

    return this.remindersRepository.save(reminder);
  }

  private async createNextRecurringReminder(reminder: Reminder): Promise<void> {
    const nextDueDate = new Date(reminder.dueDate);

    switch (reminder.recurringPattern) {
      case RecurringPattern.WEEKLY:
        nextDueDate.setDate(nextDueDate.getDate() + 7);
        break;
      case RecurringPattern.MONTHLY:
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        break;
      case RecurringPattern.YEARLY:
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        break;
      default:
        return;
    }

    const nextReminder = this.remindersRepository.create({
      title: reminder.title,
      description: reminder.description,
      dueDate: nextDueDate,
      dueTime: reminder.dueTime,
      notificationType: reminder.notificationType,
      recurringPattern: reminder.recurringPattern,
      isRecurring: reminder.isRecurring,
      plantId: reminder.plantId,
      createdById: reminder.createdById,
    });

    await this.remindersRepository.save(nextReminder);
  }

  async createQuickReminder(
    plantId: string,
    userId: string,
    type: 'weekly' | 'monthly' | 'yearly' | 'photo',
  ): Promise<Reminder> {
    const today = new Date();
    const dueDate = new Date();
    let title = '';
    let notificationType = NotificationType.WARNING;

    switch (type) {
      case 'weekly':
        dueDate.setDate(today.getDate() + 7);
        title = 'Water plant';
        break;
      case 'monthly':
        dueDate.setMonth(today.getMonth() + 1);
        title = 'Fertilize';
        break;
      case 'yearly':
        dueDate.setFullYear(today.getFullYear() + 1);
        title = 'Prune';
        break;
      case 'photo':
        dueDate.setFullYear(today.getFullYear() + 1);
        title = 'Update plant photo';
        notificationType = NotificationType.GENERAL;
        break;
    }

    const reminder = this.remindersRepository.create({
      title,
      dueDate,
      notificationType,
      plantId,
      createdById: userId,
      isRecurring: true,
      recurringPattern:
        type === 'photo'
          ? RecurringPattern.YEARLY
          : type === 'weekly'
            ? RecurringPattern.WEEKLY
            : type === 'monthly'
              ? RecurringPattern.MONTHLY
              : RecurringPattern.YEARLY,
    });

    return this.remindersRepository.save(reminder);
  }
}
