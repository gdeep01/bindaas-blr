import { useState } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, AlertTriangle, Car, Trash, Info, Settings, Plus, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { StatusDot } from '@/components/ui/StatusDot';
import { typography } from '@/lib/typography';

const formatTimestamp = (value: Date | string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }
  return formatDistanceToNow(date, { addSuffix: true });
};

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'congestion':
      return <Car className="h-4 w-4" />;
    case 'incident':
      return <AlertTriangle className="h-4 w-4" />;
    case 'garbage':
      return <Trash className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

const getSeverityColor = (severity: Notification['severity']) => {
  switch (severity) {
    case 'high':
      return 'bg-traffic-high/20 text-traffic-high border-traffic-high/30';
    case 'medium':
      return 'bg-traffic-moderate/20 text-traffic-moderate border-traffic-moderate/30';
    default:
      return 'bg-traffic-low/20 text-traffic-low border-traffic-low/30';
  }
};

const getTypeColor = (type: Notification['type']) => {
  switch (type) {
    case 'congestion':
      return 'border-primary text-primary';
    case 'incident':
      return 'border-danger text-danger';
    case 'garbage':
      return 'border-warning text-warning';
    default:
      return 'border-info text-info';
  }
};

export const NotificationsPanel = () => {
  const {
    notifications,
    unreadCount,
    savedRoutes,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    addSavedRoute,
    removeSavedRoute,
    sendTestNotification,
  } = useNotifications();

  const [newRoute, setNewRoute] = useState('');
  const [open, setOpen] = useState(false);
  const [isActioning, setIsActioning] = useState(false);

  const handleAddRoute = async () => {
    if (isActioning) return;

    setIsActioning(true);
    try {
      const trimmed = newRoute.trim();
      if (trimmed && !savedRoutes.includes(trimmed)) {
        await Promise.resolve(addSavedRoute(trimmed));
        setNewRoute('');
      }
    } finally {
      setIsActioning(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (isActioning) return;
    setIsActioning(true);
    try {
      await Promise.resolve(markAllAsRead());
    } finally {
      setIsActioning(false);
    }
  };

  const handleClearNotifications = async () => {
    if (isActioning) return;
    setIsActioning(true);
    try {
      await Promise.resolve(clearNotifications());
    } finally {
      setIsActioning(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (isActioning) return;
    setIsActioning(true);
    try {
      await Promise.resolve(sendTestNotification());
    } finally {
      setIsActioning(false);
    }
  };

  const handleRemoveSavedRoute = async (route: string) => {
    if (isActioning) return;
    setIsActioning(true);
    try {
      await Promise.resolve(removeSavedRoute(route));
    } finally {
      setIsActioning(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-card border-border">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Bell className="h-5 w-5 text-primary not-italic" />
            Traffic Alerts
          </SheetTitle>
          <SheetDescription>
            Real-time notifications for your saved routes
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="notifications" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Alerts
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Routes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="mt-4">
            {notifications.length > 0 && (
              <div className="flex items-center justify-between mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleMarkAllAsRead()}
                  disabled={isActioning}
                  className="text-xs gap-1 text-muted-foreground hover:text-foreground"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark All Read
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleClearNotifications()}
                  disabled={isActioning}
                  className="text-xs gap-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear All
                </Button>
              </div>
            )}

            <ScrollArea className="h-[60vh]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mb-4 opacity-30" />
                  <p className={`${typography.body} text-foreground`}>No Notifications Yet</p>
                  <p className={`${typography.label} mt-1`}>Alerts will appear here in real time.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => void handleSendTestNotification()}
                    disabled={isActioning}
                  >
                    Send Test Alert
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 pr-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`cursor-pointer rounded-sm border p-4 transition-all ${
                        notification.read
                          ? 'bg-card border-border'
                          : 'bg-card border-primary'
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`rounded-sm border p-2 ${getTypeColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`${typography.body} truncate text-foreground`}>
                              {notification.title}
                            </span>
                            {!notification.read && (
                              <StatusDot status="live" />
                            )}
                          </div>
                          <p className={`${typography.body} mb-2 text-muted-foreground`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] ${getSeverityColor(notification.severity)}`}
                            >
                              {notification.severity.charAt(0).toUpperCase() + notification.severity.slice(1)}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <div className="space-y-4">
              <div>
                <h4 className={`${typography.h4} mb-2 flex items-center gap-2 text-foreground`}>
                  <MapPin className="h-4 w-4 text-primary not-italic" />
                  Saved Routes
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Get alerts when congestion is high on these routes
                </p>
              </div>

	              <div className="flex gap-2">
	                <Input
	                  placeholder="Add a location..."
	                  value={newRoute}
	                  onChange={(e) => setNewRoute(e.target.value)}
	                  onKeyDown={(e) => e.key === 'Enter' && void handleAddRoute()}
	                  className="text-sm"
	                />
	                <Button onClick={() => void handleAddRoute()} disabled={isActioning} size="icon" variant="secondary">
	                  <Plus className="h-4 w-4" />
	                </Button>
	              </div>

              <ScrollArea className="h-[45vh]">
                <div className="space-y-2 pr-2">
                  {savedRoutes.length === 0 ? (
                    <div className={`${typography.body} py-8 text-center text-muted-foreground`}>
                      No saved routes. Add locations above to receive alerts.
                    </div>
                  ) : (
                    savedRoutes.map((route) => (
                      <div
                        key={route}
                        className="group flex items-center justify-between rounded-sm border border-border p-4"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground not-italic" />
                          <span className={`${typography.body} text-foreground`}>{route}</span>
                        </div>
	                        <Button
	                          variant="ghost"
	                          size="icon"
	                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
	                          onClick={() => void handleRemoveSavedRoute(route)}
	                          disabled={isActioning}
	                        >
	                          <X className="h-4 w-4" />
	                        </Button>
	                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="pt-4 border-t border-border/50">
                <p className={`${typography.label} text-muted-foreground`}>
                  Tip: You&apos;ll receive real-time alerts when congestion exceeds 70% on your saved routes.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
