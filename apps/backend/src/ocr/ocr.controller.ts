import { Controller, Post, Get, Body, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OcrService } from './ocr.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType } from '@prisma/client';

@Controller(['ocr', 'api/ocr'])
export class OcrController {
  constructor(
    private readonly ocrService: OcrService,
    private readonly transactionsService: TransactionsService,
  ) {}

  /**
   * Obtener recibos de prueba interactivos
   */
  @UseGuards(JwtAuthGuard)
  @Get('samples')
  getSamples() {
    return {
      success: true,
      samples: this.ocrService.getSampleReceipts(),
    };
  }

  /**
   * Parsear texto extraído de comprobante / ticket
   */
  @UseGuards(JwtAuthGuard)
  @Post('parse')
  async parseReceipt(@Request() req: any, @Body('rawText') rawText: string) {
    const householdId = req.user.householdId;
    const candidate = await this.ocrService.parseReceiptText(rawText, householdId);
    return {
      success: true,
      candidate,
    };
  }

  /**
   * Confirmar y guardar la transacción originada del comprobante escaneado
   */
  @UseGuards(JwtAuthGuard)
  @Post('confirm')
  async confirmReceipt(
    @Request() req: any,
    @Body()
    dto: {
      accountId: string;
      categoryId?: string;
      amount: number;
      merchantName: string;
      date?: string;
      isShared?: boolean;
      lineItems?: Array<{ description: string; price: number }>;
      notes?: string;
    },
  ) {
    const userId = req.user.userId || req.user.id;
    const householdId = req.user.householdId;

    let finalDesc = dto.merchantName || 'Comprobante Escaneado';
    if (dto.isShared && !finalDesc.includes('[🤝 Compartido 50/50]')) {
      finalDesc += ' [🤝 Compartido 50/50]';
    }
    if (dto.notes) {
      finalDesc += ` • ${dto.notes}`;
    }
    if (dto.lineItems && dto.lineItems.length > 0) {
      const itemsSummary = dto.lineItems.map((i) => `${i.description} ($${i.price.toFixed(2)})`).join(', ');
      finalDesc += ` [🧾 Ítems: ${itemsSummary.substring(0, 150)}]`;
    }

    const transaction = await this.transactionsService.create(
      householdId,
      {
        accountId: dto.accountId,
        categoryId: dto.categoryId || undefined,
        type: TransactionType.EXPENSE,
        amount: dto.amount,
        description: finalDesc,
        date: dto.date || new Date().toISOString(),
      },
      userId,
    );

    return {
      success: true,
      transaction,
    };
  }
}
