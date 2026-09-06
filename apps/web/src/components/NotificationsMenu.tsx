import { Bell, BellRing, CheckCheck } from 'lucide-react';
import type { NotificationItem } from '@sigecal/shared';
import { useNavigate } from 'react-router-dom';

import { useNotifications } from '../features/notifications/useNotifications.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.js';

type NotificationsState = ReturnType<typeof useNotifications>;

const destination = (item: NotificationItem): string | undefined => {
  if (!item.entityId) return undefined;
  if (item.entityType === 'Inspection') return `/inspecciones/${item.entityId}`;
  if (item.entityType === 'NonConformity')
    return `/no-conformidades/${item.entityId}`;
  return undefined;
};

const NotificationRow = ({
  item,
  select,
}: {
  readonly item: NotificationItem;
  readonly select: (item: NotificationItem) => void;
}): React.JSX.Element => (
  <button
    className={`notification-row${item.isRead ? '' : ' is-unread'}`}
    type="button"
    onClick={() => {
      select(item);
    }}
  >
    <span className="notification-icon" aria-hidden="true">
      {item.type.includes('OVERDUE') ? <BellRing /> : <Bell />}
    </span>
    <span className="notification-copy">
      <strong>{item.title}</strong>
      <span>{item.message}</span>
      <time dateTime={item.createdAt}>
        {new Intl.DateTimeFormat('es-PE', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(item.createdAt))}
      </time>
    </span>
    {!item.isRead && (
      <span className="notification-dot" aria-label="No leída" />
    )}
  </button>
);

const PanelHeader = ({ state }: { readonly state: NotificationsState }) => (
  <div className="notification-panel-header">
    <div>
      <strong>Notificaciones</strong>
      <small>{state.unreadCount} sin leer</small>
    </div>
    <button
      type="button"
      onClick={() => {
        void state.markAllRead().catch(() => state.refresh());
      }}
      disabled={state.unreadCount === 0}
    >
      <CheckCheck aria-hidden="true" /> Marcar todas como leídas
    </button>
  </div>
);

const NotificationList = ({
  state,
  select,
}: {
  readonly state: NotificationsState;
  readonly select: (item: NotificationItem) => void;
}) => (
  <div className="notification-list">
    {state.loading && state.items.length === 0 && (
      <p className="notification-state">Cargando notificaciones…</p>
    )}
    {state.error && (
      <p className="notification-state is-error">{state.error}</p>
    )}
    {!state.loading && !state.error && state.items.length === 0 && (
      <p className="notification-state">No tiene notificaciones todavía.</p>
    )}
    {state.items.map((item) => (
      <NotificationRow key={item.id} item={item} select={select} />
    ))}
  </div>
);

export const NotificationsMenu = (): React.JSX.Element => {
  const state = useNotifications();
  const navigate = useNavigate();
  const select = (item: NotificationItem) => {
    void state
      .markRead(item.id)
      .then(() => {
        const path = destination(item);
        if (path) void navigate(path);
      })
      .catch(() => state.refresh());
  };
  return (
    <DropdownMenu onOpenChange={(open) => open && void state.refresh()}>
      <DropdownMenuTrigger asChild>
        <button
          className="icon-button notification-trigger"
          type="button"
          aria-label={`${state.unreadCount.toString()} notificaciones no leídas`}
        >
          <Bell aria-hidden="true" />
          {state.unreadCount > 0 && (
            <span className="notification-count">
              {state.unreadCount > 99 ? '99+' : state.unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="notification-panel">
        <PanelHeader state={state} />
        <NotificationList state={state} select={select} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
