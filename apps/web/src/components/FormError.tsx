interface FormErrorProps {
  readonly children: React.ReactNode;
}

export const FormError = ({ children }: FormErrorProps): React.JSX.Element => (
  <p className="form-error" role="alert">
    {children}
  </p>
);
