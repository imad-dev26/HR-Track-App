import { NavLink, useLocation } from "react-router-dom";
import { NAV_ITEMS } from "@lib/navigation";
import { useAuthStore } from "@store/authStore";
import { hasPermission } from "@lib/permissions";
import { Users, LogOut, ChevronLeft } from "lucide-react";
import { useState } from "react";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.module === "dashboard" || item.module === "notifications") return true;
    return hasPermission(role, item.module, "view");
  });

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <Users size={28} color="var(--primary-400)" />
          {!collapsed && (
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>HR Track</span>
              <span className={styles.logoSubtitle}>Gestion du Personnel</span>
            </div>
          )}
        </div>
        <button
          className={styles.collapseBtn}
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Déplier" : "Replier"}
        >
          <ChevronLeft
            size={16}
            style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 200ms ease" }}
          />
        </button>
      </div>

      <nav className={styles.nav}>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              title={collapsed ? item.label : undefined}
              end={item.path === "/"}
            >
              <Icon size={20} className={styles.navIcon} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.footer}>
        {!collapsed && user && (
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user.display_name?.charAt(0) || user.username.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user.display_name || user.username}</span>
              <span className={styles.userRole}>{role}</span>
            </div>
          </div>
        )}
        <button className={styles.logoutBtn} onClick={logout} title="Déconnexion">
          <LogOut size={18} />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
