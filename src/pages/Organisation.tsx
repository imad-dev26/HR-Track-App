import { useState, useEffect, useCallback } from "react";
import PageHeader from "@components/ui/PageHeader";
import Card from "@components/ui/Card";
import Button from "@components/ui/Button";
import { select, execute } from "@lib/database";
import { useAuthStore } from "@store/authStore";
import { canModify } from "@lib/permissions";
import type {
  Service,
  Section,
  Function as FunctionType,
  Level,
  ProfessionalCategory,
} from "@app-types/index";
import { Building2, Plus, Pencil, CheckCircle2, X } from "lucide-react";
import OrganizationItemModal, {
  type OrgTab,
  type OrgItemData,
} from "@components/organisation/OrganizationItemModal";
import styles from "./Organisation.module.css";

export default function Organisation() {
  const role = useAuthStore((s) => s.role);
  const canEdit = canModify(role, "organisation");
  const [activeTab, setActiveTab] = useState<OrgTab>("services");

  const [services, setServices] = useState<Service[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [functions, setFunctions] = useState<FunctionType[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [categories, setCategories] = useState<ProfessionalCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrgItemData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [svcRows, secRows, fnRows, lvlRows, catRows] = await Promise.all([
        select<Service>("SELECT * FROM services ORDER BY sort_order ASC, name ASC"),
        select<Section>("SELECT * FROM sections ORDER BY sort_order ASC, name ASC"),
        select<FunctionType>("SELECT * FROM functions ORDER BY sort_order ASC, name ASC"),
        select<Level>("SELECT * FROM levels ORDER BY sort_order ASC, name ASC"),
        select<ProfessionalCategory>(
          "SELECT * FROM professional_categories ORDER BY sort_order ASC, name ASC"
        ),
      ]);

      setServices(svcRows || []);
      setSections(secRows || []);
      setFunctions(fnRows || []);
      setLevels(lvlRows || []);
      setCategories(catRows || []);
    } catch (err) {
      console.error("Error loading organization data:", err);
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

  async function handleSaveItem(data: OrgItemData) {
    if (data.id) {
      // Update existing item
      switch (activeTab) {
        case "services":
          await execute(
            "UPDATE services SET name = ?, active = ?, sort_order = ? WHERE id = ?",
            [data.name, data.active ?? 1, data.sort_order ?? 0, data.id]
          );
          showToast(`Service "${data.name}" mis à jour.`);
          break;
        case "sections":
          await execute(
            "UPDATE sections SET name = ?, service_id = ?, active = ?, sort_order = ? WHERE id = ?",
            [data.name, data.service_id ?? 1, data.active ?? 1, data.sort_order ?? 0, data.id]
          );
          showToast(`Section "${data.name}" mise à jour.`);
          break;
        case "functions":
          await execute(
            "UPDATE functions SET name = ?, active = ?, sort_order = ? WHERE id = ?",
            [data.name, data.active ?? 1, data.sort_order ?? 0, data.id]
          );
          showToast(`Fonction "${data.name}" mise à jour.`);
          break;
        case "levels":
          await execute(
            "UPDATE levels SET name = ?, sort_order = ? WHERE id = ?",
            [data.name, data.sort_order ?? 0, data.id]
          );
          showToast(`Niveau "${data.name}" mis à jour.`);
          break;
        case "categories":
          await execute(
            "UPDATE professional_categories SET name = ?, active = ?, sort_order = ? WHERE id = ?",
            [data.name, data.active ?? 1, data.sort_order ?? 0, data.id]
          );
          showToast(`Catégorie "${data.name}" mise à jour.`);
          break;
      }
    } else {
      // Create new item
      switch (activeTab) {
        case "services":
          await execute(
            "INSERT INTO services (name, active, sort_order, created_at) VALUES (?, ?, ?, datetime('now'))",
            [data.name, data.active ?? 1, data.sort_order ?? 0]
          );
          showToast(`Nouveau service "${data.name}" créé.`);
          break;
        case "sections":
          await execute(
            "INSERT INTO sections (service_id, name, active, sort_order, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
            [data.service_id ?? 1, data.name, data.active ?? 1, data.sort_order ?? 0]
          );
          showToast(`Nouvelle section "${data.name}" créée.`);
          break;
        case "functions":
          await execute(
            "INSERT INTO functions (name, active, sort_order, created_at) VALUES (?, ?, ?, datetime('now'))",
            [data.name, data.active ?? 1, data.sort_order ?? 0]
          );
          showToast(`Nouvelle fonction "${data.name}" créée.`);
          break;
        case "levels":
          await execute(
            "INSERT INTO levels (name, sort_order, created_at) VALUES (?, ?, datetime('now'))",
            [data.name, data.sort_order ?? 0]
          );
          showToast(`Nouveau niveau "${data.name}" créé.`);
          break;
        case "categories":
          await execute(
            "INSERT INTO professional_categories (name, active, sort_order, created_at) VALUES (?, ?, ?, datetime('now'))",
            [data.name, data.active ?? 1, data.sort_order ?? 0]
          );
          showToast(`Nouvelle catégorie "${data.name}" créée.`);
          break;
      }
    }

    await loadData();
  }

  async function handleToggleActive(item: { id: number; name: string; active?: number }) {
    const newActive = item.active ? 0 : 1;
    const table =
      activeTab === "services"
        ? "services"
        : activeTab === "sections"
        ? "sections"
        : activeTab === "functions"
        ? "functions"
        : activeTab === "categories"
        ? "professional_categories"
        : null;

    if (!table) return;

    await execute(`UPDATE ${table} SET active = ? WHERE id = ?`, [newActive, item.id]);
    showToast(
      `"${item.name}" ${newActive === 1 ? "activé(e)" : "désactivé(e)"}.`
    );
    await loadData();
  }

  const tabs: { key: OrgTab; label: string; count: number }[] = [
    { key: "services", label: "Services", count: services.length },
    { key: "sections", label: "Sections", count: sections.length },
    { key: "functions", label: "Fonctions", count: functions.length },
    { key: "levels", label: "Niveaux", count: levels.length },
    { key: "categories", label: "Catégories", count: categories.length },
  ];

  return (
    <div className={styles.container}>
      <PageHeader
        title="Organisation"
        subtitle="Services, sections, fonctions, niveaux et catégories professionnelles"
        actions={
          canEdit && (
            <Button
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
            >
              <Plus size={18} />
              Ajouter
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

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className={styles.tabCount}>{tab.count}</span>
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <div className={styles.empty}>
            <p>Chargement des données d'organisation...</p>
          </div>
        ) : (
          <>
            {activeTab === "services" && (
              <OrgItemList
                items={services.map((s) => ({
                  id: s.id,
                  name: s.name,
                  active: s.active,
                  sort_order: s.sort_order,
                }))}
                canEdit={canEdit}
                emptyTitle="Aucun service"
                emptyMessage="Cliquez sur 'Ajouter' pour créer un nouveau service."
                onEdit={(it) => {
                  setEditingItem(it);
                  setIsModalOpen(true);
                }}
                onToggleActive={handleToggleActive}
              />
            )}

            {activeTab === "sections" && (
              <OrgItemList
                items={sections.map((sec) => {
                  const parentService = services.find((s) => s.id === sec.service_id);
                  return {
                    id: sec.id,
                    name: sec.name,
                    active: sec.active,
                    sort_order: sec.sort_order,
                    service_id: sec.service_id,
                    subTitle: parentService ? `Service: ${parentService.name}` : undefined,
                  };
                })}
                canEdit={canEdit}
                emptyTitle="Aucune section"
                emptyMessage="Cliquez sur 'Ajouter' pour créer une section rattachée à un service."
                onEdit={(it) => {
                  setEditingItem(it);
                  setIsModalOpen(true);
                }}
                onToggleActive={handleToggleActive}
              />
            )}

            {activeTab === "functions" && (
              <OrgItemList
                items={functions.map((f) => ({
                  id: f.id,
                  name: f.name,
                  active: f.active,
                  sort_order: f.sort_order,
                }))}
                canEdit={canEdit}
                emptyTitle="Aucune fonction"
                emptyMessage="Cliquez sur 'Ajouter' pour créer une fonction / poste."
                onEdit={(it) => {
                  setEditingItem(it);
                  setIsModalOpen(true);
                }}
                onToggleActive={handleToggleActive}
              />
            )}

            {activeTab === "levels" && (
              <OrgItemList
                items={levels.map((l) => ({
                  id: l.id,
                  name: l.name,
                  sort_order: l.sort_order,
                }))}
                canEdit={canEdit}
                emptyTitle="Aucun niveau"
                emptyMessage="Cliquez sur 'Ajouter' pour créer un niveau de qualification."
                onEdit={(it) => {
                  setEditingItem(it);
                  setIsModalOpen(true);
                }}
              />
            )}

            {activeTab === "categories" && (
              <OrgItemList
                items={categories.map((c) => ({
                  id: c.id,
                  name: c.name,
                  active: c.active,
                  sort_order: c.sort_order,
                }))}
                canEdit={canEdit}
                emptyTitle="Aucune catégorie"
                emptyMessage="Cliquez sur 'Ajouter' pour créer une catégorie professionnelle."
                onEdit={(it) => {
                  setEditingItem(it);
                  setIsModalOpen(true);
                }}
                onToggleActive={handleToggleActive}
              />
            )}
          </>
        )}
      </Card>

      {/* Modal for create/edit */}
      <OrganizationItemModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        tab={activeTab}
        item={editingItem}
        services={services}
        onSave={handleSaveItem}
      />
    </div>
  );
}

interface OrgItemListProps {
  items: {
    id: number;
    name: string;
    active?: number;
    sort_order?: number;
    service_id?: number;
    subTitle?: string;
  }[];
  canEdit: boolean;
  emptyTitle: string;
  emptyMessage: string;
  onEdit: (item: OrgItemData) => void;
  onToggleActive?: (item: { id: number; name: string; active?: number }) => void;
}

function OrgItemList({
  items,
  canEdit,
  emptyTitle,
  emptyMessage,
  onEdit,
  onToggleActive,
}: OrgItemListProps) {
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <Building2 size={36} color="var(--neutral-300)" />
        <h4>{emptyTitle}</h4>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={styles.itemList}>
      {items.map((item) => (
        <div key={item.id} className={styles.listItem}>
          <div className={styles.listItemInfo}>
            <span className={styles.itemName}>{item.name}</span>
            {item.subTitle && <span className={styles.itemSub}>{item.subTitle}</span>}
            {item.sort_order !== undefined && item.sort_order > 0 && (
              <span className={styles.sortBadge}>Ordre: {item.sort_order}</span>
            )}
            {item.active !== undefined && (
              <span
                className={`${styles.statusTag} ${
                  item.active ? styles.active : styles.inactive
                }`}
              >
                {item.active ? "Actif" : "Inactif"}
              </span>
            )}
          </div>

          {canEdit && (
            <div className={styles.listItemActions}>
              {onToggleActive && item.active !== undefined && (
                <button
                  className={styles.toggleBtn}
                  onClick={() => onToggleActive(item)}
                  title={item.active ? "Désactiver" : "Activer"}
                >
                  {item.active ? "Désactiver" : "Activer"}
                </button>
              )}
              <button
                className={styles.actionBtn}
                title="Modifier"
                onClick={() => onEdit(item)}
              >
                <Pencil size={16} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
