import { useState, useEffect } from "react";
import PageHeader from "@components/ui/PageHeader";
import Card from "@components/ui/Card";
import EmptyState from "@components/ui/EmptyState";
import { select } from "@lib/database";
import type { Notification } from "@app-types/index";
import { Bell, BellOff, CircleCheck as CheckCircle2 } from "lucide-react";
import styles from "./Notifications.module.css";

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const rows = await select<>(
        "SELECT * FROM notifications ORDER BY date DESC LIMIT 50"
        );
        setNotifications(rows);
      } catch {
        // Table might not exist
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className={styles.container}>
      <PageHeader title="Notifications" subtitle="Alertes et notifications système" />

      <Card>
        {loading ? (
          <div className={styles.loading}>Chargement...</div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title="Aucune notification"
            message="Vous n'avez aucune notification pour le moment."
          />
        ) : (
          <div className={styles.list}>
            {notifications.map((n) => (
              <div key={n.id} className={`${styles.item} ${n.read_status ? styles.read : ""}`}>
                <div className={styles.itemIcon}>
                  {n.read_status ? <CheckCircle2 size={18} /> : <Bell size={18} />}
                </div>
                <div className={styles.itemContent}>
                  <span className={styles.itemMessage}>{n.message}</span>
                  <span className={styles.itemDate}>{n.date}</span>
                </div>
                {!n.read_status && <span className={styles.unreadDot} />}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
