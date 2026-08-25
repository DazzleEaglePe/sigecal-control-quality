import {
  EquipmentStatus,
  ParameterType,
} from '../../src/generated/prisma/enums.js';
import { seedId } from './helpers.js';
import type { SeedTransaction } from './types.js';

const AREAS = [
  { code: 'CALIDAD', name: 'Calidad' },
  { code: 'LABORATORIO', name: 'Laboratorio' },
  { code: 'PRODUCCION', name: 'Producción' },
] as const;

const GRAPE_VARIETIES = [
  ['QUEBRANTA', 'Quebranta'],
  ['ITALIA', 'Italia'],
  ['TORONTEL', 'Torontel'],
  ['MOSCATEL', 'Moscatel'],
  ['ALBILLA', 'Albilla'],
  ['NEGRA_CRIOLLA', 'Negra Criolla'],
  ['UVINA', 'Uvina'],
  ['MOLLAR', 'Mollar'],
] as const;

const PISCO_TYPES = [
  ['PURO', 'Puro'],
  ['ACHOLADO', 'Acholado'],
  ['MOSTO_VERDE', 'Mosto Verde'],
] as const;

const PROCESS_STAGES = [
  ['RECEPCION_UVA', 'Recepción de uva'],
  ['MOLIENDA_DESPALILLADO', 'Molienda/Despalillado'],
  ['FERMENTACION', 'Fermentación'],
  ['DESTILACION', 'Destilación'],
  ['REPOSO', 'Reposo'],
  ['EMBOTELLADO', 'Embotellado'],
] as const;

const SENSORY_ATTRIBUTES = [
  ['INTENSIDAD_AROMATICA', 'Intensidad aromática'],
  ['CALIDAD_AROMATICA', 'Calidad aromática'],
  ['SABOR', 'Sabor'],
  ['CUERPO', 'Cuerpo'],
  ['PERSISTENCIA', 'Persistencia'],
  ['ARMONIA', 'Armonía'],
] as const;

const PARAMETERS = [
  ['GRAD_ALC', 'Grado alcohólico', '% vol.', 2],
  ['ACIDEZ_VOL', 'Acidez volátil', 'g/L', 3],
  ['METANOL', 'Metanol', 'mg/100 mL A.A.', 2],
  ['ESTERES', 'Ésteres', 'mg/100 mL A.A.', 2],
  ['FURFURAL', 'Furfural', 'mg/100 mL A.A.', 3],
  ['BRIX', 'Sólidos solubles', '°Brix', 2],
  ['TEMPERATURA', 'Temperatura', '°C', 1],
  ['PH', 'pH', 'pH', 2],
] as const;

const EQUIPMENT = [
  ['DEMO-DENS-01', 'Densímetro de demostración'],
  ['DEMO-PH-01', 'Medidor de pH de demostración'],
  ['DEMO-REFR-01', 'Refractómetro de demostración'],
] as const;

const seedAreas = async (tx: SeedTransaction): Promise<void> => {
  for (const area of AREAS) {
    await tx.area.upsert({
      where: { code: area.code },
      create: { id: seedId(`area:${area.code}`), ...area, isProvisional: true },
      update: { name: area.name, isActive: true, isProvisional: true },
    });
  }
};

const seedGrapeVarieties = async (tx: SeedTransaction): Promise<void> => {
  for (const [code, name] of GRAPE_VARIETIES) {
    await tx.grapeVariety.upsert({
      where: { code },
      create: { id: seedId(`variety:${code}`), code, name },
      update: { name, isActive: true },
    });
  }
};

const seedPiscoTypes = async (tx: SeedTransaction): Promise<void> => {
  for (const [code, name] of PISCO_TYPES) {
    await tx.piscoType.upsert({
      where: { code },
      create: { id: seedId(`pisco-type:${code}`), code, name },
      update: { name, isActive: true },
    });
  }
};

const seedProcessStages = async (tx: SeedTransaction): Promise<void> => {
  for (const [index, [code, name]] of PROCESS_STAGES.entries()) {
    const sequence = index + 1;
    await tx.processStage.upsert({
      where: { code },
      create: { id: seedId(`stage:${code}`), code, name, sequence },
      update: { name, sequence, isActive: true },
    });
  }
};

const seedSensoryAttributes = async (tx: SeedTransaction): Promise<void> => {
  for (const [index, [code, name]] of SENSORY_ATTRIBUTES.entries()) {
    const sequence = index + 1;
    await tx.sensoryAttribute.upsert({
      where: { code },
      create: { id: seedId(`sensory-attribute:${code}`), code, name, sequence },
      update: { name, sequence, isActive: true },
    });
  }
};

const seedParameters = async (tx: SeedTransaction): Promise<void> => {
  for (const [code, name, unit, decimals] of PARAMETERS) {
    await tx.parameter.upsert({
      where: { code },
      create: {
        id: seedId(`parameter:${code}`),
        code,
        name,
        unit,
        decimals,
        type: ParameterType.FISICOQUIMICO,
      },
      update: { name, unit, decimals, isActive: true },
    });
  }
};

const seedEquipment = async (tx: SeedTransaction): Promise<void> => {
  for (const [code, name] of EQUIPMENT) {
    await tx.equipment.upsert({
      where: { code },
      create: {
        id: seedId(`equipment:${code}`),
        code,
        name,
        status: EquipmentStatus.OPERATIVO,
        lastCalibrationRef: 'DEMO-CAL-2026',
        isActive: false,
      },
      update: { name, isActive: false },
    });
  }
};

export const seedCatalogs = async (tx: SeedTransaction): Promise<void> => {
  await seedAreas(tx);
  await seedGrapeVarieties(tx);
  await seedPiscoTypes(tx);
  await seedProcessStages(tx);
  await seedSensoryAttributes(tx);
  await seedParameters(tx);
  await seedEquipment(tx);
};
