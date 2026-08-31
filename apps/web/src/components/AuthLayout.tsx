import { Check, FlaskConical, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  readonly children: ReactNode;
  readonly eyebrow: string;
  readonly footnote: string;
  readonly intro: string;
  readonly title: string;
  readonly titleId: string;
}

const assurances = [
  'Trazabilidad integral de lotes',
  'Estándares de calidad versionados',
  'Resultados finales inmutables',
] as const;

const AuthBrand = (): React.JSX.Element => (
  // <div className="auth-visual-brand">
  //   <span className="auth-brand-mark" aria-hidden="true">
  //     <ShieldCheck />
  //   </span>
  //   <span>
  //     <strong>SIGECAL</strong>
  //     <small>Control de calidad</small>
  //   </span>
  // </div>
  <></>
);

const QualitySignal = (): React.JSX.Element => (
  <div className="quality-signal" aria-hidden="true">
    <div className="quality-signal-grid" />
    <span className="quality-signal-axis is-horizontal" />
    <span className="quality-signal-axis is-vertical" />
    <span className="quality-signal-core">
      <FlaskConical />
    </span>
    <div className="quality-signal-bars">
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  </div>
);

const AuthVisual = (): React.JSX.Element => (
  <section className="auth-visual" aria-label="Capacidades de SIGECAL">
    <AuthBrand />
    <div className="auth-visual-copy">
      <p className="auth-kicker">
        {/* <span aria-hidden="true" /> Evidencia confiable */}
      </p>
      <h2>Control de calidad desde el origen hasta el resultado.</h2>
      <p>
        Centraliza el seguimiento técnico de la elaboración de pisco con reglas
        claras y una trazabilidad preparada para auditoría.
      </p>
      <ul>
        {assurances.map((assurance) => (
          <li key={assurance}>
            <Check aria-hidden="true" /> {assurance}
          </li>
        ))}
      </ul>
    </div>
    <QualitySignal />
    <small className="auth-visual-footer">Viña Tacama S.A. · Ica, Perú</small>
  </section>
);

export const AuthLayout = ({
  children,
  eyebrow,
  footnote,
  intro,
  title,
  titleId,
}: AuthLayoutProps): React.JSX.Element => (
  <main className="auth-screen">
    <AuthVisual />
    <div className="auth-panel">
      {/* Es <section> y no <div> para que aria-labelledby exponga el título
          como nombre accesible de la región del formulario. */}
      <section className="auth-card" aria-labelledby={titleId}>
        <div className="auth-card-brand" aria-hidden="true">
          {/* <ShieldCheck />
          <span>SIGECAL</span> */}
        </div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 id={titleId}>{title}</h1>
        <p className="auth-intro">{intro}</p>
        {children}
        <small className="auth-footnote">{footnote}</small>
      </section>
    </div>
  </main>
);
