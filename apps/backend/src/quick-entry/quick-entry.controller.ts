import { Controller, Post, Get, Body, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QuickEntryService } from './quick-entry.service';

@Controller('quick-entry')
export class QuickEntryController {
  constructor(private readonly quickEntryService: QuickEntryService) {}

  /**
   * Vista previa / Parseo de texto en lenguaje natural sin guardar
   */
  @UseGuards(JwtAuthGuard)
  @Post('parse')
  async parse(@Request() req: any, @Body('text') text: string) {
    const householdId = req.user.householdId;
    const candidate = await this.quickEntryService.parseText(text, householdId);
    return { success: true, candidate };
  }

  /**
   * Ejecución y creación de transacción rápida
   */
  @UseGuards(JwtAuthGuard)
  @Post('submit')
  async submit(@Request() req: any, @Body('text') text: string) {
    const userId = req.user.userId || req.user.id;
    const householdId = req.user.householdId;
    return this.quickEntryService.executeQuickEntry(userId, householdId, text);
  }

  /**
   * Generación de código / enlace de vinculación para Telegram
   */
  @UseGuards(JwtAuthGuard)
  @Get('telegram-link')
  async getTelegramLink(@Request() req: any) {
    const userId = req.user.userId || req.user.id;
    const householdId = req.user.householdId;
    const fullName = req.user.fullName || 'Usuario HogarIQ';

    // Generar token en Base64 para deep-link de Telegram
    const rawToken = `${userId}:${householdId}`;
    const token = Buffer.from(rawToken, 'utf8').toString('base64');

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'HogarIQBot';
    const deepLink = `https://t.me/${botUsername}?start=${token}`;

    return {
      success: true,
      botUsername,
      token,
      deepLink,
      instructions: `Envía /start ${token} a @${botUsername} o haz clic en el enlace para vincularte en 1 segundo.`,
    };
  }

  /**
   * Endpoint de Webhook para Telegram Bot
   */
  @Post('telegram-webhook')
  @HttpCode(HttpStatus.OK)
  async telegramWebhook(@Body() body: any) {
    return this.quickEntryService.handleTelegramWebhook(body);
  }
}
