import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType, AccountType } from '@prisma/client';

export interface ParsedTransactionCandidate {
  rawInput: string;
  type: TransactionType;
  amount: number;
  description: string;
  accountId: string;
  accountName: string;
  categoryId: string | null;
  categoryName: string | null;
  isShared: boolean;
  confidence: number;
}

@Injectable()
export class QuickEntryService {
  private readonly logger = new Logger(QuickEntryService.name);

  // In-memory link map for Telegram Chat ID -> { userId, householdId, userName }
  private static telegramChatLinks: Map<string, { userId: string; householdId: string; userName: string }> = new Map();

  constructor(
    private prisma: PrismaService,
    private transactionsService: TransactionsService,
  ) {}

  /**
   * Smart Natural-Language Parser (Rule-based & Heuristic, 100% offline & fast)
   */
  async parseText(input: string, householdId: string): Promise<ParsedTransactionCandidate> {
    const raw = (input || '').trim();
    if (!raw) {
      throw new BadRequestException('El texto de entrada está vacío');
    }

    // 1. Extraer Monto
    // Matches expressions like: "$15.50", "15.50", "RD$ 500", "500 pesos", "1,200.50"
    const amountRegex = /(?:[$€]|RD\$|USD\s*)?\s*([0-9]{1,3}(?:[,\.][0-9]{3})*(?:[,\.][0-9]{1,2})?|[0-9]+(?:[,\.][0-9]{1,2})?)/i;
    const amountMatch = raw.match(amountRegex);

    if (!amountMatch) {
      throw new BadRequestException('No se detectó un monto numérico válido en el texto. Ejemplo: "Almuerzo 15.50 tarjeta"');
    }

    let parsedAmountStr = amountMatch[1];
    // Normalize thousand separators and decimals
    if (parsedAmountStr.includes(',') && parsedAmountStr.includes('.')) {
      // e.g. 1,500.50 or 1.500,50
      if (parsedAmountStr.indexOf(',') < parsedAmountStr.indexOf('.')) {
        parsedAmountStr = parsedAmountStr.replace(/,/g, '');
      } else {
        parsedAmountStr = parsedAmountStr.replace(/\./g, '').replace(',', '.');
      }
    } else if (parsedAmountStr.includes(',')) {
      parsedAmountStr = parsedAmountStr.replace(',', '.');
    }

    const amount = parseFloat(parsedAmountStr);
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException('El monto extraído no es válido');
    }

    // 2. Detectar Tipo (Ingreso vs Gasto)
    const incomeKeywords = /(sueldo|salario|ingreso|cobro|deposito|depósito|honorarios|quincena|pago\s+recibido|transferencia\s+recibida)/i;
    const isIncome = incomeKeywords.test(raw);
    const type = isIncome ? TransactionType.INCOME : TransactionType.EXPENSE;

    // 3. Detectar Gasto Compartido (50/50 Pareja / Hogar)
    const sharedKeywords = /(50\/50|compartido|pareja|comun|común|mitad|entre\s+dos)/i;
    const isShared = sharedKeywords.test(raw);

    // 4. Buscar Cuentas del Hogar y Emparejar
    const accounts = await this.prisma.account.findMany({
      where: { householdId },
    });

    if (accounts.length === 0) {
      throw new NotFoundException('No hay cuentas registradas en este hogar');
    }

    let selectedAccount = accounts[0];
    const rawLower = raw.toLowerCase();

    // Matching por nombre exacto o palabras clave de cuenta
    for (const acc of accounts) {
      const accNameLower = acc.name.toLowerCase();
      if (rawLower.includes(accNameLower)) {
        selectedAccount = acc;
        break;
      }
    }

    if (selectedAccount === accounts[0]) {
      if (/(tarjeta|credito|crédito|debito|débito|card)/i.test(rawLower)) {
        const cardAcc = accounts.find((a) => a.type === AccountType.CREDIT_CARD || a.name.toLowerCase().includes('tarjeta'));
        if (cardAcc) selectedAccount = cardAcc;
      } else if (/(efectivo|cash)/i.test(rawLower)) {
        const cashAcc = accounts.find((a) => a.type === AccountType.CASH || a.name.toLowerCase().includes('efectivo'));
        if (cashAcc) selectedAccount = cashAcc;
      } else if (/(banco|cuenta|bhd|popular|banreservas|chase|revolut)/i.test(rawLower)) {
        const bankAcc = accounts.find((a) => a.type === AccountType.BANK_ACCOUNT || a.type === AccountType.SAVINGS || a.type === AccountType.PAYROLL);
        if (bankAcc) selectedAccount = bankAcc;
      }
    }

    // 5. Categorías del Hogar y Emparejamiento Semántico
    const categories = await this.prisma.category.findMany({
      where: { householdId },
    });

    let selectedCategory: any = null;

    const categoryKeywords: Record<string, string[]> = {
      'Comida & Restaurantes': ['almuerzo', 'comida', 'cena', 'cafe', 'café', 'desayuno', 'pizza', 'hamburguesa', 'restaurante', 'uber eats', 'pedidosya', 'delivery', 'tacos', 'sushi'],
      'Supermercado': ['super', 'supermercado', 'mercado', 'despensa', 'compras', 'viveres', 'víveres', 'frutas', 'vegetales', 'carnes', 'sirena', 'jumbo', 'walmart', 'carrefour'],
      'Transporte': ['gasolina', 'combustible', 'uber', 'taxi', 'indrive', 'peaje', 'metro', 'estacionamiento', 'parqueo', 'mantenimiento', 'aceite', 'bus'],
      'Salud & Medicamentos': ['farmacia', 'medico', 'médico', 'medicina', 'pastillas', 'consulta', 'clinica', 'clínica', 'doctor', 'dentista', 'hospital', 'laboratorio'],
      'Servicios del Hogar': ['luz', 'electricidad', 'agua', 'internet', 'telefono', 'teléfono', 'celular', 'wifi', 'gas', 'mantenimiento', 'renta', 'alquiler'],
      'Entretenimiento': ['cine', 'netflix', 'spotify', 'juegos', 'salida', 'bar', 'tragos', 'concierto', 'streaming', 'playstation', 'steam'],
      'Compras & Ropa': ['ropa', 'zapatos', 'tienda', 'amazon', 'zara', 'mall', 'vestido', 'camisa'],
      'Educación': ['colegio', 'escuela', 'universidad', 'curso', 'libro', 'tutor'],
      'Salario / Ingresos': ['sueldo', 'salario', 'nomina', 'nómina', 'quincena', 'honorarios', 'dividendo'],
    };

    // First: Match with household categories by name
    for (const cat of categories) {
      if (rawLower.includes(cat.name.toLowerCase())) {
        selectedCategory = cat;
        break;
      }
    }

    // Second: Match with heuristic vocabulary
    if (!selectedCategory) {
      for (const [groupName, words] of Object.entries(categoryKeywords)) {
        if (words.some((w) => rawLower.includes(w))) {
          // Find if a household category exists that matches the group
          const match = categories.find(
            (c) => c.name.toLowerCase().includes(groupName.toLowerCase().split(' ')[0]) ||
                   groupName.toLowerCase().includes(c.name.toLowerCase().split(' ')[0])
          );
          if (match) {
            selectedCategory = match;
            break;
          }
        }
      }
    }

    // Default category if none found
    if (!selectedCategory && categories.length > 0) {
      selectedCategory = categories[0];
    }

    // 6. Limpieza y Creación de Descripción
    // Remove amount string, currency mentions, and formatting noise
    let cleanDesc = raw
      .replace(amountMatch[0], '')
      .replace(/(?:[$€]|RD\$|USD|dolares|dólares|pesos|euros)/gi, '')
      .replace(sharedKeywords, '')
      .replace(/(?:con|en|de|por|la|el|una|un)\s+(?:tarjeta|efectivo|cuenta|banco)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanDesc || cleanDesc.length < 2) {
      cleanDesc = selectedCategory ? selectedCategory.name : (type === TransactionType.INCOME ? 'Ingreso Rápido' : 'Gasto Rápido');
    }

    // Capitalize first letter
    cleanDesc = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);

    if (isShared && !cleanDesc.includes('[🤝 Compartido 50/50]')) {
      cleanDesc = `${cleanDesc} [🤝 Compartido 50/50]`;
    }

    return {
      rawInput: raw,
      type,
      amount,
      description: cleanDesc,
      accountId: selectedAccount.id,
      accountName: selectedAccount.name,
      categoryId: selectedCategory ? selectedCategory.id : null,
      categoryName: selectedCategory ? selectedCategory.name : null,
      isShared,
      confidence: 0.95,
    };
  }

  /**
   * Executes the transaction created from natural language
   */
  async executeQuickEntry(userId: string, householdId: string, input: string) {
    const candidate = await this.parseText(input, householdId);

    const transaction = await this.transactionsService.create(
      householdId,
      {
        accountId: candidate.accountId,
        categoryId: candidate.categoryId || undefined,
        type: candidate.type,
        amount: candidate.amount,
        description: candidate.description,
        date: new Date().toISOString(),
      },
      userId,
    );

    return {
      success: true,
      transaction,
      candidate,
    };
  }

  /**
   * Link a Telegram Chat ID with a HogarIQ User
   */
  linkTelegramChat(chatId: string, userId: string, householdId: string, userName: string) {
    QuickEntryService.telegramChatLinks.set(chatId.toString(), { userId, householdId, userName });
    this.logger.log(`Telegram Chat ${chatId} linked to user ${userId} in household ${householdId}`);
    return { success: true, message: `Cuenta vinculada exitosamente a ${userName}` };
  }

  getTelegramLink(chatId: string) {
    return QuickEntryService.telegramChatLinks.get(chatId.toString());
  }

  /**
   * Handle incoming updates from Telegram Webhook
   */
  async handleTelegramWebhook(body: any) {
    const message = body?.message || body?.channel_post;
    if (!message || !message.text) {
      return { ok: true, note: 'No text message' };
    }

    const chatId = message.chat?.id?.toString();
    const text = message.text.trim();
    const fromUser = message.from?.first_name || 'Familiar';

    // 1. Comando de Vinculación: /start <token> o /link <token>
    if (text.startsWith('/start') || text.startsWith('/link')) {
      const parts = text.split(' ');
      if (parts.length > 1) {
        const linkToken = parts[1].trim();
        // Decode base64 link token format: "userId:householdId"
        try {
          const decoded = Buffer.from(linkToken, 'base64').toString('utf8');
          const [userId, householdId] = decoded.split(':');
          if (userId && householdId) {
            this.linkTelegramChat(chatId, userId, householdId, fromUser);
            return {
              method: 'sendMessage',
              chat_id: chatId,
              text: `🎉 *¡Bienvenido a HogarIQ, ${fromUser}!* \n\nTu Telegram ha sido vinculado a tu hogar.\n\nAhora puedes registrar gastos simplemente escribiendo:\n• _"Almuerzo 15 tarjeta"_\n• _"Supermercado 85 compartido"_\n• _"Gasolina 40"_\n• _"Sueldo 1200 en banco"_\n\n¡Pruébalo ahora mismo! ⚡`,
              parse_mode: 'Markdown',
            };
          }
        } catch (e) {
          this.logger.error('Error decoding telegram link token', e);
        }
      }

      return {
        method: 'sendMessage',
        chat_id: chatId,
        text: `👋 *Hola ${fromUser}*, para vincular tu bot de HogarIQ, genera tu enlace de conexión desde la app web en *Configuración > Integraciones > Bot Telegram*.`,
        parse_mode: 'Markdown',
      };
    }

    // 2. Transacción en Lenguaje Natural
    const link = this.getTelegramLink(chatId);
    if (!link) {
      return {
        method: 'sendMessage',
        chat_id: chatId,
        text: `⚠️ *Cuenta no vinculada*\n\nPor favor vincula tu Telegram abriendo tu enlace personal de HogarIQ o enviando \`/start <tu_codigo>\`.`,
        parse_mode: 'Markdown',
      };
    }

    try {
      const result = await this.executeQuickEntry(link.userId, link.householdId, text);
      const c = result.candidate;

      const sign = c.type === TransactionType.INCOME ? '+' : '-';
      const sharedTag = c.isShared ? '\n🤝 *Gasto Compartido (50/50)*' : '';

      return {
        method: 'sendMessage',
        chat_id: chatId,
        text: `✅ *Registro Exitoso en HogarIQ*\n\n📝 *${c.description}*\n💰 *${sign}$${c.amount.toFixed(2)}*\n📂 Categoría: *${c.categoryName || 'General'}*\n💳 Cuenta: *${c.accountName}*${sharedTag}\n\n_Tu balance ha sido actualizado automáticamente._`,
        parse_mode: 'Markdown',
      };
    } catch (err: any) {
      return {
        method: 'sendMessage',
        chat_id: chatId,
        text: `❌ *No pude procesar el mensaje*\n\n${err.message || 'Verifica el formato del gasto'}\n\nEjemplo: _"Almuerzo 14.50 tarjeta"_`,
        parse_mode: 'Markdown',
      };
    }
  }
}
