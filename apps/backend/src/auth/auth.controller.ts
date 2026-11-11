import { Controller, Post, Body, Get, Delete, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser, UserPayload } from './get-user.decorator';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: UserPayload) {
    return this.authService.getMe(user.userId, user.householdId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('switch-household')
  async switchHousehold(@CurrentUser() user: UserPayload, @Body() body: { householdId: string }) {
    return this.authService.switchHousehold(user.userId, body.householdId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('export-data')
  async exportData(@CurrentUser() user: UserPayload) {
    return this.authService.exportData(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('account')
  async deleteAccount(
    @CurrentUser() user: UserPayload,
    @Body() body: { passwordConfirm?: string },
  ) {
    return this.authService.deleteAccount(user.userId, body?.passwordConfirm);
  }
}
