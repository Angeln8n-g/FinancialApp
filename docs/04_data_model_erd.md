# Modelo de Datos y ERD: HogarIQ

HogarIQ utiliza una base de datos relacional **PostgreSQL** administrada por **Supabase** y modelada a través del ORM **Prisma**. El diseño prioriza la separación por hogares (`Household`) para habilitar la colaboración familiar de forma natural y segura.

---

## 1. Esquema Relacional de Base de Datos

```
+----------------+      +-------------------+      +------------------+
|      User      |----->|   HouseholdMember |<-----|    Household     |
| (Auth ID, Nom) |      | (Rol, Invitación) |      | (ID, Nombre)     |
+----------------+      +-------------------+      +------------------+
                                                            |
                                    +-----------------------+-----------------------+
                                    |                       |                       |
                                    v                       v                       v
+------------------+      +------------------+      +---------------+      +-----------------+
|     Account      |<-----|   Transaction    |----->|   Category    |      |     Budget      |
| (Nombre, Tipo)   |      | (Monto, Fecha)   |      | (Nombre, Icon)|      | (Monto, Límite) |
+------------------+      +------------------+      +---------------+      +-----------------+
                                    |
                                    v
                          +------------------+
                          |   VectorEmbed    |
                          | (pgvector index) |
                          +------------------+
```

---

## 2. Esquema de Prisma (`schema.prisma`)

A continuación se detalla el archivo de definición de Prisma que se utilizará en el monorepo.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  COLLABORATOR
  VIEWER
}

enum AccountType {
  CASH
  BANK_ACCOUNT
  CREDIT_CARD
  INVESTMENT
  SAVINGS
}

enum TransactionType {
  INCOME
  EXPENSE
  TRANSFER
}

enum DebtType {
  OWED_TO_ME
  OWED_BY_ME
}

enum RecurrencePeriod {
  WEEKLY
  MONTHLY
  YEARLY
}

model User {
  id               String            @id @default(uuid())
  email            String            @unique
  fullName         String?
  avatarUrl        String?
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  memberships      HouseholdMember[]
  auditLogs        AuditLog[]
  sessions         Session[]
}

model Household {
  id            String            @id @default(uuid())
  name          String
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
  members       HouseholdMember[]
  accounts      Account[]
  categories    Category[]
  budgets       Budget[]
  savingsGoals  SavingsGoal[]
  debts         Debt[]
  subscriptions Subscription[]
  auditLogs     AuditLog[]
}

model HouseholdMember {
  id           String     @id @default(uuid())
  userId       String
  householdId  String
  role         Role       @default(COLLABORATOR)
  joinedAt     DateTime   @default(now())
  
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  household    Household  @relation(fields: [householdId], references: [id], onDelete: Cascade)

  @@unique([userId, householdId])
}

model Account {
  id            String       @id @default(uuid())
  householdId   String
  name          String
  type          AccountType
  balance       Decimal      @default(0.00) @db.Decimal(12, 2)
  currency      String       @default("USD")
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  household     Household    @relation(fields: [householdId], references: [id], onDelete: Cascade)
  transactions  Transaction[]
  transfersTo   Transaction[] @relation("TransferToRelation")
}

model Category {
  id            String        @id @default(uuid())
  householdId   String?       // Opcional para categorías globales predefinidas
  name          String
  icon          String
  color         String
  createdAt     DateTime      @default(now())

  household     Household?    @relation(fields: [householdId], references: [id], onDelete: Cascade)
  transactions  Transaction[]
  budgets       Budget[]
}

model Transaction {
  id                String          @id @default(uuid())
  accountId         String
  destinationAccountId String?      // Para transferencias
  categoryId        String?
  householdId       String
  type              TransactionType
  amount            Decimal         @db.Decimal(12, 2)
  description       String?
  date              DateTime
  isCleared         Boolean         @default(true)
  ocrProcessed      Boolean         @default(false)
  ocrTextRaw        String?         @db.Text
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  account           Account         @relation(fields: [accountId], references: [id], onDelete: Cascade)
  destinationAccount Account?       @relation("TransferToRelation", fields: [destinationAccountId], references: [id])
  category          Category?       @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  embedding         TransactionEmbedding?
}

model TransactionEmbedding {
  id            String      @id @default(uuid())
  transactionId String      @unique
  embedding     Unsupported("vector(384)") // Requiere la extensión pgvector activa
  transaction   Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
}

model Budget {
  id            String      @id @default(uuid())
  householdId   String
  categoryId    String
  limitAmount   Decimal     @db.Decimal(12, 2)
  period        RecurrencePeriod @default(MONTHLY)
  startDate     DateTime
  endDate       DateTime?

  household     Household   @relation(fields: [householdId], references: [id], onDelete: Cascade)
  category      Category    @relation(fields: [categoryId], references: [id], onDelete: Cascade)
}

model SavingsGoal {
  id            String      @id @default(uuid())
  householdId   String
  name          String
  targetAmount  Decimal     @db.Decimal(12, 2)
  currentAmount Decimal     @default(0.00) @db.Decimal(12, 2)
  targetDate    DateTime?
  createdAt     DateTime    @default(now())

  household     Household   @relation(fields: [householdId], references: [id], onDelete: Cascade)
}

model Debt {
  id            String      @id @default(uuid())
  householdId   String
  contactName   String
  type          DebtType
  totalAmount   Decimal     @db.Decimal(12, 2)
  remainingAmount Decimal   @db.Decimal(12, 2)
  dueDate       DateTime?
  interestRate  Decimal     @default(0.00) @db.Decimal(5, 2)
  createdAt     DateTime    @default(now())

  household     Household   @relation(fields: [householdId], references: [id], onDelete: Cascade)
}

model Subscription {
  id            String      @id @default(uuid())
  householdId   String
  name          String
  cost          Decimal     @db.Decimal(10, 2)
  period        RecurrencePeriod @default(MONTHLY)
  nextBillingDate DateTime
  isActive      Boolean     @default(true)
  createdAt     DateTime    @default(now())

  household     Household   @relation(fields: [householdId], references: [id], onDelete: Cascade)
}

model AuditLog {
  id            String      @id @default(uuid())
  userId        String
  householdId   String
  action        String      // ej. "CREATE_TRANSACTION", "DELETE_BUDGET"
  details       String?     @db.Text
  timestamp     DateTime    @default(now())

  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  household     Household   @relation(fields: [householdId], references: [id], onDelete: Cascade)
}

model Session {
  id            String      @id @default(uuid())
  userId        String
  token         String      @unique
  userAgent     String?
  ipAddress     String?
  expiresAt     DateTime
  createdAt     DateTime    @default(now())

  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 3. Políticas de Seguridad de Base de Datos (RLS)

Al utilizar **Supabase** como proveedor de base de datos base, se deben activar las políticas de seguridad a nivel de fila (Row Level Security - RLS).
Cualquier consulta sobre cuentas, presupuestos o transacciones debe restringirse para que solo los miembros autorizados del hogar (`HouseholdMember`) tengan acceso.

### Ejemplo de Política SQL para RLS en Postgres:
```sql
-- Habilitar RLS en la tabla Account
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;

-- Crear política que permite ver cuentas solo si el usuario pertenece al Household
CREATE POLICY select_account_policy ON "Account"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "HouseholdMember"
    WHERE "HouseholdMember".household_id = "Account".household_id
    AND "HouseholdMember".user_id = auth.uid()
  )
);
```
Esta política garantiza que ningún usuario pueda realizar consultas a cuentas de hogares ajenos, aun si el endpoint en el backend careciese de validaciones de negocio.
