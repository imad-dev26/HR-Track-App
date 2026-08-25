import { useState, useEffect, useCallback } from "react";
import PageHeader from "@components/ui/PageHeader";
import Card from "@components/ui/Card";
import Button from "@components/ui/Button";
import EmptyState from "@components/ui/EmptyState";
import { select, execute, executeTransaction } from "@lib/database";
import { useAuthStore } from "@store/authStore";
import { canModify } from "@lib/permissions";
import type {
  Leave,
  LeaveFormData,
  LeaveType,
  LeaveExercise,
  LeaveExerciseFormData,
  RecoveryBalance,
  Employee,
} from "@app-types/index";
import {
  CalendarDays,
  CalendarPlus,
  Search,
  Pencil,
  Plus,
  Scale,
  CheckCircle2,
  X,
} from "lucide-react";
import LeaveModal from "@components/conges/LeaveModal";
import LeaveExerciseModal from "@components/conges/LeaveExerciseModal";
import RecoveryModal from "@components/conges/RecoveryModal";
import styles from "./Conges.module.css";

type Tab = "leaves" | "exercises" | "recovery";

export default function Conges() {
  const role = useAuthStore((s) => s.role);
  const canEdit = canModify(role, "conges");

  const [activeTab, setActiveTab] = useState<Tab>("leaves");
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [exercises, setExercises] = useState<LeaveExercise[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recoveryBalances, setRecoveryBalances] = useState<RecoveryBalance[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and filters for leaves tab
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal states
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<Leave | null>(null);

  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<LeaveExercise | null>(null);

  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryEmployee, setRecoveryEmployee] = useState<Employee | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [typeRows, exRows, leaveRows, empRows, recRows] = await Promise.all([
        select<LeaveType>("SELECT * FROM leave_types WHERE active = 1 ORDER BY sort_order ASC"),
        select<LeaveExercise>("SELECT * FROM leave_exercises ORDER BY start_date DESC"),
        select<Leave>(
          `SELECT l.*, e.nom as employee_nom, e.prenom as employee_prenom, e.matricule as employee_matricule, lt.name as type_name, ex.name as exercise_name
           FROM leaves l
           LEFT JOIN employees e ON l.employee_id = e.id
           LEFT JOIN leave_types lt ON l.leave_type_id = lt.id
           LEFT JOIN leave_exercises ex ON l.exercise_id = ex.id
           ORDER BY l.start_date DESC`
        ),
        select<Employee>("SELECT * FROM employees ORDER BY nom ASC, prenom ASC"),
        select<RecoveryBalance>(
          `SELECT rb.*, e.nom as employee_nom, e.prenom as employee_prenom, e.matricule as employee_matricule
           FROM recovery_balance rb
           LEFT JOIN employees e ON rb.employee_id = e.id
           ORDER BY e.nom ASC, e.prenom ASC`
        ),
      ]);

      setLeaveTypes(typeRows || []);
      setExercises(exRows || []);
      setLeaves(leaveRows || []);
      setEmployees(empRows || []);
      setRecoveryBalances(recRows || []);
    } catch (err) {
      console.error("Error loading leave data:", err);
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

  // Handle Leave Save (Create / Update)
  async function handleSaveLeave(data: LeaveFormData, leaveId?: number) {
    const emp = employees.find((e) => e.id === Number(data.employee_id));
    const empLabel = emp ? `${emp.nom} ${emp.prenom}` : "Employé";

    if (leaveId) {
      await execute(
        `UPDATE leaves SET
          leave_type_id = ?, exercise_id = ?, start_date = ?, end_date = ?, number_days = ?, status = ?, observation = ?, updated_at = datetime('now')
        WHERE id = ?`,
        [
          data.leave_type_id,
          data.exercise_id || null,
          data.start_date,
          data.end_date,
          data.number_days,
          data.status,
          data.observation || null,
          leaveId,
        ]
      );
      showToast(`Congé de "${empLabel}" mis à jour.`);
    } else {
      await execute(
        `INSERT INTO leaves (
          employee_id, leave_type_id, exercise_id, start_date, end_date, number_days, status, observation, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          data.employee_id,
          data.leave_type_id,
          data.exercise_id || null,
          data.start_date,
          data.end_date,
          data.number_days,
          data.status,
          data.observation || null,
        ]
      );
      showToast(`Nouveau congé enregistré pour "${empLabel}".`);
    }

    await loadData();
  }

  // Handle Annual Exercise Save
  async function handleSaveExercise(data: LeaveExerciseFormData, exerciseId?: number) {
    if (exerciseId) {
      await execute(
        "UPDATE leave_exercises SET name = ?, start_date = ?, end_date = ? WHERE id = ?",
        [data.name, data.start_date, data.end_date, exerciseId]
      );
      showToast(`Exercice "${data.name}" mis à jour.`);
    } else {
      await execute(
        "INSERT INTO leave_exercises (name, start_date, end_date, created_at) VALUES (?, ?, ?, datetime('now'))",
        [data.name, data.start_date, data.end_date]
      );
      showToast(`Nouvel exercice "${data.name}" créé.`);
    }
    await loadData();
  }

  // Handle Recovery Adjustment
  async function handleSaveRecoveryAdjustment(
    employeeId: number,
    operationType: "CREDIT" | "DEBIT",
    amount: number,
    date: string,
    reason: string
  ) {
    const emp = employees.find((e) => e.id === employeeId);
    const empLabel = emp ? `${emp.nom} ${emp.prenom}` : "Employé";
    const delta = operationType === "CREDIT" ? amount : -amount;

    // Check if recovery_balance row exists for employee
    const existing = recoveryBalances.find((rb) => rb.employee_id === employeeId);

    if (existing) {
      await executeTransaction([
        {
          query: `UPDATE recovery_balance SET balance = balance + ?, updated_at = datetime('now') WHERE employee_id = ?`,
          bindValues: [delta, employeeId],
        },
        {
          query: `INSERT INTO recovery_history (employee_id, operation_type, amount, date, reason, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
          bindValues: [employeeId, operationType, amount, date, reason || null],
        },
      ]);
    } else {
      await executeTransaction([
        {
          query: `INSERT INTO recovery_balance (employee_id, balance, updated_at) VALUES (?, ?, datetime('now'))`,
          bindValues: [employeeId, Math.max(0, delta)],
        },
        {
          query: `INSERT INTO recovery_history (employee_id, operation_type, amount, date, reason, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
          bindValues: [employeeId, operationType, amount, date, reason || null],
        },
      ]);
    }

    showToast(
      `Solde de récupération mis à jour pour "${empLabel}" (${operationType === "CREDIT" ? "+" : "-"}${amount} jour(s)).`
    );
    await loadData();
  }

  function getStatusBadgeClass(status?: string): string {
    switch (status) {
      case "Validé":
        return styles.statusValidated;
      case "En attente":
        return styles.statusPending;
      case "Refusé":
        return styles.statusRejected;
      case "Annulé":
        return styles.statusCanceled;
      default:
        return styles.statusCanceled;
    }
  }

  // Filtered leaves
  const filteredLeaves = leaves.filter((l) => {
    const q = search.toLowerCase().trim();
    const matchesQuery =
      !q ||
      (l.employee_nom && l.employee_nom.toLowerCase().includes(q)) ||
      (l.employee_prenom && l.employee_prenom.toLowerCase().includes(q)) ||
      (l.employee_matricule && l.employee_matricule.toLowerCase().includes(q)) ||
      (l.observation && l.observation.toLowerCase().includes(q));

    const matchesType =
      typeFilter === "all" || String(l.leave_type_id) === typeFilter;

    const matchesStatus =
      statusFilter === "all" || l.status === statusFilter;

    return matchesQuery && matchesType && matchesStatus;
  });

  return (
    <div className={styles.container}>
      <PageHeader
        title="Congés"
        subtitle="Gestion des congés, exercices annuels et soldes de récupération"
        actions={
          canEdit && (
            <div style={{ display: "flex", gap: "8px" }}>
              {activeTab === "leaves" && (
                <Button
                  onClick={() => {
                    setEditingLeave(null);
                    setIsLeaveModalOpen(true);
                  }}
                >
                  <CalendarPlus size={18} />
                  Nouveau congé
                </Button>
              )}
              {activeTab === "exercises" && (
                <Button
                  onClick={() => {
                    setEditingExercise(null);
                    setIsExerciseModalOpen(true);
                  }}
                >
                  <Plus size={18} />
                  Nouvel exercice
                </Button>
              )}
            </div>
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

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "leaves" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("leaves")}
        >
          <CalendarDays size={18} />
          Demandes de congés
          <span className={styles.tabCount}>{leaves.length}</span>
        </button>

        <button
          className={`${styles.tab} ${activeTab === "exercises" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("exercises")}
        >
          Exercices annuels
          <span className={styles.tabCount}>{exercises.length}</span>
        </button>

        <button
          className={`${styles.tab} ${activeTab === "recovery" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("recovery")}
        >
          <Scale size={18} />
          Soldes de récupération (DAC)
          <span className={styles.tabCount}>{recoveryBalances.length}</span>
        </button>
      </div>

      {activeTab === "leaves" && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.searchAndFilters}>
              <div className={styles.search}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Rechercher par employé, matricule..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">Tous les types</option>
                {leaveTypes.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">Tous les statuts</option>
                <option value="Validé">Validé</option>
                <option value="En attente">En attente</option>
                <option value="Refusé">Refusé</option>
                <option value="Annulé">Annulé</option>
              </select>
            </div>

            <span className={styles.count}>
              {filteredLeaves.length} congé(s) trouvé(s)
            </span>
          </div>

          <Card>
            {loading ? (
              <div className={styles.loading}>Chargement des congés...</div>
            ) : filteredLeaves.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Aucun congé trouvé"
                message={
                  search || typeFilter !== "all" || statusFilter !== "all"
                    ? "Aucun congé ne correspond aux critères sélectionnés."
                    : "Aucun congé n'a été enregistré. Cliquez sur 'Nouveau congé' pour commencer."
                }
              />
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Matricule</th>
                      <th>Employé</th>
                      <th>Type</th>
                      <th>Exercice</th>
                      <th>Du</th>
                      <th>Au</th>
                      <th>Jours</th>
                      <th>Statut</th>
                      <th>Observations</th>
                      {canEdit && <th className={styles.actionsCol}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaves.map((l) => (
                      <tr key={l.id} className={styles.row}>
                        <td className={styles.employeeMatricule}>
                          {l.employee_matricule || "—"}
                        </td>
                        <td>
                          <span className={styles.employeeName}>
                            {l.employee_nom || "—"} {l.employee_prenom || ""}
                          </span>
                        </td>
                        <td>
                          <span className={styles.typeBadge}>
                            {l.type_name || "—"}
                          </span>
                        </td>
                        <td>
                          {l.exercise_name ? (
                            <span className={styles.exerciseBadge}>
                              {l.exercise_name}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>{l.start_date}</td>
                        <td>{l.end_date}</td>
                        <td>
                          <strong>{l.number_days} j</strong>
                        </td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${getStatusBadgeClass(
                              l.status
                            )}`}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td>{l.observation || "—"}</td>
                        {canEdit && (
                          <td className={styles.actionsCell}>
                            <button
                              className={styles.actionBtn}
                              title="Modifier le congé"
                              onClick={() => {
                                setEditingLeave(l);
                                setIsLeaveModalOpen(true);
                              }}
                            >
                              <Pencil size={16} />
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
        </>
      )}

      {activeTab === "exercises" && (
        <Card title="Exercices annuels de congés">
          {exercises.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Aucun exercice annuel"
              message="Créez des exercices annuels pour rattacher les congés annuels des employés."
            />
          ) : (
            <div className={styles.exerciseGrid}>
              {exercises.map((ex) => (
                <div key={ex.id} className={styles.exerciseCard}>
                  <div className={styles.exerciseInfo}>
                    <span className={styles.exerciseTitle}>{ex.name}</span>
                    <span className={styles.exerciseDates}>
                      Période: {ex.start_date} → {ex.end_date}
                    </span>
                  </div>
                  {canEdit && (
                    <button
                      className={styles.actionBtn}
                      title="Modifier l'exercice"
                      onClick={() => {
                        setEditingExercise(ex);
                        setIsExerciseModalOpen(true);
                      }}
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "recovery" && (
        <Card title="Soldes de récupération (DAC / Reliquat)">
          {employees.length === 0 ? (
            <EmptyState
              icon={Scale}
              title="Aucun employé"
              message="Ajoutez des employés pour gérer leurs soldes de récupération."
            />
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Matricule</th>
                    <th>Employé</th>
                    <th>Solde disponible (Jours)</th>
                    <th>Dernière mise à jour</th>
                    {canEdit && <th className={styles.actionsCol}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const rec = recoveryBalances.find((rb) => rb.employee_id === emp.id);
                    const bal = rec ? rec.balance : 0;
                    return (
                      <tr key={emp.id} className={styles.row}>
                        <td className={styles.employeeMatricule}>{emp.matricule}</td>
                        <td>
                          <span className={styles.employeeName}>
                            {emp.nom} {emp.prenom}
                          </span>
                        </td>
                        <td>
                          <span className={styles.balanceNumber}>{bal} jour(s)</span>
                        </td>
                        <td>{rec?.updated_at || "—"}</td>
                        {canEdit && (
                          <td className={styles.actionsCell}>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setRecoveryEmployee(emp);
                                setIsRecoveryModalOpen(true);
                              }}
                            >
                              <Scale size={14} />
                              Ajuster solde
                            </Button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Modal: Leave Request */}
      <LeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => {
          setIsLeaveModalOpen(false);
          setEditingLeave(null);
        }}
        leave={editingLeave}
        employees={employees}
        leaveTypes={leaveTypes}
        exercises={exercises}
        onSave={handleSaveLeave}
      />

      {/* Modal: Leave Exercise */}
      <LeaveExerciseModal
        isOpen={isExerciseModalOpen}
        onClose={() => {
          setIsExerciseModalOpen(false);
          setEditingExercise(null);
        }}
        exercise={editingExercise}
        onSave={handleSaveExercise}
      />

      {/* Modal: Recovery Balance Adjustment */}
      <RecoveryModal
        isOpen={isRecoveryModalOpen}
        onClose={() => {
          setIsRecoveryModalOpen(false);
          setRecoveryEmployee(null);
        }}
        employee={recoveryEmployee}
        currentBalance={
          recoveryBalances.find((rb) => rb.employee_id === recoveryEmployee?.id) || null
        }
        onSaveAdjustment={handleSaveRecoveryAdjustment}
      />
    </div>
  );
}
