import { useState, useEffect } from "react";
import PageHeader from "@components/ui/PageHeader";
import Card from "@components/ui/Card";
import Button from "@components/ui/Button";
import EmptyState from "@components/ui/EmptyState";
import { select } from "@lib/database";
import { useAuthStore } from "@store/authStore";
import { canModify, canViewMedicalDetails } from "@lib/permissions";
import type { MedicalRecord } from "@app-types/index";
import { HeartPulse, Plus, ShieldOff } from "lucide-react";
import styles from "./Medical.module.css";

export default function Medical() {
  const role = useAuthStore((s) => s.role);
  const canEdit = canModify(role, "medical");
  const canSeeDetails = canViewMedicalDetails(role);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const rows = await select<MedicalRecord & { employee_nom?: string; employee_prenom?: string }>(
          `SELECT m.*, e.nom as employee_nom, e.prenom as employee_prenom
           FROM medical_records m
           LEFT JOIN employees e ON m.employee_id = e.id
           WHERE m.status = 'actif'
           ORDER BY m.start_date DESC`
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
        title="Médical"
        subtitle="Dossiers médicaux et restrictions"
        actions={
          canEdit && (
            <Button>
              <Plus size={18} />
              Nouveau dossier
            </Button>
          )
        }
      />

      {!canSeeDetails && (
        <div className={styles.restricted}>
          <ShieldOff size={20} />
          <span>Accès limité: Les détails médicaux ne sont disponibles que pour les administrateurs.</span>
        </div>
      )}

      <Card>
        {loading ? (
          <div className={styles.loading}>Chargement...</div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={HeartPulse}
            title="Aucun dossier médical"
            message="Aucune restriction médicale active n'a été enregistrée."
          />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Type</th>
                  <th>Date début</th>
                  <th>Durée</th>
                  <th>Statut</th>
                  {canSeeDetails && <th>Restriction</th>}
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>{(r as any).employee_nom || "—"}</td>
                    <td>
                      <span className={`${styles.typeBadge} ${r.type === "permanent" ? styles.typePerm : styles.typeTemp}`}>
                        {r.type === "permanent" ? "Définitif" : "Temporaire"}
                      </span>
                    </td>
                    <td>{r.start_date}</td>
                    <td>{r.duration_months ? `${r.duration_months} mois` : "—"}</td>
                    <td>{r.status}</td>
                    {canSeeDetails && <td>{r.restriction_type || "—"}</td>}
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
