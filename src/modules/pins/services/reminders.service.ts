import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Reminder,
  NotificationType,
  ReminderStatus,
  RecurringPattern,
} from '../entities/reminder.entity';
import { Pin } from '../entities/pin.entity';
import { CreateReminderInput, UpdateReminderInput } from '../dto';

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(Reminder)
    private remindersRepository: Repository<Reminder>,
    @InjectRepository(Pin)
    private pinsRepository: Repository<Pin>,
  ) {}

  async createReminder(
    input: CreateReminderInput,
    userId: string,
  ): Promise<Reminder> {
    // Verify that the plant belongs to the user
    const plant = await this.pinsRepository.findOne({
      where: { id: input.plantId, createdById: userId },
    });

    if (!plant) {
      throw new NotFoundException(
        'Plant not found or you do not have permission to access it',
      );
    }

    // Ensure proper date handling - convert string to Date object
    const dueDate = new Date(input.dueDate);
    if (isNaN(dueDate.getTime())) {
      throw new Error('Invalid due date format');
    }

    const reminder = this.remindersRepository.create({
      ...input,
      dueDate: dueDate,
    });

    return this.remindersRepository.save(reminder);
  }

  async updateReminder(
    input: UpdateReminderInput,
    userId: string,
  ): Promise<Reminder> {
    const reminder = await this.remindersRepository.findOne({
      where: { id: input.id },
      relations: ['plant'],
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    if (reminder.plant.createdById !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this reminder',
      );
    }

    // Update the reminder with new data
    const updateData: Partial<Omit<UpdateReminderInput, 'id'>> & {
      updatedAt?: Date;
    } = { ...input };

    if (input.dueDate) {
      const dueDate = new Date(input.dueDate);
      if (isNaN(dueDate.getTime())) {
        throw new Error('Invalid due date format');
      }
      // Convert the string dueDate to Date for the entity
      (updateData as any).dueDate = dueDate;
    }

    updateData.updatedAt = new Date();

    Object.assign(reminder, updateData);

    return this.remindersRepository.save(reminder);
  }

  async deleteReminder(id: string, userId: string): Promise<boolean> {
    const reminder = await this.remindersRepository.findOne({
      where: { id },
      relations: ['plant'],
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    if (reminder.plant.createdById !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this reminder',
      );
    }

    await this.remindersRepository.remove(reminder);
    return true;
  }

  async markReminderAsCompleted(id: string, userId: string): Promise<Reminder> {
    const reminder = await this.remindersRepository.findOne({
      where: { id },
      relations: ['plant'],
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    if (reminder.plant.createdById !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this reminder',
      );
    }

    reminder.status = ReminderStatus.COMPLETED;
    reminder.completedAt = new Date();
    reminder.updatedAt = new Date();

    return this.remindersRepository.save(reminder);
  }

  async findRemindersByPlant(
    plantId: string,
    userId: string,
  ): Promise<Reminder[]> {
    // Verify that the plant belongs to the user
    const plant = await this.pinsRepository.findOne({
      where: { id: plantId, createdById: userId },
    });

    if (!plant) {
      throw new NotFoundException(
        'Plant not found or you do not have permission to access it',
      );
    }

    return this.remindersRepository.find({
      where: { plantId },
      relations: ['plant'],
      order: { dueDate: 'ASC' },
    });
  }

  async findActiveRemindersForUser(userId: string): Promise<Reminder[]> {
    return this.remindersRepository
      .createQueryBuilder('reminder')
      .leftJoinAndSelect('reminder.plant', 'plant')
      .where('plant.createdById = :userId', { userId })
      .andWhere('reminder.status = :status', { status: ReminderStatus.ACTIVE })
      .orderBy('reminder.dueDate', 'ASC')
      .getMany();
  }

  async findOverdueRemindersForUser(userId: string): Promise<Reminder[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.remindersRepository
      .createQueryBuilder('reminder')
      .leftJoinAndSelect('reminder.plant', 'plant')
      .where('plant.createdById = :userId', { userId })
      .andWhere('reminder.status = :status', { status: ReminderStatus.ACTIVE })
      .andWhere('reminder.dueDate < :today', { today })
      .orderBy('reminder.dueDate', 'ASC')
      .getMany();
  }

  async createQuickReminder(
    plantId: string,
    userId: string,
    type: 'weekly' | 'monthly' | 'yearly' | 'photo',
  ): Promise<Reminder> {
    // Verify that the plant belongs to the user
    const plant = await this.pinsRepository.findOne({
      where: { id: plantId, createdById: userId },
    });

    if (!plant) {
      throw new NotFoundException(
        'Plant not found or you do not have permission to access it',
      );
    }

    const now = new Date();
    const dueDate = new Date();
    let title = '';
    let notificationType = NotificationType.WARNING;
    let recurringPattern: RecurringPattern | undefined;

    switch (type) {
      case 'weekly':
        dueDate.setDate(now.getDate() + 7);
        title = 'Water plant';
        recurringPattern = RecurringPattern.WEEKLY;
        break;
      case 'monthly':
        dueDate.setMonth(now.getMonth() + 1);
        title = 'Fertilize';
        recurringPattern = RecurringPattern.MONTHLY;
        break;
      case 'yearly':
        dueDate.setFullYear(now.getFullYear() + 1);
        title = 'Prune';
        recurringPattern = RecurringPattern.YEARLY;
        break;
      case 'photo':
        dueDate.setFullYear(now.getFullYear() + 1);
        title = 'Update plant photo';
        notificationType = NotificationType.GENERAL;
        recurringPattern = RecurringPattern.YEARLY;
        break;
    }

    const reminder = this.remindersRepository.create({
      plantId,
      title,
      dueDate,
      notificationType,
      recurringPattern,
      isRecurring: true,
    });

    return this.remindersRepository.save(reminder);
  }

  async markOverdueReminders(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.remindersRepository
      .createQueryBuilder()
      .update(Reminder)
      .set({ status: ReminderStatus.OVERDUE })
      .where('status = :activeStatus', { activeStatus: ReminderStatus.ACTIVE })
      .andWhere('dueDate < :today', { today })
      .execute();
  }
}
