import { useLocation } from "react-router-dom";
import { NAV_ITEMS } from "@lib/navigation";
import { useAuthStore } from "@store/authStore";
import { Bell, Search } from "lucide-react";
import { useState } from "react";
import styles from "./Header.module.css";

export default function Header() {
  const location = useLocation();
  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);
  const [searchValue, setSearchValue] = useState("");

  const currentItem = NAV_ITEMS.find(
    (item) => item.path === location.pathname
  );
  const pageTitle = currentItem?.label || "Tableau de bord";

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h2 className={styles.title}>{pageTitle}</h2>
        <span className={styles.badge}>{role}</span>
      </div>

      <div className={styles.right}>
        <div className={styles.search}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Rechercher (matricule, nom...)"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <button className={styles.iconBtn} title="Notifications">
          <Bell size={20} />
        </button>
        <div className={styles.userBadge}>
          {user?.display_name?.charAt(0) || user?.username.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
