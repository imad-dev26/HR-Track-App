import { useState, useEffect } from "react";
import PageHeader from "@components/ui/PageHeader";
import Card from "@components/ui/Card";
import Button from "@components/ui/Button";
import EmptyState from "@components/ui/EmptyState";
import { select } from "@lib/database";
import { useAuthStore } from "@store/authStore";
import { canModify } from "@lib/permissions";
import type { TrainingRecord } from "@app-types/index";
import { GraduationCap, Plus } from "lucide-react";
import styles from "./Formation.module.css";

export default function Formation() {
  const role = useAuthStore((s) => s.role);
  const canEdit = canModify(role, "formation");
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const rows = await select<TrainingRecord & { employee_nom?: string; employee_prenom?: string }>(
          `SELECT t.*, e.nom as employee_nom, e.prenom as employee_prenom
           FROM training_records t
           LEFT JOIN employees e ON t.employee_id = e.id
           ORDER BY t.start_date DESC`
        );
        setRecords(rows);
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
        title="Formation"
        subtitle="Ordres de mission et formations"
        actions={
          canEdit && (
            <Button>
              <Plus size={18} />
              Nouvelle formation
            </Button>
          )
        }
      />

      <Card>
        {loading ? (
          <div className={styles.loading}>Chargement...</div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="Aucune formation"
            message="Aucune formation n'a été enregistrée."
          />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Ordre de mission</th>
                  <th>Sujet</th>
                  <th>Lieu</th>
                  <th>Du</th>
                  <th>Au</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>{(r as any).employee_nom || "—"}</td>
                    <td>{r.mission_order_number || "—"}</td>
                    <td>{r.subject || "—"}</td>
                    <td>{r.location || "—"}</td>
                    <td>{r.start_date}</td>
                    <td>{r.end_date || "—"}</td>
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
