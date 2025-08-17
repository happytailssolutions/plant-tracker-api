import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reminder, NotificationType, ReminderStatus, RecurringPattern } from '../entities/reminder.entity';
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

  async createReminder(input: CreateReminderInput, userId: string): Promise<Reminder> {
    // Verify that the plant belongs to the user
    const plant = await this.pinsRepository.findOne({
      where: { id: input.plantId, createdById: userId },
    });

    if (!plant) {
      throw new NotFoundException('Plant not found or you do not have permission to access it');
    }

    const reminder = this.remindersRepository.create({
      ...input,
      createdById: userId,
      dueDate: new Date(input.dueDate),
    });

    return this.remindersRepository.save(reminder);
  }

  async updateReminder(input: UpdateReminderInput, userId: string): Promise<Reminder> {
    const reminder = await this.remindersRepository.findOne({
      where: { id: input.id },
      relations: ['plant'],
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    if (reminder.createdById !== userId) {
      throw new ForbiddenException('You do not have permission to update this reminder');
    }

    // Update the reminder with new data
    Object.assign(reminder, {
      ...input,
      dueDate: input.dueDate ? new Date(input.dueDate) : reminder.dueDate,
      updatedAt: new Date(),
    });

    return this.remindersRepository.save(reminder);
  }

  async deleteReminder(id: string, userId: string): Promise<boolean> {
    const reminder = await this.remindersRepository.findOne({
      where: { id, createdById: userId },
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found or you do not have permission to delete it');
    }

    await this.remindersRepository.remove(reminder);
    return true;
  }

  async markReminderAsCompleted(id: string, userId: string): Promise<Reminder> {
    const reminder = await this.remindersRepository.findOne({
      where: { id, createdById: userId },
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found or you do not have permission to update it');
    }

    reminder.status = ReminderStatus.COMPLETED;
    reminder.completedAt = new Date();
    reminder.updatedAt = new Date();

    return this.remindersRepository.save(reminder);
  }

  async findRemindersByPlant(plantId: string, userId: string): Promise<Reminder[]> {
    // Verify that the plant belongs to the user
    const plant = await this.pinsRepository.findOne({
      where: { id: plantId, createdById: userId },
    });

    if (!plant) {
      throw new NotFoundException('Plant not found or you do not have permission to access it');
    }

    return this.remindersRepository.find({
      where: { plantId, createdById: userId },
      order: { dueDate: 'ASC' },
    });
  }

  async findActiveRemindersForUser(userId: string): Promise<Reminder[]> {
    return this.remindersRepository.find({
      where: { 
        createdById: userId, 
        status: ReminderStatus.ACTIVE 
      },
      relations: ['plant'],
      order: { dueDate: 'ASC' },
    });
  }

  async findOverdueRemindersForUser(userId: string): Promise<Reminder[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.remindersRepository
      .createQueryBuilder('reminder')
      .leftJoinAndSelect('reminder.plant', 'plant')
      .where('reminder.createdById = :userId', { userId })
      .andWhere('reminder.status = :status', { status: ReminderStatus.ACTIVE })
      .andWhere('reminder.dueDate < :today', { today })
      .orderBy('reminder.dueDate', 'ASC')
      .getMany();
  }

  async createQuickReminder(
    plantId: string, 
    userId: string, 
    type: 'weekly' | 'monthly' | 'yearly' | 'photo'
  ): Promise<Reminder> {
    // Verify that the plant belongs to the user
    const plant = await this.pinsRepository.findOne({
      where: { id: plantId, createdById: userId },
    });

    if (!plant) {
      throw new NotFoundException('Plant not found or you do not have permission to access it');
    }

    const now = new Date();
    let dueDate = new Date();
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
      createdById: userId,
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