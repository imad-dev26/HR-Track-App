import type { ReactNode } from "react";
import styles from "./Card.module.css";

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export default function Card({ children, title, className }: CardProps) {
  return (
    <div className={`${styles.card} ${className || ""}`}>
      {title && <div className={styles.cardTitle}>{title}</div>}
      <div className={styles.cardBody}>{children}</div>
    </div>
  );
}
