import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { NotificationItem } from '@sigecal/shared';

import type { AuthorizedRequest } from '../auth/auth-context.js';
import { useAuth } from '../auth/useAuth.js';
import * as notificationsApi from './notifications-api.js';

const POLL_INTERVAL_MS = 15_000;

const useVisiblePolling = (refresh: () => Promise<void>): void => {
  useEffect(() => {
    const run = () => void refresh();
    const initial = window.setTimeout(run, 0);
    const timer = window.setInterval(run, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', run);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', run);
    };
  }, [refresh]);
};

const useNotificationData = (request: AuthorizedRequest) => {
  const [items, setItems] = useState<readonly NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const refreshCount = useCallback(async () => {
    if (document.visibilityState !== 'visible') return;
    try {
      setUnreadCount(await notificationsApi.unreadNotificationCount(request));
    } catch {
      // El contador no interrumpe la operación del resto del sistema.
    }
  }, [request]);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [nextItems, count] = await Promise.all([
        notificationsApi.listNotifications(request),
        notificationsApi.unreadNotificationCount(request),
      ]);
      setItems(nextItems);
      setUnreadCount(count);
    } catch {
      setError('No fue posible cargar las notificaciones.');
    } finally {
      setLoading(false);
    }
  }, [request]);
  useVisiblePolling(refreshCount);
  return {
    error,
    items,
    loading,
    refresh,
    refreshCount,
    setItems,
    setUnreadCount,
    unreadCount,
  };
};

const useNotificationActions = (
  request: AuthorizedRequest,
  setItems: Dispatch<SetStateAction<readonly NotificationItem[]>>,
  setUnreadCount: Dispatch<SetStateAction<number>>,
  refreshCount: () => Promise<void>,
) => {
  const markRead = useCallback(
    async (id: string) => {
      const updated = await notificationsApi.markNotificationRead(request, id);
      setItems((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      );
      await refreshCount();
    },
    [refreshCount, request, setItems],
  );
  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllNotificationsRead(request);
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
  }, [request, setItems, setUnreadCount]);
  return { markAllRead, markRead };
};

export const useNotifications = () => {
  const { request } = useAuth();
  const data = useNotificationData(request);
  const actions = useNotificationActions(
    request,
    data.setItems,
    data.setUnreadCount,
    data.refreshCount,
  );
  return { ...data, ...actions };
};
