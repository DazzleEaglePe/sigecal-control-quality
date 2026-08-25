import { fileURLToPath } from 'node:url';

import { PrismaPg } from '@prisma/adapter-pg';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

import { DataOrigin } from '../src/generated/prisma/enums.js';
import { PrismaClient } from '../src/generated/prisma/client.js';

loadEnv({
  path: fileURLToPath(new URL('../../../.env', import.meta.url)),
  quiet: true,
});

const { DATABASE_URL } = z.object({ DATABASE_URL: z.url() }).parse(process.env);
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: DATABASE_URL }),
});

const verify = async (): Promise<void> => {
  const [users, batches, results, nonConformities, unsafeRealResults] =
    await Promise.all([
      prisma.user.count(),
      prisma.batch.count({ where: { dataOrigin: DataOrigin.DEMO } }),
      prisma.physChemResult.count({ where: { dataOrigin: DataOrigin.DEMO } }),
      prisma.nonConformity.count({ where: { dataOrigin: DataOrigin.DEMO } }),
      prisma.physChemResult.count({
        where: {
          dataOrigin: DataOrigin.REAL,
          standard: { isProvisional: true },
        },
      }),
    ]);
  const summary = {
    users,
    demoBatches: batches,
    demoResults: results,
    demoNC: nonConformities,
  };
  if (users < 4 || batches !== 5 || results < 8 || nonConformities < 2) {
    throw new Error(`Seed incompleto: ${JSON.stringify(summary)}`);
  }
  if (unsafeRealResults !== 0) {
    throw new Error(
      'Existen resultados REAL asociados a estándares provisionales.',
    );
  }
  process.stdout.write(`${JSON.stringify(summary)}\n`);
};

try {
  await verify();
} finally {
  await prisma.$disconnect();
}
