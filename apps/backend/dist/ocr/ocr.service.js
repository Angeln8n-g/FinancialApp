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
var OcrService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OcrService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let OcrService = OcrService_1 = class OcrService {
    prisma;
    logger = new common_1.Logger(OcrService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async parseReceiptText(rawText, householdId) {
        const text = (rawText || '').trim();
        if (!text) {
            throw new common_1.BadRequestException('El texto del comprobante / ticket está vacío');
        }
        const lines = text
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
        let confidence = 0.5;
        let merchantName = 'Comercio / Establecimiento';
        const companyIndicators = /(s\.?a\.?|s\.?r\.?l\.?|c\.?x\.?a\.?|inc\.?|llc|gmbh|tienda|supermercado|farmacia|restaurante|cafe|cafeteria|gasolinera|estacion|market)/i;
        for (let i = 0; i < Math.min(6, lines.length); i++) {
            const line = lines[i];
            if (/^\d+$/.test(line) || /^[0-9\/\-\:\.\s]+$/.test(line) || /^rnc|^nif|^cif|^tel|^calle|^av\./i.test(line)) {
                continue;
            }
            if (companyIndicators.test(line) || i === 0) {
                merchantName = line.replace(/[^\w\s\.\,\-\&]/gi, '').trim();
                confidence += 0.15;
                break;
            }
        }
        let dateStr = new Date().toISOString().split('T')[0];
        const dateRegexes = [
            /(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/,
            /(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})/,
            /(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2})/,
        ];
        for (const line of lines) {
            let matched = false;
            for (const reg of dateRegexes) {
                const m = line.match(reg);
                if (m) {
                    if (m[3].length === 4) {
                        if (parseInt(m[1], 10) > 1900) {
                            dateStr = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
                        }
                        else {
                            dateStr = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
                        }
                    }
                    else if (m[3].length === 2) {
                        dateStr = `20${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
                    }
                    confidence += 0.15;
                    matched = true;
                    break;
                }
            }
            if (matched)
                break;
        }
        let currency = 'USD';
        if (/(rd\$|pesos\s*dom)/i.test(text))
            currency = 'DOP';
        else if (/(eur|€|euros)/i.test(text))
            currency = 'EUR';
        else if (/(mxn|pesos\s*mex)/i.test(text))
            currency = 'MXN';
        else if (/(cop|pesos\s*col)/i.test(text))
            currency = 'COP';
        let totalAmount = 0;
        let subtotal = 0;
        let taxAmount = 0;
        const totalRegex = /(?:total|importe\s*total|valor\s*total|total\s*a\s*pagar|bal\s*due|total\s*usd|total\s*rd\$|total\s*eur|total\s*venta|monto\s*total)[\s\:\$€RD]*([0-9]{1,4}(?:[,\.][0-9]{3})*(?:[,\.][0-9]{1,2})?|[0-9]+(?:[,\.][0-9]{1,2})?)/i;
        const subtotalRegex = /(?:subtotal|sub-total|sub\s*total)[\s\:\$€RD]*([0-9]{1,4}(?:[,\.][0-9]{3})*(?:[,\.][0-9]{1,2})?|[0-9]+(?:[,\.][0-9]{1,2})?)/i;
        const taxRegex = /(?:itbis|iva|tax|taxes|impuesto)[\s\:\$€RD]*([0-9]{1,4}(?:[,\.][0-9]{3})*(?:[,\.][0-9]{1,2})?|[0-9]+(?:[,\.][0-9]{1,2})?)/i;
        const parseNum = (str) => {
            let s = str.trim();
            if (s.includes(',') && s.includes('.')) {
                if (s.indexOf(',') < s.indexOf('.')) {
                    s = s.replace(/,/g, '');
                }
                else {
                    s = s.replace(/\./g, '').replace(',', '.');
                }
            }
            else if (s.includes(',')) {
                s = s.replace(',', '.');
            }
            const val = parseFloat(s);
            return isNaN(val) ? 0 : val;
        };
        for (const line of lines) {
            if (!totalAmount) {
                const m = line.match(totalRegex);
                if (m)
                    totalAmount = parseNum(m[1]);
            }
            if (!subtotal) {
                const m = line.match(subtotalRegex);
                if (m)
                    subtotal = parseNum(m[1]);
            }
            if (!taxAmount) {
                const m = line.match(taxRegex);
                if (m)
                    taxAmount = parseNum(m[1]);
            }
        }
        if (totalAmount > 0) {
            confidence += 0.2;
        }
        else {
            const prices = [];
            const priceEndRegex = /(?:[\$€]|RD\$)?\s*([0-9]+(?:[\.,][0-9]{2}))\s*$/;
            for (const line of lines) {
                const m = line.match(priceEndRegex);
                if (m)
                    prices.push(parseNum(m[1]));
            }
            if (prices.length > 0) {
                totalAmount = Math.max(...prices);
                confidence += 0.05;
            }
        }
        if (!subtotal && totalAmount && taxAmount) {
            subtotal = Math.max(0, totalAmount - taxAmount);
        }
        const lineItems = [];
        const itemRegex = /^(.+?)\s+(?:[\$€]|RD\$)?\s*([0-9]+(?:[\.,][0-9]{2}))\s*$/;
        for (const line of lines) {
            if (/(total|subtotal|itbis|iva|tax|cambio|efectivo|tarjeta|gracias|rnc|nif|cif|fecha|hora)/i.test(line)) {
                continue;
            }
            const m = line.match(itemRegex);
            if (m) {
                const itemDesc = m[1].replace(/^\d+[\s\*\-\.]+/, '').trim();
                const price = parseNum(m[2]);
                if (itemDesc.length > 2 && price > 0 && price <= (totalAmount || 99999)) {
                    lineItems.push({
                        description: itemDesc,
                        price,
                    });
                }
            }
        }
        let paymentMethod = null;
        if (/(tarjeta|visa|mastercard|amex|credito|debito|card)/i.test(text)) {
            paymentMethod = 'TARJETA';
        }
        else if (/(efectivo|cash|cambio|entregado)/i.test(text)) {
            paymentMethod = 'EFECTIVO';
        }
        const [accounts, categories] = await Promise.all([
            this.prisma.account.findMany({ where: { householdId } }),
            this.prisma.category.findMany({ where: { householdId } }),
        ]);
        let selectedAccount = accounts.length > 0 ? accounts[0] : null;
        if (selectedAccount && paymentMethod === 'TARJETA') {
            const card = accounts.find((a) => a.type === client_1.AccountType.CREDIT_CARD || a.name.toLowerCase().includes('tarjeta'));
            if (card)
                selectedAccount = card;
        }
        else if (selectedAccount && paymentMethod === 'EFECTIVO') {
            const cash = accounts.find((a) => a.type === client_1.AccountType.CASH || a.name.toLowerCase().includes('efectivo'));
            if (cash)
                selectedAccount = cash;
        }
        let selectedCategory = null;
        const textLower = text.toLowerCase();
        const categoryKeywords = {
            'Supermercado': ['super', 'supermercado', 'sirena', 'jumbo', 'walmart', 'carrefour', 'mercadona', 'lidl', 'aldi', 'exito', 'market', 'viveres', 'leche', 'pan', 'arroz', 'carne'],
            'Comida & Restaurantes': ['restaurante', 'cafe', 'cafeteria', 'bar', 'pizzeria', 'mcdonald', 'burger', 'starbucks', 'subway', 'almuerzo', 'cena', 'pizza', 'sushi'],
            'Salud & Medicamentos': ['farmacia', 'carol', 'gbc', 'guadalajara', 'cvs', 'walgreens', 'medicina', 'pastillas', 'laboratorio', 'clinica'],
            'Transporte': ['gasolina', 'combustible', 'shell', 'total', 'texaco', 'puma', 'bp', 'estacion', 'peaje', 'uber', 'taxi', 'parqueo'],
            'Compras & Ropa': ['zara', 'h&m', 'tienda', 'ikea', 'amazon', 'ropa', 'zapatos', 'mall'],
        };
        for (const [groupName, words] of Object.entries(categoryKeywords)) {
            if (words.some((w) => textLower.includes(w) || merchantName.toLowerCase().includes(w))) {
                const found = categories.find((c) => c.name.toLowerCase().includes(groupName.toLowerCase().split(' ')[0]) ||
                    groupName.toLowerCase().includes(c.name.toLowerCase().split(' ')[0]));
                if (found) {
                    selectedCategory = found;
                    break;
                }
            }
        }
        if (!selectedCategory && categories.length > 0) {
            selectedCategory = categories[0];
        }
        const isSharedSuggestion = /(supermercado|super|mercado|despensa|farmacia|luz|agua|gasolina|restaurante)/i.test(merchantName) ||
            (selectedCategory?.name && /(supermercado|alimentos|hogar|servicios)/i.test(selectedCategory.name));
        return {
            merchantName,
            date: dateStr,
            totalAmount: Number(totalAmount.toFixed(2)),
            subtotal: Number(subtotal.toFixed(2)),
            taxAmount: Number(taxAmount.toFixed(2)),
            currency,
            categorySuggestion: selectedCategory ? selectedCategory.name : null,
            categoryId: selectedCategory ? selectedCategory.id : null,
            accountSuggestion: selectedAccount ? selectedAccount.name : null,
            accountId: selectedAccount ? selectedAccount.id : null,
            lineItems,
            paymentMethod,
            isSharedSuggestion,
            rawText: text,
            confidence: Math.min(0.98, Number(confidence.toFixed(2))),
        };
    }
    getSampleReceipts() {
        return [
            {
                id: 'sample-supermarket',
                title: 'Supermercado Nacional (Alimentos & Despensa)',
                sampleImage: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
                rawText: `SUPERMERCADO NACIONAL S.A.
Av. 27 de Febrero, Santo Domingo
RNC: 101-02345-1
FECHA: 09/11/2026   HORA: 14:32
CAJA: 04  CAJERO: JUAN P.

1 LECHE ENTERA 1L            2.40
2 PAN MOLDE INTEGRAL        3.80
1 PECHUGA DE POLLO KG        8.50
1 ACEITE DE OLIVA 500ML      6.90
3 AGUA MINERAL 1.5L         4.50
1 MANZANA ROJA BOLSA        4.20
1 DETERGENTE LIQUIDO        9.80

SUBTOTAL:                  40.10
ITBIS / IVA (18%):          7.22
TOTAL A PAGAR:             47.32

PAGO: TARJETA VISA *4521
AUT: 084920
¡GRACIAS POR SU COMPRA!`,
            },
            {
                id: 'sample-restaurant',
                title: 'Restaurante & Bistro Italiano (Cena)',
                sampleImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
                rawText: `RISTORANTE TRATTORIA BELLA
Calle del Sol #12, Centro Historico
NIF: B-89234120
FECHA: 08/11/2026   HORA: 21:15
MESA: 07   CAMARERO: MARCO

1 PIZZA PROSCIUTTO FUNGHI   16.50
1 PASTA CARBONARA           14.00
2 COPAS VINO TINTO          10.00
1 TIRAMISU ARTESANAL         6.50

SUBTOTAL:                  47.00
PROPINA SUGERIDA (10%):     4.70
IVA (10%):                  4.70
TOTAL:                     56.40

METODO DE PAGO: TARJETA
MUCHAS GRACIAS POR SU VISITA`,
            },
            {
                id: 'sample-pharmacy',
                title: 'Farmacia & Salud Familiar (Medicinas)',
                sampleImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
                rawText: `FARMACIA CENTRAL SALUD SRL
Av. Winston Churchill #45
RNC: 130-99482-3
FECHA: 07/11/2026   HORA: 10:05
TURNO: A-24

1 PARACETAMOL 500MG 20 TAB   3.50
1 JARABE PARA LA TOS        8.20
1 ALCOHOL EN GEL 250ML       2.80
1 VITAMINA C EFERVESCENTE    7.90

SUBTOTAL:                  22.40
ITBIS EXENTO:               0.00
TOTAL RD$:                 22.40

PAGO EN EFECTIVO:          30.00
CAMBIO:                     7.60
CONSERVE SU COMPROBANTE`,
            },
        ];
    }
};
exports.OcrService = OcrService;
exports.OcrService = OcrService = OcrService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OcrService);
//# sourceMappingURL=ocr.service.js.map