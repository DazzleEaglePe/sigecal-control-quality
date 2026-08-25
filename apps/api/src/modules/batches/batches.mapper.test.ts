import { describe, expect, it } from 'vitest';
import { BatchTimelineResponseSchema } from '@sigecal/shared';

import { toTimeline } from './batches.mapper.js';

const STAGE_ID = '11111111-1111-4111-a111-111111111111';
const INSPECTION_ID = '22222222-2222-4222-a222-222222222222';

describe('toTimeline', () => {
  it('expone inspecciones sin campos internos fuera del contrato', () => {
    const data = toTimeline(
      {
        stages: [
          {
            id: STAGE_ID,
            code: 'REPOSO',
            name: 'Reposo',
            sequence: 5,
          },
        ],
        visits: [],
        inspections: [
          {
            id: INSPECTION_ID,
            code: 'INS-2026-0005',
            stageId: STAGE_ID,
            type: 'FISICOQUIMICO',
            status: 'COMPLETADA',
            scheduledDate: new Date('2026-08-24T15:00:00.000Z'),
          },
        ],
        nonConformities: [],
      },
      STAGE_ID,
    );

    const response = BatchTimelineResponseSchema.parse({ success: true, data });
    expect(response.data[0]?.inspections[0]).toEqual({
      id: INSPECTION_ID,
      code: 'INS-2026-0005',
      type: 'FISICOQUIMICO',
      status: 'COMPLETADA',
      scheduledDate: '2026-08-24T15:00:00.000Z',
    });
  });
});
