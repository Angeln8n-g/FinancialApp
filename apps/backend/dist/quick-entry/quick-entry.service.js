"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var QuickEntryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickEntryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const transactions_service_1 = require("../transactions/transactions.service");
const client_1 = require("@prisma/client");
let QuickEntryService = class QuickEntryService {
    static { QuickEntryService_1 = this; }
    prisma;
    transactionsService;
    logger = new common_1.Logger(QuickEntryService_1.name);
    static telegramChatLinks = new Map();
    constructor(prisma, transactionsService) {
        this.prisma = prisma;
        this.transactionsService = transactionsService;
    }
    async parseText(input, householdId) {
        const raw = (input || '').trim();
        if (!raw) {
            throw new common_1.BadRequestException('El texto de entrada está vacío');
        }
        const amountRegex = /(?:[$€]|RD\$|USD\s*)?\s*([0-9]{1,3}(?:[,\.][0-9]{3})*(?:[,\.][0-9]{1,2})?|[0-9]+(?:[,\.][0-9]{1,2})?)/i;
        const amountMatch = raw.match(amountRegex);
        if (!amountMatch) {
            throw new common_1.BadRequestException('No se detectó un monto numérico válido en el texto. Ejemplo: "Almuerzo 15.50 tarjeta"');
        }
        let parsedAmountStr = amountMatch[1];
        if (parsedAmountStr.includes(',') && parsedAmountStr.includes('.')) {
            if (parsedAmountStr.indexOf(',') < parsedAmountStr.indexOf('.')) {
                parsedAmountStr = parsedAmountStr.replace(/,/g, '');
            }
            else {
                parsedAmountStr = parsedAmountStr.replace(/\./g, '').replace(',', '.');
            }
        }
        else if (parsedAmountStr.includes(',')) {
            parsedAmountStr = parsedAmountStr.replace(',', '.');
        }
        const amount = parseFloat(parsedAmountStr);
        if (isNaN(amount) || amount <= 0) {
            throw new common_1.BadRequestException('El monto extraído no es válido');
        }
        const incomeKeywords = /(sueldo|salario|ingreso|cobro|deposito|depósito|honorarios|quincena|pago\s+recibido|transferencia\s+recibida)/i;
        const isIncome = incomeKeywords.test(raw);
        const type = isIncome ? client_1.TransactionType.INCOME : client_1.TransactionType.EXPENSE;
        const sharedKeywords = /(50\/50|compartido|pareja|comun|común|mitad|entre\s+dos)/i;
        const isShared = sharedKeywords.test(raw);
        const accounts = await this.prisma.account.findMany({
            where: { householdId },
        });
        if (accounts.length === 0) {
            throw new common_1.NotFoundException('No hay cuentas registradas en este hogar');
        }
        let selectedAccount = accounts[0];
        const rawLower = raw.toLowerCase();
        for (const acc of accounts) {
            const accNameLower = acc.name.toLowerCase();
            if (rawLower.includes(accNameLower)) {
                selectedAccount = acc;
                break;
            }
        }
        if (selectedAccount === accounts[0]) {
            if (/(tarjeta|credito|crédito|debito|débito|card)/i.test(rawLower)) {
                const cardAcc = accounts.find((a) => a.type === client_1.AccountType.CREDIT_CARD || a.name.toLowerCase().includes('tarjeta'));
                if (cardAcc)
                    selectedAccount = cardAcc;
            }
            else if (/(efectivo|cash)/i.test(rawLower)) {
                const cashAcc = accounts.find((a) => a.type === client_1.AccountType.CASH || a.name.toLowerCase().includes('efectivo'));
                if (cashAcc)
                    selectedAccount = cashAcc;
            }
            else if (/(banco|cuenta|bhd|popular|banreservas|chase|revolut)/i.test(rawLower)) {
                const bankAcc = accounts.find((a) => a.type === client_1.AccountType.BANK_ACCOUNT || a.type === client_1.AccountType.SAVINGS || a.type === client_1.AccountType.PAYROLL);
                if (bankAcc)
                    selectedAccount = bankAcc;
            }
        }
        const categories = await this.prisma.category.findMany({
            where: { householdId },
        });
        let selectedCategory = null;
        const categoryKeywords = {
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
        for (const cat of categories) {
            if (rawLower.includes(cat.name.toLowerCase())) {
                selectedCategory = cat;
                break;
            }
        }
        if (!selectedCategory) {
            for (const [groupName, words] of Object.entries(categoryKeywords)) {
                if (words.some((w) => rawLower.includes(w))) {
                    const match = categories.find((c) => c.name.toLowerCase().includes(groupName.toLowerCase().split(' ')[0]) ||
                        groupName.toLowerCase().includes(c.name.toLowerCase().split(' ')[0]));
                    if (match) {
                        selectedCategory = match;
                        break;
                    }
                }
            }
        }
        if (!selectedCategory && categories.length > 0) {
            selectedCategory = categories[0];
        }
        let cleanDesc = raw
            .replace(amountMatch[0], '')
            .replace(/(?:[$€]|RD\$|USD|dolares|dólares|pesos|euros)/gi, '')
            .replace(sharedKeywords, '')
            .replace(/(?:con|en|de|por|la|el|una|un)\s+(?:tarjeta|efectivo|cuenta|banco)/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        if (!cleanDesc || cleanDesc.length < 2) {
            cleanDesc = selectedCategory ? selectedCategory.name : (type === client_1.TransactionType.INCOME ? 'Ingreso Rápido' : 'Gasto Rápido');
        }
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
    async executeQuickEntry(userId, householdId, input) {
        const candidate = await this.parseText(input, householdId);
        const transaction = await this.transactionsService.create(householdId, {
            accountId: candidate.accountId,
            categoryId: candidate.categoryId || undefined,
            type: candidate.type,
            amount: candidate.amount,
            description: candidate.description,
            date: new Date().toISOString(),
        }, userId);
        return {
            success: true,
            transaction,
            candidate,
        };
    }
    linkTelegramChat(chatId, userId, householdId, userName) {
        QuickEntryService_1.telegramChatLinks.set(chatId.toString(), { userId, householdId, userName });
        this.logger.log(`Telegram Chat ${chatId} linked to user ${userId} in household ${householdId}`);
        return { success: true, message: `Cuenta vinculada exitosamente a ${userName}` };
    }
    getTelegramLink(chatId) {
        return QuickEntryService_1.telegramChatLinks.get(chatId.toString());
    }
    async handleTelegramWebhook(body) {
        const message = body?.message || body?.channel_post;
        if (!message || !message.text) {
            return { ok: true, note: 'No text message' };
        }
        const chatId = message.chat?.id?.toString();
        const text = message.text.trim();
        const fromUser = message.from?.first_name || 'Familiar';
        if (text.startsWith('/start') || text.startsWith('/link')) {
            const parts = text.split(' ');
            if (parts.length > 1) {
                const linkToken = parts[1].trim();
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
                }
                catch (e) {
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
            const sign = c.type === client_1.TransactionType.INCOME ? '+' : '-';
            const sharedTag = c.isShared ? '\n🤝 *Gasto Compartido (50/50)*' : '';
            return {
                method: 'sendMessage',
                chat_id: chatId,
                text: `✅ *Registro Exitoso en HogarIQ*\n\n📝 *${c.description}*\n💰 *${sign}$${c.amount.toFixed(2)}*\n📂 Categoría: *${c.categoryName || 'General'}*\n💳 Cuenta: *${c.accountName}*${sharedTag}\n\n_Tu balance ha sido actualizado automáticamente._`,
                parse_mode: 'Markdown',
            };
        }
        catch (err) {
            return {
                method: 'sendMessage',
                chat_id: chatId,
                text: `❌ *No pude procesar el mensaje*\n\n${err.message || 'Verifica el formato del gasto'}\n\nEjemplo: _"Almuerzo 14.50 tarjeta"_`,
                parse_mode: 'Markdown',
            };
        }
    }
};
exports.QuickEntryService = QuickEntryService;
exports.QuickEntryService = QuickEntryService = QuickEntryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        transactions_service_1.TransactionsService])
], QuickEntryService);
//# sourceMappingURL=quick-entry.service.js.map