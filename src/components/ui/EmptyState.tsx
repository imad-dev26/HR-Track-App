import { Inbox } from "lucide-react";
import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  message?: string;
}

export default function EmptyState({ icon: Icon = Inbox, title, message }: EmptyStateProps) {
  return (
    <div className={styles.container}>
      <Icon size={48} className={styles.icon} />
      <h3 className={styles.title}>{title}</h3>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
