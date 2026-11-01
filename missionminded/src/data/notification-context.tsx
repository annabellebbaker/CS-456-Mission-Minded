import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { doc, updateDoc } from 'firebase/firestore';

import { useAuth } from '@/data/auth';
import { getFirebaseFirestore } from '@/data/firebase';
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
  const { user } = useAuth();
  const { appointments, missionaries } = useMissionaries();
  const [status, setStatus] = useState<NotificationStatus>(
    () => isNotificationSupported() ? 'checking' : 'unavailable',
  );
  const syncQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!isNotificationSupported()) return;

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
      if (granted && user) {
        try {
          await updateDoc(doc(getFirebaseFirestore(), 'users', user.id), {
            'settings.appointmentReminders': true,
            'settings.milestoneReminders': true,
          });
        } catch {
          // Device reminders remain enabled if settings sync is temporarily offline.
        }
      }
      return granted;
    } catch {
      setStatus('error');
      return false;
    }
  }, [user]);

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
