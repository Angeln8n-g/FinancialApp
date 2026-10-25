import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto } from './accounts.dto';
import { AccountType, PayrollFrequency, TransactionType } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  /**
   * Determina si a una cuenta de nómina le corresponde un depósito automático en la fecha indicada.
   */
  isPayrollDue(account: any, now: Date = new Date()): boolean {
    if (!account.payrollAutoDeposit) return false;
    const amount = Number(account.payrollAmount || 0);
    if (amount <= 0) return false;
    if (!account.payrollFrequency) return false;

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const lastDeposit = account.lastPayrollDeposit ? new Date(account.lastPayrollDeposit) : null;
    const hasDepositInCurrentMonth =
      lastDeposit &&
      lastDeposit.getFullYear() === currentYear &&
      lastDeposit.getMonth() === currentMonth;

    if (account.payrollFrequency === PayrollFrequency.MONTHLY) {
      const targetDay = Math.min(account.payrollDay1 || 30, lastDayOfMonth);
      if (currentDay < targetDay) {
        return false;
      }
      // Si ya se depositó este mes, no corresponde duplicar
      return !hasDepositInCurrentMonth;
    }

    if (account.payrollFrequency === PayrollFrequency.BIWEEKLY) {
      const day1 = Math.min(account.payrollDay1 || 15, 15);
      const day2 = Math.min(account.payrollDay2 || 30, lastDayOfMonth);

      // Primer periodo quincenal (días 1 al 15)
      if (currentDay >= day1 && currentDay <= 15) {
        const depositedInPeriod1 = hasDepositInCurrentMonth && (lastDeposit?.getDate() || 0) <= 15;
        return !depositedInPeriod1;
      }

      // Segundo periodo quincenal (días 16 al fin de mes)
      if (currentDay >= day2) {
        const depositedInPeriod2 = hasDepositInCurrentMonth && (lastDeposit?.getDate() || 0) > 15;
        return !depositedInPeriod2;
      }

      return false;
    }

    return false;
  }

  /**
   * Ejecuta el abono de nómina atómicamente:
   * 1. Crea la transacción de ingreso en la categoría "Nómina".
   * 2. Incrementa el saldo de la cuenta.
   * 3. Registra lastPayrollDeposit con la fecha actual.
   * 4. Emite eventos en tiempo real al hogar.
   */
  async executePayrollDeposit(account: any, currentUserId?: string, now: Date = new Date()) {
    const amount = Number(account.payrollAmount);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Buscar o crear categoría 'Nómina' para el hogar
      let category = await tx.category.findFirst({
        where: {
          householdId: account.householdId,
          name: { in: ['Nómina', 'Nomina', 'Salario', 'Sueldo'], mode: 'insensitive' },
        },
      });

      if (!category) {
        category = await tx.category.create({
          data: {
            householdId: account.householdId,
            name: 'Nómina',
            icon: '💼',
            color: '#10B981',
          },
        });
      }

      // 2. Crear transacción de ingreso
      const freqLabel = account.payrollFrequency === PayrollFrequency.BIWEEKLY ? 'quincenal' : 'mensual';
      const transaction = await tx.transaction.create({
        data: {
          householdId: account.householdId,
          accountId: account.id,
          categoryId: category.id,
          type: TransactionType.INCOME,
          amount,
          description: `Ingreso automático de nómina ${freqLabel} (${account.name})`,
          date: now,
          createdById: currentUserId || null,
        },
      });

      // 3. Incrementar saldo de la cuenta y actualizar marca de tiempo
      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: {
          balance: { increment: amount },
          lastPayrollDeposit: now,
        },
      });

      return { transaction, updatedAccount };
    });

    this.logger.log(`Abono automático de nómina aplicado: $${amount} a cuenta ${account.name} (${account.id})`);

    // Notificaciones en tiempo real
    this.eventsGateway.notifyHouseholdChange(account.householdId, 'transaction', 'CREATE');
    this.eventsGateway.notifyHouseholdChange(account.householdId, 'account', 'UPDATE');

    return result;
  }

  /**
   * Procesa nóminas automáticas pendientes.
   * Si se especifica householdId, solo evalúa ese hogar; si no, evalúa todos.
   */
  async processPendingPayroll(householdId?: string): Promise<number> {
    const where: any = {
      type: AccountType.PAYROLL,
      payrollAutoDeposit: true,
      payrollAmount: { gt: 0 },
    };
    if (householdId) {
      where.householdId = householdId;
    }

    const payrollAccounts = await this.prisma.account.findMany({ where });
    let processedCount = 0;
    const now = new Date();

    for (const acc of payrollAccounts) {
      if (this.isPayrollDue(acc, now)) {
        try {
          await this.executePayrollDeposit(acc, undefined, now);
          processedCount++;
        } catch (err) {
          this.logger.error(`Error procesando nómina automática para cuenta ${acc.id}:`, err);
        }
      }
    }

    return processedCount;
  }

  /**
   * Permite al usuario forzar el abono manual de la nómina en cualquier momento
   * (por ejemplo, si la empresa pagó antes de un fin de semana o festivo).
   */
  async manualPayrollDeposit(householdId: string, accountId: string, currentUserId?: string) {
    const account = await this.findOne(householdId, accountId);

    const amount = Number(account.payrollAmount || 0);
    if (amount <= 0) {
      throw new BadRequestException('Esta cuenta no tiene configurado un monto de nómina válido.');
    }

    const { transaction, updatedAccount } = await this.executePayrollDeposit(account, currentUserId, new Date());

    return {
      message: `Nómina de $${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} acreditada exitosamente.`,
      transaction,
      account: updatedAccount,
    };
  }

  async findAllByHousehold(householdId: string) {
    // Procesar cualquier nómina pendiente antes de retornar las cuentas
    try {
      await this.processPendingPayroll(householdId);
    } catch (err) {
      this.logger.error(`Error al procesar nóminas automáticas en findAllByHousehold:`, err);
    }

    return this.prisma.account.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(householdId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, householdId },
    });

    if (!account) {
      throw new NotFoundException('Cuenta no encontrada');
    }

    return account;
  }

  async create(householdId: string, dto: CreateAccountDto) {
    return this.prisma.account.create({
      data: {
        householdId,
        name: dto.name,
        type: dto.type,
        balance: dto.balance ?? 0.0,
        currency: dto.currency || 'USD',
        payrollAmount: dto.payrollAmount ?? null,
        payrollFrequency: dto.payrollFrequency ?? null,
        payrollDay1: dto.payrollDay1 ?? null,
        payrollDay2: dto.payrollDay2 ?? null,
        payrollAutoDeposit: dto.payrollAutoDeposit ?? (dto.type === AccountType.PAYROLL),
      },
    });
  }

  async update(householdId: string, accountId: string, dto: UpdateAccountDto) {
    await this.findOne(householdId, accountId);

    return this.prisma.account.update({
      where: { id: accountId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.balance !== undefined && { balance: dto.balance }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.payrollAmount !== undefined && { payrollAmount: dto.payrollAmount }),
        ...(dto.payrollFrequency !== undefined && { payrollFrequency: dto.payrollFrequency }),
        ...(dto.payrollDay1 !== undefined && { payrollDay1: dto.payrollDay1 }),
        ...(dto.payrollDay2 !== undefined && { payrollDay2: dto.payrollDay2 }),
        ...(dto.payrollAutoDeposit !== undefined && { payrollAutoDeposit: dto.payrollAutoDeposit }),
      },
    });
  }

  async delete(householdId: string, accountId: string) {
    await this.findOne(householdId, accountId);

    return this.prisma.account.delete({
      where: { id: accountId },
    });
  }
}
