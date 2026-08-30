import { z } from 'zod';

import { createApiSuccessSchema } from './contracts.js';
import {
  InspectionParameterSchema,
  InspectionSchema,
} from './inspections.schemas.js';
import {
  PhysChemResultSchema,
  StandardAppliedSchema,
} from './physchem.schemas.js';

export const InspectionParameterDetailSchema = z
  .object({
    parameter: InspectionParameterSchema,
    applicableStandard: StandardAppliedSchema.nullable(),
    currentResult: PhysChemResultSchema.nullable(),
    history: z.array(PhysChemResultSchema),
  })
  .strict();

export const InspectionDetailSchema = InspectionSchema.extend({
  parameterDetails: z.array(InspectionParameterDetailSchema),
}).strict();

export const InspectionDetailResponseSchema = createApiSuccessSchema(
  InspectionDetailSchema,
);

export type InspectionDetail = z.infer<typeof InspectionDetailSchema>;
