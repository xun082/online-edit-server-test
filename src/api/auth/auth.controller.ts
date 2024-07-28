import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('github/login')
  @ApiOperation({ summary: 'GitHub OAuth login' })
  async githubLogin(@Res() res: FastifyReply): Promise<void> {
    const githubAuthUrl = this.authService.getGithubAuthUrl();
    res.redirect(githubAuthUrl, 302);
  }

  @Get('github/callback')
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  async githubLoginCallback(@Query('code') code: string, @Res() res: FastifyReply): Promise<any> {
    try {
      const { accessToken, user } = await this.authService.handleGithubCallback(code);
      const redirectUrl = `http://127.0.0.1:3000?token=${accessToken}&username=${encodeURIComponent(user.username)}&email=${encodeURIComponent(user.email)}`;
      res.redirect(redirectUrl, 302);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'GitHub OAuth callback failed', error: error.message });
    }
  }
}
