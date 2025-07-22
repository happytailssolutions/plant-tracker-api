import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async createUser(email: string, name: string): Promise<User> {
    const user = this.usersRepository.create({
      email,
      name,
    });
    return this.usersRepository.save(user);
  }

  async findOrCreateUser(email: string, name: string): Promise<User> {
    let user = await this.findByEmail(email);
    
    if (!user) {
      user = await this.createUser(email, name);
    }
    
    return user;
  }
} 