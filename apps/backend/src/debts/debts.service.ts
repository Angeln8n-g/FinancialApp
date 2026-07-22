import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DebtsService {
  constructor(private prisma: PrismaService) {}

  async findAll(householdId: string) {
    const debts = await this.prisma.debt.findMany({
      where: { householdId },
      orderBy: { remainingAmount: 'desc' },
    });

    return debts.map(d => ({
      id: d.id,
      contactName: d.contactName,
      type: d.type,
      totalAmount: Number(d.totalAmount),
      remainingAmount: Number(d.remainingAmount),
      interestRate: Number(d.interestRate),
      dueDate: d.dueDate,
    }));
  }

  async create(
    householdId: string,
    data: { contactName: string; totalAmount: number; remainingAmount: number; interestRate?: number },
  ) {
    return this.prisma.debt.create({
      data: {
        householdId,
        contactName: data.contactName,
        type: 'OWED_BY_ME',
        totalAmount: data.totalAmount,
        remainingAmount: data.remainingAmount,
        interestRate: data.interestRate || 0,
      },
    });
  }

  async delete(householdId: string, debtId: string) {
    return this.prisma.debt.deleteMany({
      where: { id: debtId, householdId },
    });
  }
}
