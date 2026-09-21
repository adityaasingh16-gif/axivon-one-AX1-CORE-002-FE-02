import { useCallback, useEffect, useState } from "react";
import type { Notification, NotificationListResponse } from "../../../../modules/core/notifications/shared/contracts";
import { notificationService } from "../services/notificationService";

export type NotificationStatus = "idle" | "loading" | "success" | "error";

export function useNotifications() {
  const [data, setData] = useState<NotificationListResponse>({ data: [], unreadCount: 0 });
  const [status, setStatus] = useState<NotificationStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const response = await notificationService.list();
      setData(response);
      setStatus("success");
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Unable to load notifications.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = useCallback(async (notification: Notification) => {
    if (notification.read) return;
    try {
      await notificationService.markRead(notification.id);
      setData((current) => ({
        ...current,
        unreadCount: Math.max(0, current.unreadCount - 1),
        data: current.data.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item,
        ),
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update notification.");
      setStatus("error");
    }
  }, []);

  const markAllRead = useCallback(async () => {
    if (data.unreadCount === 0) return;
    try {
      await notificationService.markAllRead();
      setData((current) => ({
        ...current,
        unreadCount: 0,
        data: current.data.map((item) => ({ ...item, read: true })),
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update notifications.");
      setStatus("error");
    }
  }, [data.unreadCount]);

  return { data, status, error, reload: load, markRead, markAllRead };
}
