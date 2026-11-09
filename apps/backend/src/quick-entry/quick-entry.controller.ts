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
    const webhookUrl = process.env.PUBLIC_API_URL
      ? `${process.env.PUBLIC_API_URL}/api/quick-entry/telegram-webhook`
      : 'https://api-hogariq.kasino21.com/api/quick-entry/telegram-webhook';

    const deepLink = `https://t.me/${botUsername}?start=${token}`;

    return {
      success: true,
      botUsername,
      token,
      deepLink,
      webhookUrl,
      instructions: `Envía /start ${token} a @${botUsername} o haz clic en el enlace para vincularte en 1 segundo.`,
    };
  }

  /**
   * Configuración asistida del Webhook de Telegram usando el Bot Token de @BotFather
   */
  @UseGuards(JwtAuthGuard)
  @Post('setup-telegram-bot')
  async setupTelegramBot(@Body('botToken') botToken: string) {
    if (!botToken || typeof botToken !== 'string') {
      return { success: false, message: 'Token de bot requerido' };
    }

    const cleanToken = botToken.trim();
    const webhookUrl = process.env.PUBLIC_API_URL
      ? `${process.env.PUBLIC_API_URL}/api/quick-entry/telegram-webhook`
      : 'https://api-hogariq.kasino21.com/api/quick-entry/telegram-webhook';

    try {
      // 1. Verificar info del bot en Telegram
      const meRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
      const meData = await meRes.json();
      if (!meData.ok) {
        return { success: false, message: `Token inválido de Telegram: ${meData.description || 'Error desconocido'}` };
      }

      // 2. Establecer webhook en Telegram
      const hookRes = await fetch(`https://api.telegram.org/bot${cleanToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
      const hookData = await hookRes.json();
      if (!hookData.ok) {
        return { success: false, message: `Error configurando webhook: ${hookData.description}` };
      }

      const botUsername = meData.result?.username;
      process.env.TELEGRAM_BOT_USERNAME = botUsername;

      return {
        success: true,
        botUsername,
        message: `Webhook configurado exitosamente para @${botUsername}`,
      };
    } catch (err: any) {
      return { success: false, message: `Error conectando con la API de Telegram: ${err.message}` };
    }
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
