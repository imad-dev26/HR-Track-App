import { useState, useEffect } from "react";
import PageHeader from "@components/ui/PageHeader";
import Card from "@components/ui/Card";
import Button from "@components/ui/Button";
import EmptyState from "@components/ui/EmptyState";
import { select } from "@lib/database";
import { useAuthStore } from "@store/authStore";
import { canModify } from "@lib/permissions";
import type { Leave, LeaveType, LeaveExercise } from "@app-types/index";
import { CalendarDays, CalendarPlus } from "lucide-react";
import styles from "./Conges.module.css";

export default function Conges() {
  const role = useAuthStore((s) => s.role);
  const canEdit = canModify(role, "conges");
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [exercises, setExercises] = useState<LeaveExercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLeaveTypes(await select(
        "SELECT * FROM leave_types ORDER BY sort_order"));
        setExercises(await select(
        "SELECT * FROM leave_exercises ORDER BY start_date DESC"));
        const rows = await select<Leave & { employee_nom?: string; employee_prenom?: string; type_name?: string }>(
          `SELECT l.*, e.nom as employee_nom, e.prenom as employee_prenom, lt.name as type_name
           FROM leaves l
           LEFT JOIN employees e ON l.employee_id = e.id
           LEFT JOIN leave_types lt ON l.leave_type_id = lt.id
           ORDER BY l.start_date DESC`
        );
        setLeaves(rows);
      } catch {
        // Tables might not exist
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className={styles.container}>
      <PageHeader
        title="Congés"
        subtitle="Gestion des congés et exercices annuels"
        actions={
          canEdit && (
            <Button>
              <CalendarPlus size={18} />
              Nouveau congé
            </Button>
          )
        }
      />

      {exercises.length > 0 && (
        <Card title="Exercices annuels">
          <div className={styles.exerciseList}>
            {exercises.map((ex) => (
              <div key={ex.id} className={styles.exerciseItem}>
                <span className={styles.exerciseName}>{ex.name}</span>
                <span className={styles.exerciseDates}>{ex.start_date} → {ex.end_date}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {leaveTypes.length > 0 && (
        <div className={styles.typeBadges}>
          {leaveTypes.map((t) => (
            <span key={t.id} className={styles.typeBadge}>{t.name}</span>
          ))}
        </div>
      )}

      <Card title="Demandes de congés">
        {loading ? (
          <div className={styles.loading}>Chargement...</div>
        ) : leaves.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Aucun congé"
            message="Aucun congé n'a été enregistré. Les types de congés sont configurés par défaut."
          />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Type</th>
                  <th>Du</th>
                  <th>Au</th>
                  <th>Jours</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l.id}>
                    <td>{(l as any).employee_nom || "—"}</td>
                    <td>{(l as any).type_name || "—"}</td>
                    <td>{l.start_date}</td>
                    <td>{l.end_date}</td>
                    <td>{l.number_days}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[`status_${l.status}`] || styles.status_default}`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
