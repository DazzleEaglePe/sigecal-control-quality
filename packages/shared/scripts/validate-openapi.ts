import { fileURLToPath } from 'node:url';

import SwaggerParser from '@apidevtools/swagger-parser';

const openApiPath = fileURLToPath(
  new URL('../../../docs/openapi.yaml', import.meta.url),
);

await SwaggerParser.validate(openApiPath);
process.stdout.write(`OpenAPI válido: ${openApiPath}\n`);
