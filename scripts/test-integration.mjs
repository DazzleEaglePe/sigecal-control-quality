import { execFileSync, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

// PostgreSQL desechable: nunca se toma DATABASE_URL de desarrollo ni se monta su volumen.
const containerName = `sigecal-test-${randomUUID()}`;
let createdId;
const run = (command, args, env = process.env) => {
  const result = spawnSync(command, args, { stdio: 'inherit', env });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`Falló ${command} (${result.status})`);
};

try {
  createdId = execFileSync(
    'docker',
    [
      'run',
      '--detach',
      '--rm',
      '--name',
      containerName,
      '--publish',
      '127.0.0.1::5432',
      '--env',
      'POSTGRES_USER=sigecal_test',
      '--env',
      'POSTGRES_PASSWORD=isolated-test-only',
      '--env',
      'POSTGRES_DB=sigecal_test',
      'postgres:16-alpine',
    ],
    { encoding: 'utf8' },
  ).trim();
  if (!/^[a-f0-9]{64}$/.test(createdId))
    throw new Error('Identificador de contenedor inválido.');
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const probe = spawnSync(
      'docker',
      [
        'exec',
        createdId,
        'pg_isready',
        '-U',
        'sigecal_test',
        '-d',
        'sigecal_test',
      ],
      { stdio: 'ignore' },
    );
    if (probe.status === 0) {
      ready = true;
      break;
    }
    await delay(500);
  }
  if (!ready) throw new Error('PostgreSQL de prueba no inició.');
  const binding = execFileSync('docker', ['port', createdId, '5432/tcp'], {
    encoding: 'utf8',
  }).trim();
  if (!/^127\.0\.0\.1:\d+$/.test(binding))
    throw new Error('Puerto de prueba inesperado.');
  const databaseUrl = `postgresql://sigecal_test:isolated-test-only@${binding}/sigecal_test`;
  const env = {
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: databaseUrl,
    TEST_DATABASE_URL: databaseUrl,
  };
  run('npm', ['run', 'db:migrate:deploy'], env);
  run(
    'npm',
    [
      'run',
      'test',
      '--workspace',
      '@sigecal/api',
      '--',
      'src/test/sprint6.integration.test.ts',
      'src/test/sprint6-nc.integration.test.ts',
    ],
    env,
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (createdId && /^[a-f0-9]{64}$/.test(createdId)) {
    execFileSync('docker', ['rm', '--force', '--volumes', createdId], {
      stdio: 'ignore',
    });
    console.info(
      'Contenedor y datos aislados de prueba eliminados; desarrollo no modificado.',
    );
  }
}
