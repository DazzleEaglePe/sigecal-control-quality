import { fileURLToPath } from 'node:url';

import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

import { PrismaClient } from '../src/generated/prisma/client.js';
import { seedCatalogs } from './seed/catalogs.seed.js';
import { seedDemoBatches } from './seed/demo-batches.seed.js';
import { seedDemoQuality } from './seed/demo-quality.seed.js';
import { seedDemoSensory } from './seed/demo-sensory.seed.js';
import { seedStandards } from './seed/standards.seed.js';
import { seedUsers } from './seed/users.seed.js';

loadEnv({
  path: fileURLToPath(new URL('../../../.env', import.meta.url)),
  quiet: true,
});

const environment = z
  .object({
    DATABASE_URL: z.url(),
    SEED_ADMIN_EMAIL: z.email(),
    SEED_DEFAULT_PASSWORD: z.string().min(8),
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15),
  })
  .parse(process.env);

const adapter = new PrismaPg({ connectionString: environment.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const main = async (): Promise<void> => {
  const passwordHash = await hash(
    environment.SEED_DEFAULT_PASSWORD,
    environment.BCRYPT_ROUNDS,
  );
  await prisma.$transaction(
    async (tx) => {
      await seedCatalogs(tx);
      await seedUsers(tx, {
        adminEmail: environment.SEED_ADMIN_EMAIL,
        passwordHash,
      });
      await seedStandards(tx);
      await seedDemoBatches(tx);
      await seedDemoQuality(tx);
      await seedDemoSensory(tx);
    },
    { timeout: 30_000 },
  );
};

try {
  await main();
  process.stdout.write('Seed de SIGECAL completado.\n');
} finally {
  await prisma.$disconnect();
}
