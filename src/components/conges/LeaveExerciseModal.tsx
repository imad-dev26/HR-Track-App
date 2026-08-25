import { useState, useEffect, type FormEvent } from "react";
import { X, Save, CalendarPlus } from "lucide-react";
import Button from "@components/ui/Button";
import type { LeaveExercise, LeaveExerciseFormData } from "@app-types/index";
import styles from "./CongesModal.module.css";

interface LeaveExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: LeaveExercise | null;
  onSave: (data: LeaveExerciseFormData, exerciseId?: number) => Promise<void>;
}

export default function LeaveExerciseModal({
  isOpen,
  onClose,
  exercise,
  onSave,
}: LeaveExerciseModalProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!exercise?.id;

  useEffect(() => {
    if (exercise) {
      setName(exercise.name || "");
      setStartDate(exercise.start_date || "");
      setEndDate(exercise.end_date || "");
    } else {
      const year = new Date().getFullYear();
      setName(`Exercice ${year}/${year + 1}`);
      setStartDate(`${year}-07-01`);
      setEndDate(`${year + 1}-06-30`);
    }
    setError(null);
  }, [exercise, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Le nom de l'exercice est obligatoire.");
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

    setSaving(true);
    try {
      await onSave(
        {
          name: trimmedName,
          start_date: startDate,
          end_date: endDate,
        },
        isEditing ? exercise?.id : undefined
      );
      onClose();
    } catch (err: unknown) {
      setError(
        typeof err === "string"
          ? err
          : err instanceof Error
          ? err.message
          : "Erreur lors de l'enregistrement de l'exercice."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContent} ${styles.modalSmall}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{isEditing ? "Modifier l'exercice" : "Nouvel exercice annuel"}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "contents" }}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.field}>
              <label className={styles.label}>
                Nom de l'exercice <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Exercice 2026/2027"
                className={styles.input}
                autoFocus
                required
              />
            </div>

            <div className={styles.grid2}>
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
                  Créer l'exercice
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
