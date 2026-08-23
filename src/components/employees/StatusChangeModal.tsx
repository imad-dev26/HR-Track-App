import { useState, useEffect, type FormEvent } from "react";
import { X, AlertCircle } from "lucide-react";
import Button from "@components/ui/Button";
import type { Employee, EmployeeStatusType } from "@app-types/index";
import styles from "./Employees.module.css";

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  statuses: EmployeeStatusType[];
  onConfirm: (
    employeeId: number,
    newStatusId: number,
    dateChange: string,
    reason: string
  ) => Promise<void>;
}

export default function StatusChangeModal({
  isOpen,
  onClose,
  employee,
  statuses,
  onConfirm,
}: StatusChangeModalProps) {
  const [newStatusId, setNewStatusId] = useState<number | "">("");
  const [dateChange, setDateChange] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setNewStatusId("");
      setDateChange(new Date().toISOString().split("T")[0]);
      setReason("");
      setError(null);
    }
  }, [employee, isOpen]);

  if (!isOpen || !employee) return null;

  const currentEmp = employee;
  const currentStatus =
    statuses.find((s) => s.id === currentEmp.current_status_id)?.name ||
    currentEmp.status_name ||
    "—";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!newStatusId) {
      setError("Veuillez sélectionner un nouveau statut.");
      return;
    }
    if (newStatusId === currentEmp.current_status_id) {
      setError("Le nouveau statut doit être différent du statut actuel.");
      return;
    }
    if (!dateChange) {
      setError("La date de changement est obligatoire.");
      return;
    }

    setSaving(true);
    try {
      await onConfirm(currentEmp.id, Number(newStatusId), dateChange, reason);
      onClose();
    } catch (err: unknown) {
      setError(
        typeof err === "string"
          ? err
          : err instanceof Error
          ? err.message
          : "Erreur lors du changement de statut."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.modalContent} ${styles.modalSmall}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2>Changement de statut / Désactivation</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "contents" }}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.statusCard}>
              <div className={styles.statusCardRow}>
                <span>Employé:</span>
                <strong>
                  {employee.nom} {employee.prenom} ({employee.matricule})
                </strong>
              </div>
              <div className={styles.statusCardRow}>
                <span>Statut actuel:</span>
                <span className={styles.statusBadge}>{currentStatus}</span>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Nouveau statut <span className={styles.required}>*</span>
              </label>
              <select
                value={newStatusId}
                onChange={(e) =>
                  setNewStatusId(e.target.value ? Number(e.target.value) : "")
                }
                className={styles.select}
                required
              >
                <option value="">Sélectionner le nouveau statut...</option>
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Date de prise d'effet <span className={styles.required}>*</span>
              </label>
              <input
                type="date"
                value={dateChange}
                onChange={(e) => setDateChange(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Motif / Justification</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Indiquez le motif du changement de statut..."
                className={styles.textarea}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button type="submit" variant="danger" disabled={saving}>
              {saving ? (
                <>Enregistrement...</>
              ) : (
                <>
                  <AlertCircle size={18} />
                  Confirmer le changement
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
