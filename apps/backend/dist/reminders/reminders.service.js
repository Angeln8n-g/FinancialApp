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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemindersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const events_gateway_1 = require("../events/events.gateway");
const client_1 = require("@prisma/client");
let RemindersService = class RemindersService {
    prisma;
    eventsGateway;
    constructor(prisma, eventsGateway) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
    }
    async findAll(householdId) {
        return this.prisma.reminder.findMany({
            where: { householdId },
            orderBy: { dueDate: 'asc' },
        });
    }
    async create(householdId, data) {
        return this.prisma.reminder.create({
            data: {
                householdId,
                title: data.title,
                amount: data.amount,
                dueDate: new Date(data.dueDate),
            },
        });
    }
    async togglePaid(householdId, reminderId) {
        const reminder = await this.prisma.reminder.findFirst({
            where: { id: reminderId, householdId },
        });
        if (!reminder)
            throw new common_1.NotFoundException('Recordatorio no encontrado');
        const newPaidState = !reminder.isPaid;
        if (newPaidState) {
            const account = await this.prisma.account.findFirst({
                where: { householdId },
                orderBy: { createdAt: 'asc' },
            });
            if (account) {
                let category = await this.prisma.category.findFirst({
                    where: { householdId, name: { contains: 'Servicios', mode: 'insensitive' } },
                });
                if (!category) {
                    category = await this.prisma.category.findFirst({
                        where: { householdId },
                    });
                }
                await this.prisma.$transaction(async (tx) => {
                    await tx.transaction.create({
                        data: {
                            householdId,
                            accountId: account.id,
                            categoryId: category ? category.id : null,
                            type: client_1.TransactionType.EXPENSE,
                            amount: reminder.amount,
                            description: `Pago Recordatorio: ${reminder.title}`,
                            date: new Date(),
                        },
                    });
                    await tx.account.update({
                        where: { id: account.id },
                        data: { balance: { decrement: reminder.amount } },
                    });
                    await tx.reminder.update({
                        where: { id: reminderId },
                        data: { isPaid: true },
                    });
                });
                this.eventsGateway.notifyHouseholdChange(householdId, 'reminder', 'PAY');
                return { isPaid: true, message: 'Pago registrado como gasto con éxito' };
            }
        }
        const updated = await this.prisma.reminder.update({
            where: { id: reminderId },
            data: { isPaid: newPaidState },
        });
        this.eventsGateway.notifyHouseholdChange(householdId, 'reminder', 'TOGGLE');
        return updated;
    }
    async delete(householdId, reminderId) {
        return this.prisma.reminder.deleteMany({
            where: { id: reminderId, householdId },
        });
    }
};
exports.RemindersService = RemindersService;
exports.RemindersService = RemindersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_gateway_1.EventsGateway])
], RemindersService);
//# sourceMappingURL=reminders.service.js.map