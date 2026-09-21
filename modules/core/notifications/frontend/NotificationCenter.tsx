import type { CSSProperties } from "react";
import { useNotifications } from "../../../../apps/frontend/src/hooks/useNotifications";

const styles: Record<string, CSSProperties> = {
  container: { maxWidth: 720, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 20 },
  title: { margin: 0, fontSize: 24 },
  button: { border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 12px", background: "#fff", cursor: "pointer" },
  status: { padding: 16, borderRadius: 10, background: "#f3f4f6", marginBottom: 12 },
  error: { padding: 16, borderRadius: 10, background: "#fef2f2", color: "#991b1b", marginBottom: 12 },
  item: { padding: 16, border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 10, cursor: "pointer" },
  unread: { background: "#f9fafb", borderColor: "#cbd5e1" },
};

export function NotificationCenter() {
  const { data, status, error, reload, markRead, markAllRead } = useNotifications();

  return (
    <section aria-labelledby="notification-center-title" style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 id="notification-center-title" style={styles.title}>Notifications</h1>
          <span aria-live="polite">{data.unreadCount} unread</span>
        </div>
        <button type="button" style={styles.button} onClick={() => void markAllRead()} disabled={data.unreadCount === 0}>
          Mark all as read
        </button>
      </header>

      {status === "loading" && <div role="status" style={styles.status}>Loading notifications…</div>}

      {status === "error" && (
        <div role="alert" style={styles.error}>
          <div>{error ?? "Unable to load notifications."}</div>
          <button type="button" style={{ ...styles.button, marginTop: 10 }} onClick={() => void reload()}>Try again</button>
        </div>
      )}

      {status === "success" && data.data.length === 0 && (
        <div role="status" style={styles.status}>You’re all caught up. No notifications to display.</div>
      )}

      {status === "success" && data.data.length > 0 && (
        <div aria-label="Notification list">
          {data.data.map((notification) => (
            <article
              key={notification.id}
              style={{ ...styles.item, ...(notification.read ? {} : styles.unread) }}
              aria-label={`${notification.read ? "Read" : "Unread"}: ${notification.title}`}
              onClick={() => void markRead(notification)}
            >
              <strong>{notification.title}</strong>
              <p>{notification.message}</p>
              <small>{new Date(notification.createdAt).toLocaleString()}</small>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
