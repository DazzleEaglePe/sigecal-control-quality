import { Toaster as Sonner } from 'sonner';

export const Toaster = (): React.JSX.Element => (
  <Sonner
    closeButton
    richColors
    position="top-right"
    toastOptions={{
      classNames: {
        toast: 'sigecal-toast',
        title: 'sigecal-toast-title',
        description: 'sigecal-toast-description',
        actionButton: 'sigecal-toast-action',
        cancelButton: 'sigecal-toast-cancel',
      },
    }}
  />
);
