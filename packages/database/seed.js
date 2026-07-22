const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = 'hogariq_dev_salt';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

async function main() {
  const email = 'angellafraga@gmail.con';
  const password = 'admin123';
  const passwordHash = hashPassword(password);

  console.log(`Sembrando datos completos para el hogar de ${email}...`);

  const household = await prisma.household.upsert({
    where: { id: 'admin-household-uuid-112233' },
    update: {},
    create: {
      id: 'admin-household-uuid-112233',
      name: 'Hogar de Angela',
    },
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      fullName: 'Angela Fraga',
      passwordHash,
    },
  });

  await prisma.householdMember.upsert({
    where: {
      userId_householdId: {
        userId: user.id,
        householdId: household.id,
      },
    },
    update: { role: 'ADMIN' },
    create: {
      userId: user.id,
      householdId: household.id,
      role: 'ADMIN',
    },
  });

  // Categorías
  await prisma.category.deleteMany({ where: { householdId: household.id } });
  const defaultCategories = [
    { name: 'Supermercado', icon: '🛒', color: '#8B5CF6' },
    { name: 'Transporte', icon: '🚗', color: '#10B981' },
    { name: 'Servicios', icon: '💡', color: '#3B82F6' },
    { name: 'Suscripciones', icon: '📺', color: '#EC4899' },
    { name: 'Ahorros', icon: '🏦', color: '#F59E0B' },
  ];

  const createdCats = [];
  for (const cat of defaultCategories) {
    const c = await prisma.category.create({
      data: {
        householdId: household.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
      },
    });
    createdCats.push(c);
  }

  // 1. Recordatorios
  await prisma.reminder.deleteMany({ where: { householdId: household.id } });
  const remindersData = [
    { title: 'Pago de luz', amount: 2500, dueDate: new Date(Date.now() + 5 * 86400000) },
    { title: 'Pago del colegio', amount: 8500, dueDate: new Date(Date.now() + 8 * 86400000) },
    { title: 'Tarjeta de Crédito', amount: 15000, dueDate: new Date(Date.now() + 12 * 86400000) },
    { title: 'Hipoteca Vivienda', amount: 28000, dueDate: new Date(Date.now() + 15 * 86400000) },
    { title: 'Impuestos Municipales', amount: 4200, dueDate: new Date(Date.now() + 20 * 86400000) },
  ];
  for (const r of remindersData) {
    await prisma.reminder.create({
      data: { householdId: household.id, title: r.title, amount: r.amount, dueDate: r.dueDate },
    });
  }

  // 2. Presupuesto Mensual por Categoría
  await prisma.budget.deleteMany({ where: { householdId: household.id } });
  const superCat = createdCats.find(c => c.name === 'Supermercado') || createdCats[0];
  await prisma.budget.create({
    data: {
      householdId: household.id,
      categoryId: superCat.id,
      limitAmount: 18000,
      period: 'MONTHLY',
      startDate: new Date(),
    },
  });

  // 3. Metas de Ahorro
  await prisma.savingsGoal.deleteMany({ where: { householdId: household.id } });
  const goalsData = [
    { name: 'Comprar carro', targetAmount: 600000, currentAmount: 150000, targetDate: new Date('2027-12-31') },
    { name: 'Viaje familiar', targetAmount: 120000, currentAmount: 45000, targetDate: new Date('2026-11-30') },
    { name: 'Inicial apartamento', targetAmount: 1200000, currentAmount: 300000, targetDate: new Date('2028-06-30') },
    { name: 'Laptop Trabajo', targetAmount: 85000, currentAmount: 60000, targetDate: new Date('2026-09-30') },
    { name: 'Fondo de Emergencia', targetAmount: 200000, currentAmount: 110000, targetDate: new Date('2026-12-31') },
  ];
  for (const g of goalsData) {
    await prisma.savingsGoal.create({
      data: { householdId: household.id, ...g },
    });
  }

  // 4. Deudas
  await prisma.debt.deleteMany({ where: { householdId: household.id } });
  const debtsData = [
    { contactName: 'Préstamo Vehículo', type: 'OWED_BY_ME', totalAmount: 350000, remainingAmount: 180000, interestRate: 12 },
    { contactName: 'Tarjeta Gold', type: 'OWED_BY_ME', totalAmount: 45000, remainingAmount: 15000, interestRate: 24 },
    { contactName: 'Hipoteca Banco', type: 'OWED_BY_ME', totalAmount: 3500000, remainingAmount: 2800000, interestRate: 8 },
    { contactName: 'Préstamo Amigo Juan', type: 'OWED_BY_ME', totalAmount: 10000, remainingAmount: 3000, interestRate: 0 },
  ];
  for (const d of debtsData) {
    await prisma.debt.create({
      data: { householdId: household.id, ...d },
    });
  }

  // 5. Suscripciones
  await prisma.subscription.deleteMany({ where: { householdId: household.id } });
  const subsData = [
    { name: 'Netflix', cost: 15.99, nextBillingDate: new Date(Date.now() + 7 * 86400000) },
    { name: 'Spotify', cost: 9.99, nextBillingDate: new Date(Date.now() + 10 * 86400000) },
    { name: 'Disney+', cost: 13.99, nextBillingDate: new Date(Date.now() + 14 * 86400000) },
    { name: 'Amazon Prime', cost: 14.99, nextBillingDate: new Date(Date.now() + 18 * 86400000) },
    { name: 'ChatGPT Plus', cost: 20.00, nextBillingDate: new Date(Date.now() + 22 * 86400000) },
    { name: 'Dominio Web', cost: 1.50, nextBillingDate: new Date(Date.now() + 25 * 86400000) },
    { name: 'Hosting Cloud', cost: 12.00, nextBillingDate: new Date(Date.now() + 28 * 86400000) },
  ];
  for (const s of subsData) {
    await prisma.subscription.create({
      data: { householdId: household.id, ...s },
    });
  }

  // 6. Activos (Patrimonio)
  await prisma.asset.deleteMany({ where: { householdId: household.id } });
  const assetsData = [
    { name: 'Vehículo SUV', type: 'VEHICLE', value: 650000 },
    { name: 'Casa Principal', type: 'REAL_ESTATE', value: 4500000 },
    { name: 'Fondo de Inversiones', type: 'INVESTMENT', value: 450000 },
    { name: 'Portafolio Criptomonedas', type: 'CRYPTO', value: 85000 },
    { name: 'Efectivo Reserva', type: 'CASH_OTHER', value: 50000 },
  ];
  for (const a of assetsData) {
    await prisma.asset.create({
      data: { householdId: household.id, ...a },
    });
  }

  console.log('¡Sembrado de datos financieros completado con éxito!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
