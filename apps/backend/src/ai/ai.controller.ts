import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { ParseNaturalDto, ProcessOcrDto, ChatRagDto } from './ai.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('parse-natural')
  async parseNatural(@Body() dto: ParseNaturalDto) {
    return this.aiService.parseNaturalLanguage(dto.text);
  }

  @Post('ocr')
  async processOcr(@Body() dto: ProcessOcrDto) {
    return this.aiService.processOcr(dto.imageBase64);
  }

  @Post('chat')
  async chatRAG(@CurrentUser() user: UserPayload, @Body() dto: ChatRagDto) {
    return this.aiService.chatRAG(user.householdId, dto.message);
  }

  @Post('forecast')
  async forecastWhatIf(@CurrentUser() user: UserPayload, @Body() body: { simulateExpense?: number }) {
    return this.aiService.forecastWhatIf(user.householdId, body.simulateExpense || 0);
  }
}
