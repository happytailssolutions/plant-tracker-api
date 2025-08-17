import { Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { PlantReminder } from '../reminders/plant-reminder.entity';

@Entity('plants')
export class Plant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => PlantReminder, (reminder) => reminder.plant)
  reminders: PlantReminder[];
}
