import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { lookup } from 'node:dns/promises';
import { URL } from 'node:url';
import { databaseConfig } from '../../config/database.config';

export const getTypeOrmConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => {
  // Try to get from environment variables first, then fall back to config
  const databaseUrl = configService.get<string>('DATABASE_URL') || databaseConfig.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not found in environment variables or config');
  }

  try {
    const url = new URL(databaseUrl);
    const hostname = url.hostname;

    console.log(`Resolving hostname: ${hostname}`);
    const { address: ip } = await lookup(hostname, { family: 4 });
    console.log(`Resolved ${hostname} to IPv4 address: ${ip}`);

    url.hostname = ip;
    const newDatabaseUrl = url.toString();

    return {
      type: 'postgres',
      url: newDatabaseUrl,
      entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
      migrationsRun: configService.get<string>('NODE_ENV') === 'production' || databaseConfig.NODE_ENV === 'production',
      synchronize: configService.get<string>('NODE_ENV') === 'development' || databaseConfig.NODE_ENV === 'development', // false for production
      logging: configService.get<string>('NODE_ENV') === 'development' || databaseConfig.NODE_ENV === 'development',
      ssl: {
        rejectUnauthorized: false,
      },
      autoLoadEntities: true,
      extra: {
        max: 20,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
      },
    };
  } catch (err) {
    console.error('Failed to configure TypeORM:', err);
    throw err;
  }
};
