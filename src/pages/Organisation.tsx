import { useState, useEffect } from "react";
import PageHeader from "@components/ui/PageHeader";
import Card from "@components/ui/Card";
import Button from "@components/ui/Button";
import { select } from "@lib/database";
import { useAuthStore } from "@store/authStore";
import { canModify } from "@lib/permissions";
import type { Service, Section, Function as FunctionType, Level, ProfessionalCategory } from "@app-types/index";
import { Building2, Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import styles from "./Organisation.module.css";

type Tab = "services" | "sections" | "functions" | "levels" | "categories";

export default function Organisation() {
  const role = useAuthStore((s) => s.role);
  const canEdit = canModify(role, "administration");
  const [activeTab, setActiveTab] = useState<Tab>("services");
  const [services, setServices] = useState<Service[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [functions, setFunctions] = useState<FunctionType[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [categories, setCategories] = useState<ProfessionalCategory[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setServices(await select<Service>("SELECT * FROM services ORDER BY sort_order"));
      setSections(await select<Section>("SELECT * FROM sections ORDER BY sort_order"));
      setFunctions(await select<FunctionType>("SELECT * FROM functions ORDER BY sort_order"));
      setLevels(await select<Level>("SELECT * FROM levels ORDER BY sort_order"));
      setCategories(await select<ProfessionalCategory>("SELECT * FROM professional_categories ORDER BY sort_order"));
    } catch {
      // Tables might not be initialized
    }
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
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
        subtitle="Services, sections, fonctions, niveaux et catégories"
        actions={
          canEdit && (
            <Button>
              <Plus size={18} />
              Ajouter
            </Button>
          )
        }
      />

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
        {activeTab === "services" && (
          <ItemList
            items={services.map((s) => ({ id: s.id, name: s.name, active: s.active }))}
            canEdit={canEdit}
            emptyTitle="Aucun service"
            emptyMessage="Les services par défaut seront créés lors de l'initialisation."
          />
        )}
        {activeTab === "sections" && (
          <div>
            {sections.length === 0 ? (
              <div className={styles.empty}>
                <Building2 size={36} color="var(--neutral-300)" />
                <p>Aucune section définie</p>
              </div>
            ) : (
              <div className={styles.sectionList}>
                {sections.map((sec) => {
                  const svc = services.find((s) => s.id === sec.service_id);
                  return (
                    <div key={sec.id} className={styles.sectionItem}>
                      <ChevronRight size={16} color="var(--neutral-400)" />
                      <div>
                        <span className={styles.itemName}>{sec.name}</span>
                        <span className={styles.itemSub}>{svc?.name || "—"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {activeTab === "functions" && (
          <ItemList
            items={functions.map((f) => ({ id: f.id, name: f.name, active: f.active }))}
            canEdit={canEdit}
            emptyTitle="Aucune fonction"
            emptyMessage="Ajoutez des fonctions pour les assigner aux employés."
          />
        )}
        {activeTab === "levels" && (
          <ItemList
            items={levels.map((l) => ({ id: l.id, name: l.name, active: 1 }))}
            canEdit={canEdit}
            emptyTitle="Aucun niveau"
            emptyMessage="Les niveaux (NIV 1, NIV 2, NIV 3) sont optionnels."
          />
        )}
        {activeTab === "categories" && (
          <ItemList
            items={categories.map((c) => ({ id: c.id, name: c.name, active: c.active }))}
            canEdit={canEdit}
            emptyTitle="Aucune catégorie"
            emptyMessage="Les catégories professionnelles seront créées par défaut."
          />
        )}
      </Card>
    </div>
  );
}

interface ItemListProps {
  items: { id: number; name: string; active: number }[];
  canEdit: boolean;
  emptyTitle: string;
  emptyMessage: string;
}

function ItemList({ items, canEdit, emptyTitle, emptyMessage }: ItemListProps) {
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
            <span className={` ${styles.statusTag} ${item.active ? styles.active : styles.inactive}`}>
              {item.active ? "Actif" : "Inactif"}
            </span>
          </div>
          {canEdit && (
            <div className={styles.listItemActions}>
              <button className={styles.actionBtn} title="Modifier">
                <Pencil size={16} />
              </button>
              <button className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Supprimer">
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
