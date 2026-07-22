import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  // Para desarrollo local usamos pbkdf2 nativo de Node.js
  const salt = 'hogariq_dev_salt';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

async function main() {
  const email = 'angellafraga@gmail.con';
  const password = 'admin123';
  const passwordHash = hashPassword(password);

  console.log(`Sembrando usuario administrador: ${email}...`);

  // Crear o actualizar hogar por defecto
  const household = await prisma.household.upsert({
    where: { id: 'admin-household-uuid-112233' },
    update: {},
    create: {
      id: 'admin-household-uuid-112233',
      name: 'Hogar de Angela',
    },
  });

  // Crear o actualizar usuario
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
    },
    create: {
      email,
      fullName: 'Angela Fraga',
      passwordHash,
    },
  });

  // Crear o actualizar relación de membresía
  await prisma.householdMember.upsert({
    where: {
      userId_householdId: {
        userId: user.id,
        householdId: household.id,
      },
    },
    update: {
      role: 'ADMIN',
    },
    create: {
      userId: user.id,
      householdId: household.id,
      role: 'ADMIN',
    },
  });

  // Eliminar categorías previas para evitar duplicados en reinicios de pruebas
  await prisma.category.deleteMany({
    where: { householdId: household.id },
  });

  // Crear algunas categorías básicas predeterminadas
  const defaultCategories = [
    { name: 'Comida', icon: '🍽️', color: '#FF5733' },
    { name: 'Transporte', icon: '🚗', color: '#33FF57' },
    { name: 'Servicios', icon: '💡', color: '#3357FF' },
    { name: 'Suscripciones', icon: '📺', color: '#F333FF' },
    { name: 'Ahorros', icon: '🏦', color: '#FFC300' },
  ];

  for (const cat of defaultCategories) {
    await prisma.category.create({
      data: {
        householdId: household.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
      },
    });
  }

  console.log('¡Sembrado completado con éxito!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
