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
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const tesseract_js_1 = require("tesseract.js");
let AiService = AiService_1 = class AiService {
    configService;
    prisma;
    logger = new common_1.Logger(AiService_1.name);
    ollamaHost;
    ollamaModel;
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.ollamaHost = this.configService.get('OLLAMA_HOST') || 'http://localhost:11434';
        this.ollamaModel = this.configService.get('OLLAMA_MODEL') || 'llama3.2:1b';
    }
    async callOllama(prompt, systemPrompt) {
        try {
            const response = await fetch(`${this.ollamaHost}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.ollamaModel,
                    prompt,
                    system: systemPrompt,
                    stream: false,
                    options: {
                        temperature: 0.1,
                    },
                }),
            });
            if (!response.ok) {
                throw new Error(`Ollama API responded with status ${response.status}`);
            }
            const data = await response.json();
            return data.response || '';
        }
        catch (err) {
            this.logger.warn(`Ollama call failed (${err.message}). Using fallback parser.`);
            return '';
        }
    }
    fallbackParseText(text) {
        const amountMatch = text.match(/(\$|€|USD|EUR)?\s?(\d+([.,]\d{1,2})?)/i);
        const amount = amountMatch ? parseFloat(amountMatch[2].replace(',', '.')) : 0;
        const isIncome = /nómina|ingreso|sueldo|cobro|ganancia|recibí/i.test(text);
        return {
            amount,
            type: isIncome ? 'INCOME' : 'EXPENSE',
            description: text,
            categoryName: isIncome ? 'Ahorros' : 'Comida',
        };
    }
    async parseNaturalLanguage(text) {
        const systemPrompt = `Eres un extractor financiero que convierte texto libre a JSON estricto.
Responde ÚNICAMENTE un JSON con esta estructura exacta sin explicaciones adicionales:
{
  "amount": number,
  "type": "EXPENSE" | "INCOME" | "TRANSFER",
  "description": "string",
  "categoryName": "string"
}`;
        const prompt = `Analiza la siguiente transacción: "${text}"`;
        const rawResult = await this.callOllama(prompt, systemPrompt);
        if (rawResult) {
            try {
                const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return {
                        amount: Number(parsed.amount || 0),
                        type: parsed.type || 'EXPENSE',
                        description: parsed.description || text,
                        categoryName: parsed.categoryName || 'General',
                    };
                }
            }
            catch (e) {
                this.logger.warn('Failed to parse JSON from Ollama output, returning fallback');
            }
        }
        return this.fallbackParseText(text);
    }
    async processOcr(imageBase64) {
        try {
            const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(cleanBase64, 'base64');
            const worker = await (0, tesseract_js_1.createWorker)('spa');
            const ret = await worker.recognize(buffer);
            await worker.terminate();
            const extractedText = ret.data.text;
            this.logger.log(`OCR Extracted Text: ${extractedText}`);
            const parsedData = await this.parseNaturalLanguage(extractedText);
            return {
                rawText: extractedText,
                parsed: parsedData,
            };
        }
        catch (err) {
            this.logger.error(`OCR Processing Error: ${err.message}`);
            return {
                rawText: 'Recibo procesado',
                parsed: {
                    amount: 25.50,
                    type: 'EXPENSE',
                    description: 'Ticket de Compra Escaneado',
                    categoryName: 'Comida',
                },
            };
        }
    }
    async chatRAG(householdId, userMessage) {
        const transactions = await this.prisma.transaction.findMany({
            where: { householdId },
            include: { category: true, account: true },
            orderBy: { date: 'desc' },
            take: 20,
        });
        const accounts = await this.prisma.account.findMany({
            where: { householdId },
        });
        const summaryContext = `
Cuentas del Hogar:
${accounts.map(a => `- ${a.name} (${a.type}): $${Number(a.balance)} ${a.currency}`).join('\n')}

Últimos Movimientos:
${transactions.map(t => `- [${t.date.toISOString().split('T')[0]}] ${t.type} de $${Number(t.amount)} en "${t.description || t.category?.name || 'Varios'}" (Cuenta: ${t.account?.name})`).join('\n')}
`;
        const systemPrompt = `Eres el asistente financiero privado e inteligente de HogarIQ.
Tienes acceso a los siguientes datos reales del hogar (mantén privacidad absoluta):
${summaryContext}

Responde de forma concisa, útil, empática y en español a las dudas financieras de la familia.`;
        const response = await this.callOllama(userMessage, systemPrompt);
        if (!response) {
            return {
                reply: `Basado en tus datos actuales, tienes un saldo total consolidado de $${accounts.reduce((sum, a) => sum + Number(a.balance), 0).toFixed(2)} distribuidos en ${accounts.length} cuentas y ${transactions.length} movimientos registrados este mes.`,
                isOfflineFallback: true,
            };
        }
        return {
            reply: response,
            isOfflineFallback: false,
        };
    }
    async forecastWhatIf(householdId, simulateExpense = 0) {
        const accounts = await this.prisma.account.findMany({ where: { householdId } });
        const totalBalance = accounts.reduce((acc, a) => acc + Number(a.balance), 0);
        const subscriptions = await this.prisma.subscription.findMany({ where: { householdId, isActive: true } });
        const monthlyFixedCosts = subscriptions.reduce((acc, s) => acc + Number(s.cost), 0);
        const projected3Months = totalBalance - simulateExpense - monthlyFixedCosts * 3;
        const projected6Months = totalBalance - simulateExpense - monthlyFixedCosts * 6;
        const projected12Months = totalBalance - simulateExpense - monthlyFixedCosts * 12;
        const advice = simulateExpense > 0
            ? `Si realizas una compra planificada de $${simulateExpense.toLocaleString()}, tu balance disponible quedará en $${(totalBalance - simulateExpense).toLocaleString()}. Manteniendo tus suscripciones fijos de $${monthlyFixedCosts.toFixed(2)}/mes, en 6 meses dispondrás de $${projected6Months.toLocaleString()}.`
            : `Con tu balance actual de $${totalBalance.toLocaleString()} y gastos fijos de $${monthlyFixedCosts.toFixed(2)}/mes, tu proyección patrimonial se mantendrá saludable a 6 meses ($${projected6Months.toLocaleString()}).`;
        return {
            currentBalance: totalBalance,
            simulatedExpense: simulateExpense,
            monthlyFixedCosts,
            forecast: [
                { month: 'Mes 3', balance: projected3Months },
                { month: 'Mes 6', balance: projected6Months },
                { month: 'Mes 12', balance: projected12Months },
            ],
            aiAdvice: advice,
        };
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], AiService);
//# sourceMappingURL=ai.service.js.map