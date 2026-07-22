import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { TransactionType } from '@prisma/client';

@Injectable()
export class RemindersService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async findAll(householdId: string) {
    return this.prisma.reminder.findMany({
      where: { householdId },
      orderBy: { dueDate: 'asc' },
    });
  }

  async create(householdId: string, data: { title: string; amount: number; dueDate: string }) {
    return this.prisma.reminder.create({
      data: {
        householdId,
        title: data.title,
        amount: data.amount,
        dueDate: new Date(data.dueDate),
      },
    });
  }

  async togglePaid(householdId: string, reminderId: string) {
    const reminder = await this.prisma.reminder.findFirst({
      where: { id: reminderId, householdId },
    });

    if (!reminder) throw new NotFoundException('Recordatorio no encontrado');

    const newPaidState = !reminder.isPaid;

    if (newPaidState) {
      // 🚀 Al marcar como pagado, registrar un GASTO automáticamente en las cuentas del hogar
      const account = await this.prisma.account.findFirst({
        where: { householdId },
        orderBy: { createdAt: 'asc' },
      });

      if (account) {
        // Buscar categoría "Servicios" o la primera disponible
        let category = await this.prisma.category.findFirst({
          where: { householdId, name: { contains: 'Servicios', mode: 'insensitive' } },
        });

        if (!category) {
          category = await this.prisma.category.findFirst({
            where: { householdId },
          });
        }

        await this.prisma.$transaction(async (tx) => {
          // 1. Crear transacción de gasto
          await tx.transaction.create({
            data: {
              householdId,
              accountId: account.id,
              categoryId: category ? category.id : null,
              type: TransactionType.EXPENSE,
              amount: reminder.amount,
              description: `Pago Recordatorio: ${reminder.title}`,
              date: new Date(),
            },
          });

          // 2. Descontar del saldo de la cuenta
          await tx.account.update({
            where: { id: account.id },
            data: { balance: { decrement: reminder.amount } },
          });

          // 3. Actualizar estado del recordatorio a pagado
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

  async delete(householdId: string, reminderId: string) {
    return this.prisma.reminder.deleteMany({
      where: { id: reminderId, householdId },
    });
  }
}
