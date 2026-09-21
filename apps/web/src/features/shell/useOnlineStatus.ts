import { useEffect, useState } from 'react';

const currentStatus = (): boolean =>
  typeof navigator === 'undefined' ? true : navigator.onLine;

export const useOnlineStatus = (): boolean => {
  const [online, setOnline] = useState(currentStatus);
  useEffect(() => {
    const markOnline = (): void => {
      setOnline(true);
    };
    const markOffline = (): void => {
      setOnline(false);
    };
    window.addEventListener('online', markOnline);
    window.addEventListener('offline', markOffline);
    return () => {
      window.removeEventListener('online', markOnline);
      window.removeEventListener('offline', markOffline);
    };
  }, []);
  return online;
};
