import { useState, useEffect, type FormEvent } from "react";
import { X, Save, UserCheck } from "lucide-react";
import Button from "@components/ui/Button";
import EmployeeForm from "./EmployeeForm";
import type {
  Employee,
  EmployeeFormData,
  EmployeeStatusType,
  ProfessionalCategory,
} from "@app-types/index";
import styles from "./Employees.module.css";

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EmployeeFormData) => Promise<void>;
  employee?: Employee | null;
  statuses: EmployeeStatusType[];
  categories: ProfessionalCategory[];
}

const emptyFormData: EmployeeFormData = {
  matricule: "",
  nom: "",
  prenom: "",
  date_naissance: "",
  lieu_naissance: "",
  national_id: "",
  securite_sociale: "",
  telephone: "",
  adresse: "",
  compte_bancaire: "",
  situation_familiale: "",
  nombre_enfants: 0,
  category_id: null,
  current_status_id: 1, // Default 'Actif'
};

export default function EmployeeModal({
  isOpen,
  onClose,
  onSave,
  employee,
  statuses,
  categories,
}: EmployeeModalProps) {
  const [formData, setFormData] = useState<EmployeeFormData>(emptyFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = !!employee;

  useEffect(() => {
    if (employee) {
      setFormData({
        matricule: employee.matricule || "",
        nom: employee.nom || "",
        prenom: employee.prenom || "",
        date_naissance: employee.date_naissance || "",
        lieu_naissance: employee.lieu_naissance || "",
        national_id: employee.national_id || "",
        securite_sociale: employee.securite_sociale || "",
        telephone: employee.telephone || "",
        adresse: employee.adresse || "",
        compte_bancaire: employee.compte_bancaire || "",
        situation_familiale: employee.situation_familiale || "",
        nombre_enfants: employee.nombre_enfants || 0,
        category_id: employee.category_id,
        current_status_id: employee.current_status_id,
      });
    } else {
      // Find default 'Actif' status id if available
      const activeStatus = statuses.find((s) => s.name.toLowerCase() === "actif");
      setFormData({
        ...emptyFormData,
        current_status_id: activeStatus ? activeStatus.id : 1,
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [employee, isOpen, statuses]);

  if (!isOpen) return null;

  function handleChange(field: keyof EmployeeFormData, value: unknown) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.matricule.trim()) {
      newErrors.matricule = "Le matricule est obligatoire.";
    }
    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom de famille est obligatoire.";
    }
    if (!formData.prenom.trim()) {
      newErrors.prenom = "Le prénom est obligatoire.";
    }
    if (!formData.current_status_id) {
      newErrors.current_status_id = "Le statut est obligatoire.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: unknown) {
      setSubmitError(
        typeof err === "string"
          ? err
          : err instanceof Error
          ? err.message
          : "Erreur lors de l'enregistrement de l'employé."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2>
            {isEditing ? `Modifier l'employé: ${employee.nom} ${employee.prenom}` : "Nouvel employé"}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "contents" }}>
          <div className={styles.modalBody}>
            {submitError && (
              <div className={styles.errorBanner}>{submitError}</div>
            )}

            <EmployeeForm
              formData={formData}
              onChange={handleChange}
              errors={errors}
              statuses={statuses}
              categories={categories}
              isEditing={isEditing}
            />
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
                  <UserCheck size={18} />
                  Créer l'employé
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
