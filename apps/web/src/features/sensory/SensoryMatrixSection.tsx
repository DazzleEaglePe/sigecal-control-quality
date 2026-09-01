import type { SensoryPreparation } from '@sigecal/shared';
import { Input } from '../../components/ui/input.js';
import { NativeSelect } from '../../components/ui/native-select.js';
import { attributeAverage, type PanelistDraft } from './sensory-form-state.js';
import type { SensoryDraft } from './useSensoryForm.js';

type Attribute = SensoryPreparation['attributes'][number];
const ScoreSelect = ({
  form,
  panelist,
  attribute,
}: {
  readonly form: SensoryDraft;
  readonly panelist: PanelistDraft;
  readonly attribute: Attribute;
}) => (
  <NativeSelect
    aria-label="Calificación"
    value={panelist.scores[attribute.id] ?? ''}
    onChange={(event) => {
      form.patch(panelist.key, {
        scores: {
          ...panelist.scores,
          [attribute.id]: Number(event.target.value),
        },
      });
    }}
  >
    <option value="">—</option>
    {[1, 2, 3, 4, 5].map((score) => (
      <option key={score}>{score}</option>
    ))}
  </NativeSelect>
);
const DescriptorInput = ({
  form,
  panelist,
  attribute,
}: {
  readonly form: SensoryDraft;
  readonly panelist: PanelistDraft;
  readonly attribute: Attribute;
}) => (
  <Input
    aria-label={`Descriptor de ${attribute.name}`}
    placeholder="Descriptor opcional"
    value={panelist.descriptors[attribute.id] ?? ''}
    onChange={(event) => {
      form.patch(panelist.key, {
        descriptors: {
          ...panelist.descriptors,
          [attribute.id]: event.target.value,
        },
      });
    }}
  />
);
const ScoreCell = ({
  form,
  panelist,
  attribute,
}: {
  readonly form: SensoryDraft;
  readonly panelist: PanelistDraft;
  readonly attribute: Attribute;
}) => (
  <td>
    <ScoreSelect form={form} panelist={panelist} attribute={attribute} />
    <DescriptorInput form={form} panelist={panelist} attribute={attribute} />
  </td>
);
const MatrixRow = ({
  form,
  attribute,
}: {
  readonly form: SensoryDraft;
  readonly attribute: Attribute;
}) => (
  <tr>
    <th>{attribute.name}</th>
    {form.panelists.map((panelist) => (
      <ScoreCell
        key={panelist.key}
        form={form}
        panelist={panelist}
        attribute={attribute}
      />
    ))}
    <td>
      <strong>
        {attributeAverage(form.panelists, attribute.id)?.toFixed(2) ?? '—'}
      </strong>
    </td>
  </tr>
);
export const SensoryMatrixSection = ({
  form,
  preparation,
}: {
  readonly form: SensoryDraft;
  readonly preparation: SensoryPreparation;
}) => (
  <div className="sensory-matrix-wrap">
    <table className="sensory-matrix">
      <thead>
        <tr>
          <th>Atributo</th>
          {form.panelists.map((_, index) => (
            <th key={index}>Panelista {index + 1}</th>
          ))}
          <th>Promedio del producto</th>
        </tr>
      </thead>
      <tbody>
        {preparation.attributes.map((attribute) => (
          <MatrixRow key={attribute.id} form={form} attribute={attribute} />
        ))}
      </tbody>
    </table>
  </div>
);
