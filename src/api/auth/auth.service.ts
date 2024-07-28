import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

import { User, UserDocument } from '../user/schema/user.schema';
import { UserDto } from '../user/dto/user.dto';

import { GitHubLoginConfigEnum } from '@/common/enum/config.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly httpService: HttpService,
    private jwt: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  getGithubAuthUrl(): string {
    const clientId = this.configService.get<string>(GitHubLoginConfigEnum.GITHUB_CLIENT_ID);
    const redirectUri = this.configService.get<string>(GitHubLoginConfigEnum.GITHUB_CALLBACK_URL);

    return (
      `https://github.com/login/oauth/authorize` +
      `?client_id=${clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&scope=user:email`
    );
  }

  async handleGithubCallback(code: string): Promise<{ accessToken: string; user: UserDto }> {
    const tokenResponse$ = this.httpService.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: this.configService.get<string>(GitHubLoginConfigEnum.GITHUB_CLIENT_ID),
        client_secret: this.configService.get<string>(GitHubLoginConfigEnum.GITHUB_CLIENT_SECRET),
        code,
      },
      {
        headers: {
          accept: 'application/json',
        },
      },
    );

    const tokenResponse = await lastValueFrom(tokenResponse$);

    if (tokenResponse.data.error) {
      throw new Error(tokenResponse.data.error_description || 'Failed to obtain access token');
    }

    const accessToken = tokenResponse.data.access_token;
    const userResponse$ = this.httpService.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userResponse = await lastValueFrom(userResponse$);

    const githubUser = userResponse.data;

    if (!githubUser.email) {
      const emailsResponse$ = this.httpService.get('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const emailsResponse = await lastValueFrom(emailsResponse$);
      const emails = emailsResponse.data;
      const primaryEmail = emails.find((email: any) => email.primary) || emails[0];
      githubUser.email = primaryEmail.email;
    }

    const user = await this.findOrCreateUser(githubUser);

    return { accessToken, user };
  }

  async findOrCreateUser(githubUser: any): Promise<UserDto> {
    const { id: githubId, login: username, email, avatar_url: avatar } = githubUser;

    const user = await this.userModel
      .findOneAndUpdate(
        { githubId },
        { githubId, username, email, avatar },
        { new: true, upsert: true, setDefaultsOnInsert: true, select: '-password' },
      )
      .lean()
      .exec();

    return user;
  }
}
