
import type {
  EmployeeFormData,
  EmployeeStatusType,
  ProfessionalCategory,
} from "@app-types/index";
import styles from "./Employees.module.css";

interface EmployeeFormProps {
  formData: EmployeeFormData;
  onChange: (field: keyof EmployeeFormData, value: unknown) => void;
  errors: Record<string, string>;
  statuses: EmployeeStatusType[];
  categories: ProfessionalCategory[];
  isEditing?: boolean;
}

export default function EmployeeForm({
  formData,
  onChange,
  errors,
  statuses,
  categories,
  isEditing = false,
}: EmployeeFormProps) {
  return (
    <div>
      {/* 1. Identité & État Civil */}
      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>Identité & État Civil</div>
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label className={styles.label}>
              Matricule <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={formData.matricule}
              onChange={(e) => onChange("matricule", e.target.value)}
              placeholder="Ex: EMP-001"
              disabled={isEditing}
              className={`${styles.input} ${
                errors.matricule ? styles.inputError : ""
              }`}
              required
            />
            {errors.matricule && (
              <span className={styles.errorText}>{errors.matricule}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Nom <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => onChange("nom", e.target.value)}
              placeholder="Nom de famille"
              className={`${styles.input} ${errors.nom ? styles.inputError : ""}`}
              required
            />
            {errors.nom && (
              <span className={styles.errorText}>{errors.nom}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Prénom <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={formData.prenom}
              onChange={(e) => onChange("prenom", e.target.value)}
              placeholder="Prénom"
              className={`${styles.input} ${
                errors.prenom ? styles.inputError : ""
              }`}
              required
            />
            {errors.prenom && (
              <span className={styles.errorText}>{errors.prenom}</span>
            )}
          </div>
        </div>

        <div className={styles.grid3}>
          <div className={styles.field}>
            <label className={styles.label}>Date de naissance</label>
            <input
              type="date"
              value={formData.date_naissance}
              onChange={(e) => onChange("date_naissance", e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Lieu de naissance</label>
            <input
              type="text"
              value={formData.lieu_naissance}
              onChange={(e) => onChange("lieu_naissance", e.target.value)}
              placeholder="Ville / Wilaya"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Situation familiale</label>
            <select
              value={formData.situation_familiale}
              onChange={(e) => onChange("situation_familiale", e.target.value)}
              className={styles.select}
            >
              <option value="">Sélectionner...</option>
              <option value="Célibataire">Célibataire</option>
              <option value="Marié(e)">Marié(e)</option>
              <option value="Divorcé(e)">Divorcé(e)</option>
              <option value="Veuf/Veuve">Veuf/Veuve</option>
            </select>
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>Nombre d'enfants</label>
            <input
              type="number"
              min="0"
              value={formData.nombre_enfants}
              onChange={(e) =>
                onChange("nombre_enfants", parseInt(e.target.value, 10) || 0)
              }
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>N° d'identification nationale (NIN)</label>
            <input
              type="text"
              value={formData.national_id}
              onChange={(e) => onChange("national_id", e.target.value)}
              placeholder="Ex: 123456789012345678"
              className={styles.input}
            />
          </div>
        </div>
      </div>

      {/* 2. Coordonnées & Sécurité Sociale */}
      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>Coordonnées & Informations bancaires</div>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>Téléphone</label>
            <input
              type="tel"
              value={formData.telephone}
              onChange={(e) => onChange("telephone", e.target.value)}
              placeholder="Ex: 0555123456"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>N° Sécurité Sociale (CNAS)</label>
            <input
              type="text"
              value={formData.securite_sociale}
              onChange={(e) => onChange("securite_sociale", e.target.value)}
              placeholder="Ex: 12 3456 7890 12"
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Adresse</label>
          <input
            type="text"
            value={formData.adresse}
            onChange={(e) => onChange("adresse", e.target.value)}
            placeholder="Adresse complète de résidence"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Compte bancaire / CCP (RIP)</label>
          <input
            type="text"
            value={formData.compte_bancaire}
            onChange={(e) => onChange("compte_bancaire", e.target.value)}
            placeholder="Ex: 00799999000123456789"
            className={styles.input}
          />
        </div>
      </div>

      {/* 3. Statut & Catégorie professionnelle */}
      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>Statut & Catégorie Professionnelle</div>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>
              Statut initial <span className={styles.required}>*</span>
            </label>
            <select
              value={formData.current_status_id || ""}
              onChange={(e) =>
                onChange(
                  "current_status_id",
                  e.target.value ? parseInt(e.target.value, 10) : null
                )
              }
              className={`${styles.select} ${
                errors.current_status_id ? styles.inputError : ""
              }`}
              required
            >
              <option value="">Sélectionner un statut...</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.current_status_id && (
              <span className={styles.errorText}>
                {errors.current_status_id}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Catégorie professionnelle</label>
            <select
              value={formData.category_id || ""}
              onChange={(e) =>
                onChange(
                  "category_id",
                  e.target.value ? parseInt(e.target.value, 10) : null
                )
              }
              className={styles.select}
            >
              <option value="">Sélectionner une catégorie...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
