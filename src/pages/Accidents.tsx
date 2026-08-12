import { useState, useEffect } from "react";
import PageHeader from "@components/ui/PageHeader";
import Card from "@components/ui/Card";
import Button from "@components/ui/Button";
import EmptyState from "@components/ui/EmptyState";
import { select } from "@lib/database";
import { useAuthStore } from "@store/authStore";
import { canModify } from "@lib/permissions";
import type { Accident } from "@app-types/index";
import { TriangleAlert as AlertTriangle, Plus } from "lucide-react";
import styles from "./Accidents.module.css";

export default function Accidents() {
  const role = useAuthStore((s) => s.role);
  const canEdit = canModify(role, "accidents");
  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const rows = await select<Accident & { employee_nom?: string; employee_prenom?: string }>(
          `SELECT a.*, e.nom as employee_nom, e.prenom as employee_prenom
           FROM accidents a
           LEFT JOIN employees e ON a.employee_id = e.id
           ORDER BY a.accident_date DESC`
        );
        setAccidents(rows);
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
        title="Accidents"
        subtitle="Accidents du travail et arrêts"
        actions={
          canEdit && (
            <Button>
              <Plus size={18} />
              Nouvel accident
            </Button>
          )
        }
      />

      <Card>
        {loading ? (
          <div className={styles.loading}>Chargement...</div>
        ) : accidents.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Aucun accident"
            message="Aucun accident du travail n'a été enregistré."
          />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Date accident</th>
                  <th>Arrêt du</th>
                  <th>Arrêt au</th>
                  <th>Lieu</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {accidents.map((a) => (
                  <tr key={a.id}>
                    <td>{(a as any).employee_nom || "—"}</td>
                    <td>{a.accident_date}</td>
                    <td>{a.stop_start || "—"}</td>
                    <td>{a.stop_end || "—"}</td>
                    <td>{a.location || "—"}</td>
                    <td>{a.type || "—"}</td>
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
