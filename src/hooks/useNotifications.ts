import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  type: 'congestion' | 'incident' | 'garbage' | 'info';
  title: string;
  message: string;
  location?: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  read: boolean;
}

const SAVED_ROUTES_KEY = 'traffic_saved_routes';
const NOTIFICATIONS_KEY = 'traffic_notifications';
const HIGH_CONGESTION_THRESHOLD = 70;

interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  savedRoutes: string[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  addSavedRoute: (route: string) => void;
  removeSavedRoute: (route: string) => void;
  sendTestNotification: () => void;
}

const DEFAULT_SAVED_ROUTES = ['Silk Board Junction', 'KR Puram', 'Marathahalli', 'Whitefield', 'Electronic City'];

const isSeverity = (value: unknown): value is Notification['severity'] =>
  value === 'low' || value === 'medium' || value === 'high';

const isType = (value: unknown): value is Notification['type'] =>
  value === 'congestion' || value === 'incident' || value === 'garbage' || value === 'info';

const parseSavedRoutes = (value: string | null): string[] => {
  if (!value) {
    return DEFAULT_SAVED_ROUTES;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return DEFAULT_SAVED_ROUTES;
    }

    return parsed.filter((route): route is string => typeof route === 'string' && route.trim().length > 0);
  } catch {
    return DEFAULT_SAVED_ROUTES;
  }
};

const parseNotifications = (value: string | null): Notification[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
      .map((item) => {
        const timestamp = new Date(typeof item.timestamp === 'string' ? item.timestamp : Date.now());
        if (
          typeof item.id !== 'string' ||
          !isType(item.type) ||
          typeof item.title !== 'string' ||
          typeof item.message !== 'string' ||
          !isSeverity(item.severity) ||
          Number.isNaN(timestamp.getTime())
        ) {
          return null;
        }

        return {
          id: item.id,
          type: item.type,
          title: item.title,
          message: item.message,
          location: typeof item.location === 'string' ? item.location : undefined,
          severity: item.severity,
          timestamp,
          read: item.read === true,
        } satisfies Notification;
      })
      .filter((item): item is Notification => item !== null);
  } catch {
    return [];
  }
};

export const useNotifications = (): UseNotificationsResult => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const normalizedRoutes = useMemo(
    () => savedRoutes.map((route) => route.toLowerCase()),
    [savedRoutes],
  );

  // Load saved routes from localStorage
  useEffect(() => {
    const parsedRoutes = parseSavedRoutes(localStorage.getItem(SAVED_ROUTES_KEY));
    setSavedRoutes(parsedRoutes);
    localStorage.setItem(SAVED_ROUTES_KEY, JSON.stringify(parsedRoutes));

    // Load stored notifications
    const storedNotifications = parseNotifications(localStorage.getItem(NOTIFICATIONS_KEY));
    const recent = storedNotifications.filter(
      (notification) => new Date().getTime() - notification.timestamp.getTime() < 24 * 60 * 60 * 1000,
    );
    setNotifications(recent);
  }, []);

  // Update unread count
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  // Save notifications to localStorage
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications.slice(0, 50)));
    }
  }, [notifications]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
  }, []);

  // Subscribe to traffic_history changes for congestion alerts
  useEffect(() => {
    const channel = supabase
      .channel('traffic-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'traffic_history',
          filter: `congestion_level=gte.${HIGH_CONGESTION_THRESHOLD}`,
        },
        (payload) => {
          const record = payload.new as {
            location_name: string;
            congestion_level: number;
            current_speed?: number;
          };
          
          // Check if this location is in saved routes and has high congestion
          const normalizedLocation = record.location_name.toLowerCase();
          const isInSavedRoutes = normalizedRoutes.some(route => 
            normalizedLocation.includes(route) ||
            route.includes(normalizedLocation)
          );
          
          if (isInSavedRoutes && record.congestion_level >= HIGH_CONGESTION_THRESHOLD) {
            addNotification({
              type: 'congestion',
              title: 'High Congestion Alert',
              message: `${record.location_name} is experiencing ${record.congestion_level}% congestion${record.current_speed ? ` (${record.current_speed} km/h)` : ''}`,
              location: record.location_name,
              severity: record.congestion_level >= 85 ? 'high' : 'medium',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [normalizedRoutes, addNotification]);

  // Subscribe to garbage_reports for new reports
  useEffect(() => {
    const channel = supabase
      .channel('garbage-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'garbage_reports',
          filter: 'moderation_status=eq.reported',
        },
        (payload) => {
          const record = payload.new as {
            location_name: string;
            severity: string;
            report_type: string;
          };

          // L-02: Only notify if report matches user's saved routes
          const savedFrom = localStorage.getItem('leaveNow_from');
          const savedTo = localStorage.getItem('leaveNow_to');
          if (!savedFrom && !savedTo) return;

          const loc = record.location_name.toLowerCase();
          const matchesRoute =
            (savedFrom && loc.includes(savedFrom.toLowerCase())) ||
            (savedTo && loc.includes(savedTo.toLowerCase()));
          if (!matchesRoute) return;

          addNotification({
            type: 'garbage',
            title: 'New Garbage Report',
            message: `${record.report_type} reported at ${record.location_name}`,
            location: record.location_name,
            severity: record.severity as 'low' | 'medium' | 'high',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addNotification]);

  const markAsRead = useCallback((id: string): void => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback((): void => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback((): void => {
    setNotifications([]);
    localStorage.removeItem(NOTIFICATIONS_KEY);
  }, []);

  const addSavedRoute = useCallback((route: string): void => {
    setSavedRoutes(prev => {
      const normalizedRoute = route.trim();
      if (!normalizedRoute || prev.includes(normalizedRoute)) {
        return prev;
      }
      const updated = [...prev, normalizedRoute];
      localStorage.setItem(SAVED_ROUTES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeSavedRoute = useCallback((route: string): void => {
    setSavedRoutes(prev => {
      const updated = prev.filter(r => r !== route);
      localStorage.setItem(SAVED_ROUTES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Simulate a test notification (for demo purposes)
  const sendTestNotification = useCallback((): void => {
    addNotification({
      type: 'congestion',
      title: 'High Congestion Alert',
      message: 'Silk Board Junction is experiencing 85% congestion',
      location: 'Silk Board Junction',
      severity: 'high',
    });
  }, [addNotification]);

  return {
    notifications,
    unreadCount,
    savedRoutes,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    addSavedRoute,
    removeSavedRoute,
    sendTestNotification,
  };
};
