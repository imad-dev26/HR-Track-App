import { useState, useEffect, type FormEvent } from "react";
import { X, Save, CalendarPlus, Info } from "lucide-react";
import Button from "@components/ui/Button";
import type {
  Leave,
  LeaveFormData,
  LeaveType,
  LeaveExercise,
  Employee,
} from "@app-types/index";
import styles from "./CongesModal.module.css";

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  leave: Leave | null;
  employees: Employee[];
  leaveTypes: LeaveType[];
  exercises: LeaveExercise[];
  onSave: (data: LeaveFormData, leaveId?: number) => Promise<void>;
}

export default function LeaveModal({
  isOpen,
  onClose,
  leave,
  employees,
  leaveTypes,
  exercises,
  onSave,
}: LeaveModalProps) {
  const [employeeId, setEmployeeId] = useState<number | "">("");
  const [leaveTypeId, setLeaveTypeId] = useState<number | "">("");
  const [exerciseId, setExerciseId] = useState<number | "" | null>("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [numberDays, setNumberDays] = useState<number>(1);
  const [status, setStatus] = useState<string>("Validé");
  const [observation, setObservation] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!leave?.id;

  // Auto-calculate difference in days
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0) {
        setNumberDays(diffDays);
      }
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (leave) {
      setEmployeeId(leave.employee_id);
      setLeaveTypeId(leave.leave_type_id);
      setExerciseId(leave.exercise_id ?? "");
      setStartDate(leave.start_date || "");
      setEndDate(leave.end_date || "");
      setNumberDays(leave.number_days || 1);
      setStatus(leave.status || "Validé");
      setObservation(leave.observation || "");
    } else {
      setEmployeeId(employees[0]?.id || "");
      setLeaveTypeId(leaveTypes[0]?.id || "");
      setExerciseId(exercises[0]?.id || "");
      const today = new Date().toISOString().split("T")[0];
      setStartDate(today);
      setEndDate(today);
      setNumberDays(1);
      setStatus("Validé");
      setObservation("");
    }
    setError(null);
  }, [leave, isOpen, employees, leaveTypes, exercises]);

  if (!isOpen) return null;

  const selectedType = leaveTypes.find((t) => t.id === Number(leaveTypeId));
  const isAnnualLeave = selectedType?.name.toLowerCase().includes("annuel");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!employeeId) {
      setError("Veuillez sélectionner un employé.");
      return;
    }
    if (!leaveTypeId) {
      setError("Veuillez sélectionner un type de congé.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Les dates de début et de fin sont obligatoires.");
      return;
    }
    if (endDate < startDate) {
      setError("La date de fin ne peut pas être antérieure à la date de début.");
      return;
    }
    if (numberDays <= 0) {
      setError("Le nombre de jours doit être supérieur à zéro.");
      return;
    }

    setSaving(true);
    try {
      await onSave(
        {
          employee_id: Number(employeeId),
          leave_type_id: Number(leaveTypeId),
          exercise_id: isAnnualLeave && exerciseId ? Number(exerciseId) : null,
          start_date: startDate,
          end_date: endDate,
          number_days: Number(numberDays),
          status,
          observation: observation.trim(),
        },
        isEditing ? leave?.id : undefined
      );
      onClose();
    } catch (err: unknown) {
      setError(
        typeof err === "string"
          ? err
          : err instanceof Error
          ? err.message
          : "Erreur lors de l'enregistrement du congé."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{isEditing ? "Modifier le congé" : "Enregistrer un congé"}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "contents" }}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.field}>
              <label className={styles.label}>
                Employé <span className={styles.required}>*</span>
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : "")}
                disabled={isEditing}
                className={styles.select}
                required
              >
                <option value="">Sélectionner un employé...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nom} {emp.prenom} ({emp.matricule})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Type de congé <span className={styles.required}>*</span>
                </label>
                <select
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(e.target.value ? Number(e.target.value) : "")}
                  className={styles.select}
                  required
                >
                  <option value="">Sélectionner un type...</option>
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Statut de la demande <span className={styles.required}>*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={styles.select}
                  required
                >
                  <option value="Validé">Validé</option>
                  <option value="En attente">En attente</option>
                  <option value="Refusé">Refusé</option>
                  <option value="Annulé">Annulé</option>
                </select>
              </div>
            </div>

            {isAnnualLeave && (
              <div className={styles.field}>
                <label className={styles.label}>Exercice annuel rattaché</label>
                <select
                  value={exerciseId || ""}
                  onChange={(e) => setExerciseId(e.target.value ? Number(e.target.value) : "")}
                  className={styles.select}
                >
                  <option value="">Sélectionner un exercice...</option>
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} ({ex.start_date} → {ex.end_date})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={styles.grid3}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Date de début <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Date de fin <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Nombre de jours <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={numberDays}
                  onChange={(e) => setNumberDays(Number(e.target.value) || 1)}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.daysInfo}>
              <Info size={16} />
              <span>
                Durée calculée: <strong>{numberDays} jour(s)</strong> (modifiable si temps partiel ou décompte spécifique).
              </span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Observations / Motif</label>
              <textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                rows={2}
                placeholder="Précisions éventuelles sur le congé..."
                className={styles.textarea}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? (
                <>Enregistrement...</>
              ) : isEditing ? (
                <>
                  <Save size={18} />
                  Mettre à jour
                </>
              ) : (
                <>
                  <CalendarPlus size={18} />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
