import { Link } from 'react-router-dom';

export const NotFoundPage = (): React.JSX.Element => (
  <section className="not-found" aria-labelledby="not-found-title">
    <p className="error-number" aria-hidden="true">
      404
    </p>
    <p className="eyebrow">Página no encontrada</p>
    <h1 id="not-found-title">Esta ruta no existe</h1>
    <p>Revisa la dirección o vuelve al tablero para continuar.</p>
    <Link className="primary-button" to="/">
      Volver al tablero
    </Link>
  </section>
);
