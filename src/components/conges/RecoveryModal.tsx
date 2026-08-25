import { useState, type FormEvent } from "react";
import { X, PlusCircle, MinusCircle, Scale } from "lucide-react";
import Button from "@components/ui/Button";
import type { Employee, RecoveryBalance } from "@app-types/index";
import styles from "./CongesModal.module.css";

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  currentBalance: RecoveryBalance | null;
  onSaveAdjustment: (
    employeeId: number,
    operationType: "CREDIT" | "DEBIT",
    amount: number,
    date: string,
    reason: string
  ) => Promise<void>;
}

export default function RecoveryModal({
  isOpen,
  onClose,
  employee,
  currentBalance,
  onSaveAdjustment,
}: RecoveryModalProps) {
  const [operationType, setOperationType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [amount, setAmount] = useState<number>(1);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !employee) return null;

  const currentBal = currentBalance?.balance ?? 0;
  const newProjectedBalance =
    operationType === "CREDIT" ? currentBal + Number(amount || 0) : currentBal - Number(amount || 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!amount || amount <= 0) {
      setError("Le montant doit être supérieur à zéro.");
      return;
    }
    if (!date) {
      setError("La date de l'opération est obligatoire.");
      return;
    }

    setSaving(true);
    try {
      if (employee) {
        await onSaveAdjustment(employee.id, operationType, Number(amount), date, reason.trim());
      }
      onClose();
    } catch (err: unknown) {
      setError(
        typeof err === "string"
          ? err
          : err instanceof Error
          ? err.message
          : "Erreur lors de l'ajustement du solde."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContent} ${styles.modalSmall}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Ajuster le solde de récupération (DAC)</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "contents" }}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.employeeCard}>
              <div>
                <strong style={{ display: "block" }}>
                  {employee.nom} {employee.prenom}
                </strong>
                <span style={{ fontSize: "12px", color: "var(--neutral-500)" }}>
                  Matricule: {employee.matricule}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "12px", color: "var(--neutral-500)", display: "block" }}>
                  Solde actuel
                </span>
                <span className={styles.balanceHighlight}>{currentBal} jour(s)</span>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Opération <span className={styles.required}>*</span>
              </label>
              <select
                value={operationType}
                onChange={(e) => setOperationType(e.target.value as "CREDIT" | "DEBIT")}
                className={styles.select}
                required
              >
                <option value="CREDIT">+ Crédit (Ajouter des jours de récupération / DAC)</option>
                <option value="DEBIT">- Débit (Consommer / Déduire des jours)</option>
              </select>
            </div>

            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Nombre de jours <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Date de l'opération <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.daysInfo}>
              <Scale size={16} />
              <span>
                Nouveau solde calculé: <strong>{newProjectedBalance} jour(s)</strong>
              </span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Motif / Référence</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Ex: Travail le jour férié du 1er Novembre, permanence..."
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
              ) : operationType === "CREDIT" ? (
                <>
                  <PlusCircle size={18} />
                  Créditer le solde
                </>
              ) : (
                <>
                  <MinusCircle size={18} />
                  Débiter le solde
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
