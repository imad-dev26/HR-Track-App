import { useState, useEffect } from "react";
import PageHeader from "@components/ui/PageHeader";
import Card from "@components/ui/Card";
import Button from "@components/ui/Button";
import { select, execute } from "@lib/database";
import { useAuthStore } from "@store/authStore";
import { isAdmin } from "@lib/permissions";
import type { CompanyInfo, AppSetting } from "@app-types/index";
import { Building, Settings, FileText, CalendarDays, Save, Upload, Users as UsersIcon } from "lucide-react";
import styles from "./Administration.module.css";

type AdminTab = "company" | "services" | "sections" | "functions" | "leave_types" | "contract_types" | "settings";

export default function Administration() {
  const role = useAuthStore((s) => s.role);
  const adminOnly = isAdmin(role);
  const [activeTab, setActiveTab] = useState<AdminTab>("company");
  const [company, setCompany] = useState<Partial<CompanyInfo>>({});
  const [settings, setSettings] = useState<AppSetting[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const companyRows = await select<>(
        "SELECT * FROM company_info WHERE id = 1");
      if (companyRows.length > 0) setCompany(companyRows[0]);
      setSettings(await select<>(
        "SELECT * FROM app_settings ORDER BY category, key"));
    } catch {
      // Tables might not exist
    }
  }

  async function handleSaveCompany() {
    try {
      await run(
        `UPDATE company_info SET name = ?, address = ?, phone = ?, email = ?, website = ?, fiscal_id = ?, legal_form = ?, updated_at = datetime('now') WHERE id = 1`,
        [company.name, company.address, company.phone, company.email, company.website, company.fiscal_id, company.legal_form]
      );
    } catch (err) {
      console.error("Save company error:", err);
    }
  }

  const tabs: { key: AdminTab; label: string; icon: typeof Building }[] = [
    { key: "company", label: "Entreprise", icon: Building },
    { key: "services", label: "Services", icon: Building },
    { key: "sections", label: "Sections", icon: Building },
    { key: "functions", label: "Fonctions", icon: UsersIcon },
    { key: "leave_types", label: "Types de congés", icon: CalendarDays },
    { key: "contract_types", label: "Types de contrats", icon: FileText },
    { key: "settings", label: "Paramètres", icon: Settings },
  ];

  if (!adminOnly) {
    return (
      <div className={styles.container}>
        <PageHeader title="Administration" subtitle="Configuration de l'application" />
        <Card>
          <div className={styles.restricted}>
            <p>Accès réservé aux administrateurs.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Administration"
        subtitle="Configuration de l'application et des paramètres"
      />

      <div className={styles.tabs}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "company" && (
        <Card title="Informations de l'entreprise">
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.label}>Nom de l'entreprise</label>
              <input
                type="text"
                value={company.name || ""}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                placeholder="Nom de l'entreprise"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Forme juridique</label>
              <input
                type="text"
                value={company.legal_form || ""}
                onChange={(e) => setCompany({ ...company, legal_form: e.target.value })}
                placeholder="SARL, EURL, SPA..."
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Adresse</label>
              <input
                type="text"
                value={company.address || ""}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
                placeholder="Adresse"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Téléphone</label>
              <input
                type="text"
                value={company.phone || ""}
                onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                placeholder="Téléphone"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                value={company.email || ""}
                onChange={(e) => setCompany({ ...company, email: e.target.value })}
                placeholder="Email"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Site web</label>
              <input
                type="text"
                value={company.website || ""}
                onChange={(e) => setCompany({ ...company, website: e.target.value })}
                placeholder="Site web"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Identifiant fiscal</label>
              <input
                type="text"
                value={company.fiscal_id || ""}
                onChange={(e) => setCompany({ ...company, fiscal_id: e.target.value })}
                placeholder="NIF / RC"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Logo</label>
              <div className={styles.logoUpload}>
                <Button variant="secondary" size="sm">
                  <Upload size={16} />
                  Choisir un logo
                </Button>
                <span className={styles.logoHint}>PNG ou JPG, max 2MB</span>
              </div>
            </div>
          </div>
          <div className={styles.formActions}>
            <Button onClick={handleSaveCompany}>
              <Save size={18} />
              Enregistrer
            </Button>
          </div>
        </Card>
      )}

      {activeTab === "services" && (
        <Card title="Services">
          <div className={styles.configList}>
            <p className={styles.configHint}>
              Les services sont les départements principaux de l'organisation.
              Un service peut contenir plusieurs sections.
            </p>
          </div>
        </Card>
      )}

      {activeTab === "sections" && (
        <Card title="Sections">
          <div className={styles.configList}>
            <p className={styles.configHint}>
              Les sections sont des sous-ensembles d'un service. Chaque section est rattachée à un service.
            </p>
          </div>
        </Card>
      )}

      {activeTab === "functions" && (
        <Card title="Fonctions">
          <div className={styles.configList}>
            <p className={styles.configHint}>
              Les fonctions (postes) peuvent être associées à plusieurs services.
              Les niveaux (NIV 1, NIV 2, NIV 3) sont optionnels.
            </p>
          </div>
        </Card>
      )}

      {activeTab === "leave_types" && (
        <Card title="Types de congés">
          <div className={styles.configList}>
            <p className={styles.configHint}>
              Les types de congés sont configurables. Les types par défaut incluent:
              Congé annuel, Récupération, Maladie, Sans solde, Exceptionnel, Maternité, etc.
            </p>
          </div>
        </Card>
      )}

      {activeTab === "contract_types" && (
        <Card title="Types de contrats">
          <div className={styles.configList}>
            <p className={styles.configHint}>
              Les types de contrats sont configurables (CDI, CDD par défaut).
              Règle spéciale: Sûreté Interne accepte uniquement les contrats CDD.
            </p>
          </div>
        </Card>
      )}

      {activeTab === "settings" && (
        <Card title="Paramètres de l'application">
          <div className={styles.settingsList}>
            {settings.map((s) => (
              <div key={s.id} className={styles.settingRow}>
                <div className={styles.settingInfo}>
                  <span className={styles.settingKey}>{s.key}</span>
                  <span className={styles.settingDesc}>{s.description}</span>
                </div>
                <span className={styles.settingCategory}>{s.category}</span>
                <span className={styles.settingValue}>{s.value || "—"}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
