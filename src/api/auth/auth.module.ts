import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';

import { User, UserSchema } from '../user/schema/user.schema';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './auth.strategy';

import { jwtConstants } from '@/utils';
import { EmailModule } from '@/common/email/email.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema, collection: 'user' }]),
    JwtModule.registerAsync({
      useFactory: async () => ({
        global: true,
        secret: jwtConstants.secret,
        signOptions: {
          expiresIn: '30d',
        },
      }),
    }),

    EmailModule,
    HttpModule,
  ],
  exports: [AuthService],
})
export class AuthModule {}
