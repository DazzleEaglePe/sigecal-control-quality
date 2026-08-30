import type { InspectionDetail } from '@sigecal/shared';

import {
  toAppliedStandard,
  toPhysChemResult,
} from '../physchem/physchem.mapper.js';
import { selectApplicableStandard } from '../physchem/physchem.rules.js';
import { toInspectionItem } from './inspections.mapper.js';
import type { InspectionDetailRecord } from './inspections.types.js';

export const toInspectionDetail = (
  record: InspectionDetailRecord,
): InspectionDetail => {
  const inspection = toInspectionItem(record.inspection);
  return {
    ...inspection,
    parameterDetails: inspection.parameters.map((parameter) => {
      const history = record.results.filter(
        (result) => result.parameterId === parameter.id,
      );
      const current = history.find((result) => result.status !== 'ANULADO');
      const standard = selectApplicableStandard(
        parameter.id,
        record.standards,
        inspection.dataOrigin,
      );
      return {
        parameter,
        applicableStandard: standard ? toAppliedStandard(standard) : null,
        currentResult: current ? toPhysChemResult(current) : null,
        history: history.map(toPhysChemResult),
      };
    }),
  };
};
