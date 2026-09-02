import { AuthLayout } from '../components/AuthLayout.js';
import { AccountPasswordForm } from '../features/auth/AccountPasswordForm.js';

export const ActivateAccountPage = (): React.JSX.Element => (
  <AuthLayout
    title="Active su cuenta"
    titleId="activate-title"
    intro="Defina una contraseña personal para completar la invitación."
    footnote="El enlace es temporal y funciona una sola vez"
  >
    <AccountPasswordForm mode="activate" />
  </AuthLayout>
);
