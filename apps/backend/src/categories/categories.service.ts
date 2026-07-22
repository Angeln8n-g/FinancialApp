import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAllByHousehold(householdId: string) {
    return this.prisma.category.findMany({
      where: { householdId },
      orderBy: { name: 'asc' },
    });
  }
}
