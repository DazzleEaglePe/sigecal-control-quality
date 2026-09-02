import { AuthLayout } from '../components/AuthLayout.js';
import { AccountPasswordForm } from '../features/auth/AccountPasswordForm.js';

export const ResetPasswordPage = (): React.JSX.Element => (
  <AuthLayout
    title="Restablezca su contraseña"
    titleId="reset-title"
    intro="Defina una contraseña nueva para recuperar el acceso."
    footnote="Al finalizar se cerrarán las sesiones anteriores"
  >
    <AccountPasswordForm mode="reset" />
  </AuthLayout>
);
