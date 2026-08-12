import { useState, useEffect } from "react";
import PageHeader from "@components/ui/PageHeader";
import Card from "@components/ui/Card";
import Button from "@components/ui/Button";
import EmptyState from "@components/ui/EmptyState";
import { select } from "@lib/database";
import { useAuthStore } from "@store/authStore";
import { canModify } from "@lib/permissions";
import type { Contract, ContractType } from "@app-types/index";
import { FileText, FilePlus } from "lucide-react";
import styles from "./Contrats.module.css";

export default function Contrats() {
  const role = useAuthStore((s) => s.role);
  const canEdit = canModify(role, "contrats");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setContractTypes(await select<>(
        "SELECT * FROM contract_types ORDER BY sort_order"));
        const rows = await select<Contract & { employee_nom?: string; employee_prenom?: string; type_name?: string }>(
          `SELECT c.*, e.nom as employee_nom, e.prenom as employee_prenom, ct.name as type_name
           FROM contracts c
           LEFT JOIN employees e ON c.employee_id = e.id
           LEFT JOIN contract_types ct ON c.contract_type_id = ct.id
           ORDER BY c.start_date DESC`
        );
        setContracts(rows);
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
        title="Contrats"
        subtitle="Gestion et historique des contrats"
        actions={
          canEdit && (
            <Button>
              <FilePlus size={18} />
              Nouveau contrat
            </Button>
          )
        }
      />

      {contractTypes.length > 0 && (
        <div className={styles.typeBadges}>
          {contractTypes.map((t) => (
            <span key={t.id} className={styles.typeBadge}>
              {t.name}
            </span>
          ))}
        </div>
      )}

      <Card>
        {loading ? (
          <div className={styles.loading}>Chargement...</div>
        ) : contracts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucun contrat"
            message="Aucun contrat n'a été enregistré. Les types de contrats (CDI, CDD) sont configurés par défaut."
          />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Type</th>
                  <th>Date début</th>
                  <th>Date fin</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id}>
                    <td>{(c as any).employee_nom || "—"} {(c as any).employee_prenom || ""}</td>
                    <td>{(c as any).type_name || "—"}</td>
                    <td>{c.start_date}</td>
                    <td>{c.end_date || "—"}</td>
                    <td>
                      <span className={`${styles.badge} ${c.is_current ? styles.badgeActive : styles.badgePast}`}>
                        {c.is_current ? "En cours" : "Archivé"}
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
