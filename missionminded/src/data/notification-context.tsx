import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { useMissionaries } from '@/data/missionaries-context';
import {
  hasNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
  syncLocalReminders,
} from '@/data/notification-service';

type NotificationStatus = 'checking' | 'unavailable' | 'denied' | 'enabled' | 'error';
type NotificationContextValue = {
  status: NotificationStatus;
  enableNotifications: () => Promise<boolean>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { appointments, missionaries } = useMissionaries();
  const [status, setStatus] = useState<NotificationStatus>('checking');
  const syncQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!isNotificationSupported()) {
      setStatus('unavailable');
      return;
    }

    hasNotificationPermission()
      .then((granted) => setStatus(granted ? 'enabled' : 'denied'))
      .catch(() => setStatus('error'));
  }, []);

  const enableNotifications = useCallback(async () => {
    if (!isNotificationSupported()) {
      setStatus('unavailable');
      return false;
    }
    try {
      const granted = await requestNotificationPermission();
      setStatus(granted ? 'enabled' : 'denied');
      return granted;
    } catch {
      setStatus('error');
      return false;
    }
  }, []);

  useEffect(() => {
    if (status !== 'enabled') return;

    const milestones = missionaries.flatMap((missionary) =>
      missionary.journey.map((milestone, index) => ({
        id: `${missionary.id}:${index}`,
        title: milestone.title,
        ...(milestone.date ? { date: milestone.date } : {}),
        eligible: milestone.state !== 'complete',
      })),
    );
    const appointmentsToSchedule = appointments.map(({ id, title, startsAt }) => ({ id, title, startsAt }));
    syncQueue.current = syncQueue.current
      .then(() => syncLocalReminders(appointmentsToSchedule, milestones))
      .catch(() => setStatus('error'));
  }, [appointments, missionaries, status]);

  return (
    <NotificationContext.Provider value={{ status, enableNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const value = useContext(NotificationContext);
  if (!value) throw new Error('useNotifications must be used inside NotificationProvider');
  return value;
}
