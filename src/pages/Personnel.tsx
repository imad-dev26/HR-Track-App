import { useState, useEffect, useCallback } from "react";
import PageHeader from "@components/ui/PageHeader";
import Card from "@components/ui/Card";
import Button from "@components/ui/Button";
import EmptyState from "@components/ui/EmptyState";
import { select, execute, executeTransaction } from "@lib/database";
import { useAuthStore } from "@store/authStore";
import { canModify } from "@lib/permissions";
import type {
  Employee,
  EmployeeFormData,
  EmployeeStatusType,
  ProfessionalCategory,
} from "@app-types/index";
import {
  Users,
  UserPlus,
  Search,
  Pencil,
  ShieldAlert,
  CheckCircle2,
  X,
} from "lucide-react";
import EmployeeModal from "@components/employees/EmployeeModal";
import StatusChangeModal from "@components/employees/StatusChangeModal";
import styles from "./Personnel.module.css";

export default function Personnel() {
  const role = useAuthStore((s) => s.role);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statuses, setStatuses] = useState<EmployeeStatusType[]>([]);
  const [categories, setCategories] = useState<ProfessionalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [statusChangeEmployee, setStatusChangeEmployee] =
    useState<Employee | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canEdit = canModify(role, "personnel");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [empRows, statusRows, catRows] = await Promise.all([
        select<Employee>(
          `SELECT e.*, s.name AS status_name, c.name AS category_name
           FROM employees e
           LEFT JOIN employee_status_types s ON e.current_status_id = s.id
           LEFT JOIN professional_categories c ON e.category_id = c.id
           ORDER BY e.nom ASC, e.prenom ASC`
        ),
        select<EmployeeStatusType>(
          `SELECT * FROM employee_status_types WHERE active = 1 ORDER BY sort_order ASC`
        ),
        select<ProfessionalCategory>(
          `SELECT * FROM professional_categories WHERE active = 1 ORDER BY sort_order ASC`
        ),
      ]);

      setEmployees(empRows || []);
      setStatuses(statusRows || []);
      setCategories(catRows || []);
    } catch (err) {
      console.error("Error loading personnel data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }

  // Create or Update employee
  async function handleSaveEmployee(data: EmployeeFormData) {
    if (editingEmployee) {
      // Check if status changed
      const statusChanged =
        editingEmployee.current_status_id !== data.current_status_id;

      const oldStatusName =
        statuses.find((s) => s.id === editingEmployee.current_status_id)
          ?.name || null;
      const newStatusName =
        statuses.find((s) => s.id === data.current_status_id)?.name ||
        "Inconnu";

      if (statusChanged && data.current_status_id) {
        await executeTransaction([
          {
            query: `UPDATE employees SET
              nom = ?, prenom = ?, date_naissance = ?, lieu_naissance = ?,
              national_id = ?, securite_sociale = ?, telephone = ?, adresse = ?,
              compte_bancaire = ?, situation_familiale = ?, nombre_enfants = ?,
              category_id = ?, current_status_id = ?, updated_at = datetime('now')
            WHERE id = ?`,
            bindValues: [
              data.nom.trim(),
              data.prenom.trim(),
              data.date_naissance || null,
              data.lieu_naissance?.trim() || null,
              data.national_id?.trim() || null,
              data.securite_sociale?.trim() || null,
              data.telephone?.trim() || null,
              data.adresse?.trim() || null,
              data.compte_bancaire?.trim() || null,
              data.situation_familiale || null,
              data.nombre_enfants || 0,
              data.category_id || null,
              data.current_status_id,
              editingEmployee.id,
            ],
          },
          {
            query: `INSERT INTO employee_status_history (
              employee_id, old_status, new_status, date_change, reason, created_at
            ) VALUES (?, ?, ?, date('now'), 'Mise à jour via fiche employé', datetime('now'))`,
            bindValues: [
              editingEmployee.id,
              oldStatusName,
              newStatusName,
            ],
          },
        ]);
      } else {
        await execute(
          `UPDATE employees SET
            nom = ?, prenom = ?, date_naissance = ?, lieu_naissance = ?,
            national_id = ?, securite_sociale = ?, telephone = ?, adresse = ?,
            compte_bancaire = ?, situation_familiale = ?, nombre_enfants = ?,
            category_id = ?, current_status_id = ?, updated_at = datetime('now')
          WHERE id = ?`,
          [
            data.nom.trim(),
            data.prenom.trim(),
            data.date_naissance || null,
            data.lieu_naissance?.trim() || null,
            data.national_id?.trim() || null,
            data.securite_sociale?.trim() || null,
            data.telephone?.trim() || null,
            data.adresse?.trim() || null,
            data.compte_bancaire?.trim() || null,
            data.situation_familiale || null,
            data.nombre_enfants || 0,
            data.category_id || null,
            data.current_status_id || null,
            editingEmployee.id,
          ]
        );
      }

      showToast(`Dossier employé "${data.nom} ${data.prenom}" mis à jour.`);
    } else {
      // Create new employee
      const statusName =
        statuses.find((s) => s.id === data.current_status_id)?.name || "Actif";

      const insertResult = await execute(
        `INSERT INTO employees (
          matricule, nom, prenom, date_naissance, lieu_naissance,
          national_id, securite_sociale, telephone, adresse, compte_bancaire,
          situation_familiale, nombre_enfants, category_id, current_status_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          data.matricule.trim(),
          data.nom.trim(),
          data.prenom.trim(),
          data.date_naissance || null,
          data.lieu_naissance?.trim() || null,
          data.national_id?.trim() || null,
          data.securite_sociale?.trim() || null,
          data.telephone?.trim() || null,
          data.adresse?.trim() || null,
          data.compte_bancaire?.trim() || null,
          data.situation_familiale || null,
          data.nombre_enfants || 0,
          data.category_id || null,
          data.current_status_id || null,
        ]
      );

      if (insertResult.lastInsertId) {
        await execute(
          `INSERT INTO employee_status_history (
            employee_id, old_status, new_status, date_change, reason, created_at
          ) VALUES (?, NULL, ?, date('now'), 'Création initiale du dossier', datetime('now'))`,
          [insertResult.lastInsertId, statusName]
        );
      }

      showToast(`Nouvel employé "${data.nom} ${data.prenom}" (${data.matricule}) créé.`);
    }

    await loadData();
  }

  // Handle status change / deactivation
  async function handleConfirmStatusChange(
    employeeId: number,
    newStatusId: number,
    dateChange: string,
    reason: string
  ) {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    const oldStatusName =
      statuses.find((s) => s.id === emp.current_status_id)?.name || null;
    const newStatusName =
      statuses.find((s) => s.id === newStatusId)?.name || "Inconnu";

    await executeTransaction([
      {
        query: `UPDATE employees SET current_status_id = ?, updated_at = datetime('now') WHERE id = ?`,
        bindValues: [newStatusId, employeeId],
      },
      {
        query: `INSERT INTO employee_status_history (
          employee_id, old_status, new_status, date_change, reason, created_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        bindValues: [
          employeeId,
          oldStatusName,
          newStatusName,
          dateChange,
          reason.trim() || null,
        ],
      },
    ]);

    showToast(`Statut de "${emp.nom} ${emp.prenom}" mis à jour: ${newStatusName}.`);
    await loadData();
  }

  function getStatusBadgeClass(statusName?: string | null): string {
    if (!statusName) return styles.statusInactive;
    const lower = statusName.toLowerCase();
    if (lower === "actif") return styles.statusActive;
    if (lower.includes("déclassé") || lower.includes("médical"))
      return styles.statusWarning;
    return styles.statusInactive;
  }

  // Filtered employees list
  const filtered = employees.filter((e) => {
    const q = search.toLowerCase().trim();
    const matchesQuery =
      !q ||
      e.matricule.toLowerCase().includes(q) ||
      e.nom.toLowerCase().includes(q) ||
      e.prenom.toLowerCase().includes(q) ||
      (e.telephone && e.telephone.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === "all" ||
      String(e.current_status_id) === statusFilter;

    const matchesCategory =
      categoryFilter === "all" ||
      String(e.category_id) === categoryFilter;

    return matchesQuery && matchesStatus && matchesCategory;
  });

  return (
    <div className={styles.container}>
      <PageHeader
        title="Personnel"
        subtitle="Gestion des dossiers et statut des employés"
        actions={
          canEdit && (
            <Button
              onClick={() => {
                setEditingEmployee(null);
                setIsModalOpen(true);
              }}
            >
              <UserPlus size={18} />
              Nouvel employé
            </Button>
          )
        }
      />

      {toastMessage && (
        <div className={styles.toastSuccess}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={18} />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className={styles.actionBtn}
            style={{ color: "inherit" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.searchAndFilters}>
          <div className={styles.search}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Rechercher par matricule, nom, prénom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Tous les statuts</option>
            {statuses.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <span className={styles.count}>
          {filtered.length} employé(s) trouvé(s)
        </span>
      </div>

      <Card>
        {loading ? (
          <div className={styles.loading}>Chargement des dossiers employés...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun employé trouvé"
            message={
              search || statusFilter !== "all" || categoryFilter !== "all"
                ? "Aucun employé ne correspond aux critères de recherche."
                : "Aucun dossier employé n'a été enregistré pour le moment. Cliquez sur 'Nouvel employé' pour commencer."
            }
          />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Matricule</th>
                  <th>Nom & Prénom</th>
                  <th>Catégorie</th>
                  <th>Date Naissance</th>
                  <th>Téléphone</th>
                  <th>Statut</th>
                  {canEdit && <th className={styles.actionsCol}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id} className={styles.row}>
                    <td className={styles.matricule}>{emp.matricule}</td>
                    <td>
                      <span className={styles.fullName}>
                        {emp.nom} {emp.prenom}
                      </span>
                    </td>
                    <td>
                      {emp.category_name ? (
                        <span className={styles.categoryBadge}>
                          {emp.category_name}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{emp.date_naissance || "—"}</td>
                    <td>{emp.telephone || "—"}</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${getStatusBadgeClass(
                          emp.status_name
                        )}`}
                      >
                        {emp.status_name || "—"}
                      </span>
                    </td>
                    {canEdit && (
                      <td className={styles.actionsCell}>
                        <button
                          className={styles.actionBtn}
                          title="Modifier le dossier"
                          onClick={() => {
                            setEditingEmployee(emp);
                            setIsModalOpen(true);
                          }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.statusChangeBtn}`}
                          title="Changer le statut / Historique"
                          onClick={() => setStatusChangeEmployee(emp)}
                        >
                          <ShieldAlert size={16} />
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

      {/* Modal: Create / Edit Employee */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEmployee(null);
        }}
        onSave={handleSaveEmployee}
        employee={editingEmployee}
        statuses={statuses}
        categories={categories}
      />

      {/* Modal: Change Status */}
      <StatusChangeModal
        isOpen={!!statusChangeEmployee}
        onClose={() => setStatusChangeEmployee(null)}
        employee={statusChangeEmployee}
        statuses={statuses}
        onConfirm={handleConfirmStatusChange}
      />
    </div>
  );
}
