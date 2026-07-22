import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto } from './accounts.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async findAllByHousehold(householdId: string) {
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
      },
    });
  }

  async update(householdId: string, accountId: string, dto: UpdateAccountDto) {
    await this.findOne(householdId, accountId);

    return this.prisma.account.update({
      where: { id: accountId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.type && { type: dto.type }),
        ...(dto.balance !== undefined && { balance: dto.balance }),
        ...(dto.currency && { currency: dto.currency }),
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
