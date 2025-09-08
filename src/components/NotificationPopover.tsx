"use client";

import React, { useState } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Notification = {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
};

interface NotificationItemProps {
  notification: Notification;
  index: number;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem = ({
  notification,
  index,
  onMarkAsRead,
}: NotificationItemProps) => (
  <motion.div
    initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
    transition={{ duration: 0.3, delay: index * 0.1 }}
    key={notification.id}
    className="p-4 hover:bg-accent dark:hover:bg-accent cursor-pointer transition-colors"
    onClick={() => onMarkAsRead(notification.id)}
  >
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-2">
        {!notification.read && (
          <span className="h-1 w-1 rounded-full bg-primary" />
        )}
        <h4 className="text-sm font-medium text-card-foreground dark:text-card-foreground">
          {notification.title}
        </h4>
      </div>
      <span className="text-xs text-muted-foreground dark:text-muted-foreground">
        {notification.timestamp.toLocaleDateString()}
      </span>
    </div>
    <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
      {notification.description}
    </p>
  </motion.div>
);

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}

const NotificationList = ({
  notifications,
  onMarkAsRead,
}: NotificationListProps) => (
  <div className="divide-y divide-border dark:divide-border">
    {notifications.map((notification, index) => (
      <NotificationItem
        key={notification.id}
        notification={notification}
        index={index}
        onMarkAsRead={onMarkAsRead}
      />
    ))}
  </div>
);

interface NotificationPopoverProps {
  notifications?: Notification[];
  onNotificationsChange?: (notifications: Notification[]) => void;
}

const dummyNotifications: Notification[] = [
  {
    id: "1",
    title: "New Message",
    description: "You have received a new message from John Doe",
    timestamp: new Date("2025-09-02"),
    read: false,
  },
  {
    id: "2",
    title: "System Update",
    description: "System maintenance scheduled for tomorrow",
    timestamp: new Date("2025-09-01"),
    read: false,
  },
  {
    id: "3",
    title: "Reminder",
    description: "Meeting with team at 2 PM",
    timestamp: new Date("2025-08-31"),
    read: true,
  },
];

export const NotificationPopover = ({
  notifications: initialNotifications = dummyNotifications,
  onNotificationsChange,
}: NotificationPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleOpen = () => setIsOpen(!isOpen);

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map((n) => ({
      ...n,
      read: true,
    }));
    setNotifications(updatedNotifications);
    onNotificationsChange?.(updatedNotifications);
  };

  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    onNotificationsChange?.(updatedNotifications);
  };

  return (
    <div className="relative">
      <Button
        onClick={toggleOpen}
        variant="ghost"
        size="sm"
        className="relative p-2"
        data-testid="notifications-button"
      >
        <Bell className="text-card-foreground dark:text-card-foreground w-5 h-5" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center text-xs text-destructive-foreground">
            {unreadCount}
          </div>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-y-auto rounded-xl shadow-lg bg-card dark:bg-card border border-border dark:border-border"
          >
            <div className="p-4 border-b border-border dark:border-border flex justify-between items-center">
              <h3 className="text-sm font-medium text-card-foreground dark:text-card-foreground">
                Notifications
              </h3>
              <Button
                onClick={markAllAsRead}
                variant="ghost"
                size="sm"
                className="text-xs hover:bg-accent dark:hover:bg-accent"
                data-testid="mark-all-read"
              >
                Mark all as read
              </Button>
            </div>

            <NotificationList
              notifications={notifications}
              onMarkAsRead={markAsRead}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};