import { useState, useEffect } from "react";
import PageHeader from "@components/ui/PageHeader";
import Card from "@components/ui/Card";
import Button from "@components/ui/Button";
import EmptyState from "@components/ui/EmptyState";
import { select } from "@lib/database";
import { useAuthStore } from "@store/authStore";
import { canModify } from "@lib/permissions";
import type { DisciplinaryAction } from "@app-types/index";
import { Scale, Plus } from "lucide-react";
import styles from "./Discipline.module.css";

export default function Discipline() {
  const role = useAuthStore((s) => s.role);
  const canEdit = canModify(role, "discipline");
  const [actions, setActions] = useState<DisciplinaryAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const rows = await select<DisciplinaryAction & { employee_nom?: string; employee_prenom?: string }>(
          `SELECT d.*, e.nom as employee_nom, e.prenom as employee_prenom
           FROM disciplinary_actions d
           LEFT JOIN employees e ON d.employee_id = e.id
           ORDER BY d.date DESC`
        );
        setActions(rows);
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
        title="Discipline"
        subtitle="Sanctions disciplinaires: avertissements, blâmes, mises à pied"
        actions={
          canEdit && (
            <Button>
              <Plus size={18} />
              Nouvelle sanction
            </Button>
          )
        }
      />

      <Card>
        {loading ? (
          <div className={styles.loading}>Chargement...</div>
        ) : actions.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="Aucune sanction"
            message="Aucune sanction disciplinaire n'a été enregistrée."
          />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Durée</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((a) => (
                  <tr key={a.id}>
                    <td>{(a as any).employee_nom || "—"}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[`type_${a.action_type}`] || styles.type_default}`}>
                        {a.action_type}
                      </span>
                    </td>
                    <td>{a.date}</td>
                    <td>{a.duration_days ? `${a.duration_days} jour(s)` : "—"}</td>
                    <td>{a.description || "—"}</td>
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
