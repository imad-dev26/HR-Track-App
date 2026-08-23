import { useState, useEffect, type FormEvent } from "react";
import { X, Save, FilePlus, RefreshCw } from "lucide-react";
import Button from "@components/ui/Button";
import type {
  Contract,
  ContractFormData,
  ContractType,
  Employee,
} from "@app-types/index";
import styles from "./Contracts.module.css";

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
  renewEmployeeId?: number | null;
  employees: Employee[];
  contractTypes: ContractType[];
  onSave: (data: ContractFormData, contractId?: number) => Promise<void>;
}

export default function ContractModal({
  isOpen,
  onClose,
  contract,
  renewEmployeeId,
  employees,
  contractTypes,
  onSave,
}: ContractModalProps) {
  const [employeeId, setEmployeeId] = useState<number | "">("");
  const [contractTypeId, setContractTypeId] = useState<number | "">("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState<boolean>(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRenewal = !!renewEmployeeId;
  const isEditing = !!contract?.id && !isRenewal;

  useEffect(() => {
    if (contract && !renewEmployeeId) {
      // Edit existing contract
      setEmployeeId(contract.employee_id);
      setContractTypeId(contract.contract_type_id);
      setStartDate(contract.start_date || "");
      setEndDate(contract.end_date || "");
      setIsCurrent(contract.is_current === 1);
      setNotes(contract.notes || "");
    } else if (renewEmployeeId) {
      // Renew contract for employee
      setEmployeeId(renewEmployeeId);
      setContractTypeId(contract?.contract_type_id || contractTypes[0]?.id || "");
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate("");
      setIsCurrent(true);
      setNotes("Renouvellement de contrat");
    } else {
      // New contract
      setEmployeeId(employees[0]?.id || "");
      setContractTypeId(contractTypes[0]?.id || "");
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate("");
      setIsCurrent(true);
      setNotes("");
    }
    setError(null);
  }, [contract, renewEmployeeId, isOpen, employees, contractTypes]);

  if (!isOpen) return null;

  const selectedType = contractTypes.find((t) => t.id === Number(contractTypeId));
  const isCDD = selectedType?.name.toUpperCase().includes("CDD");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!employeeId) {
      setError("Veuillez sélectionner un employé.");
      return;
    }
    if (!contractTypeId) {
      setError("Veuillez sélectionner un type de contrat.");
      return;
    }
    if (!startDate) {
      setError("La date de début est obligatoire.");
      return;
    }

    if (isCDD && !endDate) {
      setError("Pour les contrats CDD, la date de fin est obligatoire.");
      return;
    }

    if (endDate && endDate < startDate) {
      setError("La date de fin ne peut pas être antérieure à la date de début.");
      return;
    }

    setSaving(true);
    try {
      await onSave(
        {
          employee_id: Number(employeeId),
          contract_type_id: Number(contractTypeId),
          start_date: startDate,
          end_date: endDate || "",
          is_current: isCurrent ? 1 : 0,
          notes: notes.trim(),
        },
        isEditing ? contract?.id : undefined
      );
      onClose();
    } catch (err: unknown) {
      setError(
        typeof err === "string"
          ? err
          : err instanceof Error
          ? err.message
          : "Erreur lors de l'enregistrement du contrat."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>
            {isRenewal
              ? "Renouveler le contrat"
              : isEditing
              ? "Modifier le contrat"
              : "Nouveau contrat"}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "contents" }}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorBanner}>{error}</div>}

            {isRenewal && (
              <div className={styles.renewalNotice}>
                <RefreshCw size={16} />
                <span>
                  Ce nouveau contrat deviendra le contrat en cours et archivera automatiquement le précédent.
                </span>
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>
                Employé <span className={styles.required}>*</span>
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : "")}
                disabled={isEditing || isRenewal}
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

            <div className={styles.field}>
              <label className={styles.label}>
                Type de contrat <span className={styles.required}>*</span>
              </label>
              <select
                value={contractTypeId}
                onChange={(e) => setContractTypeId(e.target.value ? Number(e.target.value) : "")}
                className={styles.select}
                required
              >
                <option value="">Sélectionner un type...</option>
                {contractTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
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
                  Date de fin {isCDD && <span className={styles.required}>*</span>}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={styles.input}
                  required={isCDD}
                />
              </div>
            </div>

            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={isCurrent}
                onChange={(e) => setIsCurrent(e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxLabel}>
                Contrat actif / en cours (archive automatiquement les anciens contrats)
              </span>
            </label>

            <div className={styles.field}>
              <label className={styles.label}>Notes / Observations</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Précisions sur le contrat, clause spécifique, etc."
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
              ) : isRenewal ? (
                <>
                  <RefreshCw size={18} />
                  Enregistrer le renouvellement
                </>
              ) : isEditing ? (
                <>
                  <Save size={18} />
                  Mettre à jour
                </>
              ) : (
                <>
                  <FilePlus size={18} />
                  Créer le contrat
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
