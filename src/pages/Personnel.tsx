import { useState, useEffect } from "react";
import PageHeader from "@components/ui/PageHeader";
import Card from "@components/ui/Card";
import Button from "@components/ui/Button";
import EmptyState from "@components/ui/EmptyState";
import { select } from "@lib/database";
import { useAuthStore } from "@store/authStore";
import { canModify } from "@lib/permissions";
import type { Employee } from "@app-types/index";
import { Users, UserPlus, Search, Pencil, Trash2 } from "lucide-react";
import styles from "./Personnel.module.css";

export default function Personnel() {
  const role = useAuthStore((s) => s.role);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const canEdit = canModify(role, "personnel");

  useEffect(() => {
    async function loadEmployees() {
      try {
        const rows = await select<Employee>(
        "SELECT * FROM employees ORDER BY nom, prenom"
        );
        setEmployees(rows);
      } catch {
        // Table might not exist yet
      } finally {
        setLoading(false);
      }
    }
    loadEmployees();
  }, []);

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.matricule.toLowerCase().includes(q) ||
      e.nom.toLowerCase().includes(q) ||
      e.prenom.toLowerCase().includes(q)
    );
  });

  return (
    <div className={styles.container}>
      <PageHeader
        title="Personnel"
        subtitle="Gestion des dossiers employés"
        actions={
          canEdit && (
            <Button>
              <UserPlus size={18} />
              Nouvel employé
            </Button>
          )
        }
      />

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Rechercher par matricule, nom ou prénom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <span className={styles.count}>{filtered.length} employé(s)</span>
      </div>

      <Card>
        {loading ? (
          <div className={styles.loading}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun employé"
            message="Aucun dossier employé n'a été enregistré pour le moment."
          />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Matricule</th>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Date de naissance</th>
                  <th>Téléphone</th>
                  <th>Statut</th>
                  {canEdit && <th className={styles.actionsCol}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id} className={styles.row}>
                    <td className={styles.matricule}>{emp.matricule}</td>
                    <td>{emp.nom}</td>
                    <td>{emp.prenom}</td>
                    <td>{emp.date_naissance || "—"}</td>
                    <td>{emp.telephone || "—"}</td>
                    <td>
                      <span className={styles.statusBadge}>—</span>
                    </td>
                    {canEdit && (
                      <td className={styles.actionsCell}>
                        <button className={styles.actionBtn} title="Modifier">
                          <Pencil size={16} />
                        </button>
                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Supprimer">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
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
