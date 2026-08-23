import { useState, useEffect, type FormEvent } from "react";
import { X, Save, Plus } from "lucide-react";
import Button from "@components/ui/Button";
import type { Service } from "@app-types/index";
import styles from "./Organization.module.css";

export type OrgTab = "services" | "sections" | "functions" | "levels" | "categories";

export interface OrgItemData {
  id?: number;
  name: string;
  active?: number;
  sort_order?: number;
  service_id?: number;
}

interface OrganizationItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  tab: OrgTab;
  item: OrgItemData | null;
  services: Service[];
  onSave: (data: OrgItemData) => Promise<void>;
}

const TAB_TITLES: Record<OrgTab, { singular: string; plural: string }> = {
  services: { singular: "un service", plural: "Services" },
  sections: { singular: "une section", plural: "Sections" },
  functions: { singular: "une fonction", plural: "Fonctions" },
  levels: { singular: "un niveau", plural: "Niveaux" },
  categories: { singular: "une catégorie professionnelle", plural: "Catégories" },
};

export default function OrganizationItemModal({
  isOpen,
  onClose,
  tab,
  item,
  services,
  onSave,
}: OrganizationItemModalProps) {
  const [name, setName] = useState("");
  const [serviceId, setServiceId] = useState<number | "">("");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [active, setActive] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!item?.id;

  useEffect(() => {
    if (item) {
      setName(item.name || "");
      setServiceId(item.service_id ?? (services[0]?.id || ""));
      setSortOrder(item.sort_order ?? 0);
      setActive(item.active !== 0);
    } else {
      setName("");
      setServiceId(services[0]?.id || "");
      setSortOrder(0);
      setActive(true);
    }
    setError(null);
  }, [item, isOpen, services]);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Le nom est obligatoire.");
      return;
    }

    if (tab === "sections" && !serviceId) {
      setError("Veuillez sélectionner un service de rattachement.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        id: item?.id,
        name: trimmedName,
        active: active ? 1 : 0,
        sort_order: Number(sortOrder) || 0,
        service_id: tab === "sections" ? Number(serviceId) : undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(
        typeof err === "string"
          ? err
          : err instanceof Error
          ? err.message
          : "Erreur lors de l'enregistrement."
      );
    } finally {
      setSaving(false);
    }
  }

  const { singular } = TAB_TITLES[tab] || { singular: "un élément", plural: "Éléments" };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>
            {isEditing ? `Modifier ${singular}` : `Ajouter ${singular}`}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "contents" }}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.field}>
              <label className={styles.label}>
                Nom <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Nom de ${singular}`}
                className={styles.input}
                autoFocus
                required
              />
            </div>

            {tab === "sections" && (
              <div className={styles.field}>
                <label className={styles.label}>
                  Service de rattachement <span className={styles.required}>*</span>
                </label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value ? Number(e.target.value) : "")}
                  className={styles.select}
                  required
                >
                  <option value="">Sélectionner un service...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>Ordre d'affichage (Tri)</label>
              <input
                type="number"
                min="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                className={styles.input}
              />
            </div>

            {tab !== "levels" && (
              <label className={styles.checkboxField}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxLabel}>Élément actif</span>
              </label>
            )}
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
                  <Plus size={18} />
                  Ajouter
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
