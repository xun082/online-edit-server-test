import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

import { MongoDbConfigEnum } from '../common/enum/config.enum';

export default (configService: ConfigService) => {
  const host = configService.get(MongoDbConfigEnum.DATABASE_HOST);
  const port = configService.get(MongoDbConfigEnum.DATABASE_PORT);
  const pass = configService.get(MongoDbConfigEnum.DATABASE_PASS);
  const dbName = configService.get(MongoDbConfigEnum.DATABASE_NAME);

  // const uri = `mongodb://${username}:${password}@${host}:${port}/?authSource=${authSource}`;
  const uri = `mongodb://root:${pass}@${host}:${port}/admin`;

  return {
    uri,
    retryAttempts: 2,
    dbName,
  } as MongooseModuleOptions;
};
