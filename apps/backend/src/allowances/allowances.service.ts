import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AllowancesService {
  constructor(private prisma: PrismaService) {}

  async findAll(householdId: string) {
    return this.prisma.allowance.findMany({
      where: { householdId },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(householdId: string, data: { memberId: string; title: string; limitAmount: number }) {
    return this.prisma.allowance.create({
      data: {
        householdId,
        memberId: data.memberId,
        title: data.title,
        limitAmount: data.limitAmount,
        spentAmount: 0,
      },
    });
  }

  async remove(id: string, householdId: string) {
    return this.prisma.allowance.deleteMany({
      where: { id, householdId },
    });
  }
}
