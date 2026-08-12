import { useState, useEffect } from "react";
import PageHeader from "@components/ui/PageHeader";
import Card from "@components/ui/Card";
import { Users, FileText, CalendarDays, HeartPulse, TriangleAlert as AlertTriangle, TrendingUp, UserCheck, Clock } from "lucide-react";
import { select } from "@lib/database";
import { useAuthStore } from "@store/authStore";
import styles from "./Dashboard.module.css";

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  activeContracts: number;
  pendingLeaves: number;
  medicalRestrictions: number;
  recentAccidents: number;
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    activeContracts: 0,
    pendingLeaves: 0,
    medicalRestrictions: 0,
    recentAccidents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const total = await select<{ count: number }>(
          "SELECT COUNT(*) as count FROM employees"
        );
        const active = await select<{ count: number }>(
          "SELECT COUNT(*) as count FROM employees e JOIN employee_status_types est ON e.current_status_id = est.id WHERE est.name = 'Actif'"
        );
        const contracts = await select<{ count: number }>(
          "SELECT COUNT(*) as count FROM contracts WHERE is_current = 1"
        );
        const leaves = await select<{ count: number }>(
          "SELECT COUNT(*) as count FROM leaves WHERE status = 'Validé'"
        );
        const medical = await select<{ count: number }>(
          "SELECT COUNT(*) as count FROM medical_records WHERE status = 'actif'"
        );
        const accidents = await select<{ count: number }>(
          "SELECT COUNT(*) as count FROM accidents WHERE accident_date >= date('now', '-30 days')"
        );

        setStats({
          totalEmployees: total[0]?.count || 0,
          activeEmployees: active[0]?.count || 0,
          activeContracts: contracts[0]?.count || 0,
          pendingLeaves: leaves[0]?.count || 0,
          medicalRestrictions: medical[0]?.count || 0,
          recentAccidents: accidents[0]?.count || 0,
        });
      } catch {
        // Database not yet initialized or empty
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    { label: "Total Employés", value: stats.totalEmployees, icon: Users, color: "primary" },
    { label: "Employés Actifs", value: stats.activeEmployees, icon: UserCheck, color: "success" },
    { label: "Contrats en cours", value: stats.activeContracts, icon: FileText, color: "secondary" },
    { label: "Congés validés", value: stats.pendingLeaves, icon: CalendarDays, color: "warning" },
    { label: "Restrictions médicales", value: stats.medicalRestrictions, icon: HeartPulse, color: "error" },
    { label: "Accidents (30j)", value: stats.recentAccidents, icon: AlertTriangle, color: "error" },
  ];

  return (
    <div className={styles.container}>
      <PageHeader
        title="Tableau de bord"
        subtitle={`Bienvenue, ${user?.display_name || user?.username}`}
      />

      <div className={styles.statsGrid}>
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles[card.color]}`}>
                  <Icon size={24} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>
                    {loading ? "—" : card.value}
                  </span>
                  <span className={styles.statLabel}>{card.label}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className={styles.grid2}>
        <Card title="Activité récente">
          <div className={styles.activityList}>
            <div className={styles.activityItem}>
              <Clock size={16} color="var(--neutral-400)" />
              <span>Aucune activité récente à afficher</span>
            </div>
          </div>
        </Card>

        <Card title="Indicateurs">
          <div className={styles.indicators}>
            <div className={styles.indicatorRow}>
              <TrendingUp size={16} color="var(--success-600)" />
              <span className={styles.indicatorLabel}>Taux de présence</span>
              <span className={styles.indicatorValue}>—</span>
            </div>
            <div className={styles.indicatorRow}>
              <Users size={16} color="var(--primary-600)" />
              <span className={styles.indicatorLabel}>Effectif total</span>
              <span className={styles.indicatorValue}>{stats.totalEmployees}</span>
            </div>
            <div className={styles.indicatorRow}>
              <FileText size={16} color="var(--secondary-600)" />
              <span className={styles.indicatorLabel}>Contrats actifs</span>
              <span className={styles.indicatorValue}>{stats.activeContracts}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
