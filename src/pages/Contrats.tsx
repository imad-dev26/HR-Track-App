import { useState, useEffect, useCallback } from "react";
import PageHeader from "@components/ui/PageHeader";
import Card from "@components/ui/Card";
import Button from "@components/ui/Button";
import EmptyState from "@components/ui/EmptyState";
import { select, execute, executeTransaction } from "@lib/database";
import { useAuthStore } from "@store/authStore";
import { canModify } from "@lib/permissions";
import type {
  Contract,
  ContractFormData,
  ContractType,
  Employee,
} from "@app-types/index";
import { FileText, FilePlus, Search, Pencil, RefreshCw, CheckCircle2, X } from "lucide-react";
import ContractModal from "@components/contracts/ContractModal";
import styles from "./Contrats.module.css";

export default function Contrats() {
  const role = useAuthStore((s) => s.role);
  const canEdit = canModify(role, "contrats");

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [renewEmployeeId, setRenewEmployeeId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [typesRows, contractRows, empRows] = await Promise.all([
        select<ContractType>(
          "SELECT * FROM contract_types WHERE active = 1 ORDER BY sort_order ASC"
        ),
        select<Contract>(
          `SELECT c.*, e.nom as employee_nom, e.prenom as employee_prenom, e.matricule as employee_matricule, ct.name as type_name
           FROM contracts c
           LEFT JOIN employees e ON c.employee_id = e.id
           LEFT JOIN contract_types ct ON c.contract_type_id = ct.id
           ORDER BY c.is_current DESC, c.start_date DESC`
        ),
        select<Employee>(
          "SELECT * FROM employees ORDER BY nom ASC, prenom ASC"
        ),
      ]);

      setContractTypes(typesRows || []);
      setContracts(contractRows || []);
      setEmployees(empRows || []);
    } catch (err) {
      console.error("Error loading contracts data:", err);
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

  async function handleSaveContract(data: ContractFormData, contractId?: number) {
    const emp = employees.find((e) => e.id === Number(data.employee_id));
    const type = contractTypes.find((t) => t.id === Number(data.contract_type_id));
    const empLabel = emp ? `${emp.nom} ${emp.prenom}` : "Employé";

    if (contractId) {
      // Updating an existing contract
      if (data.is_current === 1) {
        await executeTransaction([
          {
            query: `UPDATE contracts SET is_current = 0, updated_at = datetime('now') WHERE employee_id = ? AND id != ?`,
            bindValues: [data.employee_id, contractId],
          },
          {
            query: `UPDATE contracts SET
              contract_type_id = ?, start_date = ?, end_date = ?, is_current = ?, notes = ?, updated_at = datetime('now')
            WHERE id = ?`,
            bindValues: [
              data.contract_type_id,
              data.start_date,
              data.end_date || null,
              data.is_current,
              data.notes || null,
              contractId,
            ],
          },
        ]);
      } else {
        await execute(
          `UPDATE contracts SET
            contract_type_id = ?, start_date = ?, end_date = ?, is_current = ?, notes = ?, updated_at = datetime('now')
          WHERE id = ?`,
          [
            data.contract_type_id,
            data.start_date,
            data.end_date || null,
            data.is_current,
            data.notes || null,
            contractId,
          ]
        );
      }

      showToast(`Contrat de "${empLabel}" mis à jour.`);
    } else {
      // Creating a new contract or renewal
      if (data.is_current === 1) {
        await executeTransaction([
          {
            query: `UPDATE contracts SET is_current = 0, updated_at = datetime('now') WHERE employee_id = ?`,
            bindValues: [data.employee_id],
          },
          {
            query: `INSERT INTO contracts (
              employee_id, contract_type_id, start_date, end_date, is_current, notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            bindValues: [
              data.employee_id,
              data.contract_type_id,
              data.start_date,
              data.end_date || null,
              data.is_current,
              data.notes || null,
            ],
          },
        ]);
      } else {
        await execute(
          `INSERT INTO contracts (
            employee_id, contract_type_id, start_date, end_date, is_current, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [
            data.employee_id,
            data.contract_type_id,
            data.start_date,
            data.end_date || null,
            data.is_current,
            data.notes || null,
          ]
        );
      }

      showToast(
        renewEmployeeId
          ? `Contrat ${type?.name || ""} renouvelé pour "${empLabel}".`
          : `Nouveau contrat ${type?.name || ""} enregistré pour "${empLabel}".`
      );
    }

    await loadData();
  }

  function getTypeBadgeClass(typeName?: string | null): string {
    if (!typeName) return styles.typeOther;
    const upper = typeName.toUpperCase();
    if (upper === "CDI") return styles.typeCDI;
    if (upper === "CDD") return styles.typeCDD;
    return styles.typeOther;
  }

  // Filtered contracts
  const filtered = contracts.filter((c) => {
    const q = search.toLowerCase().trim();
    const matchesQuery =
      !q ||
      (c.employee_nom && c.employee_nom.toLowerCase().includes(q)) ||
      (c.employee_prenom && c.employee_prenom.toLowerCase().includes(q)) ||
      (c.employee_matricule && c.employee_matricule.toLowerCase().includes(q)) ||
      (c.notes && c.notes.toLowerCase().includes(q));

    const matchesType =
      typeFilter === "all" || String(c.contract_type_id) === typeFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "current" && c.is_current === 1) ||
      (statusFilter === "past" && c.is_current === 0);

    return matchesQuery && matchesType && matchesStatus;
  });

  return (
    <div className={styles.container}>
      <PageHeader
        title="Contrats"
        subtitle="Gestion, suivi et historique des contrats de travail"
        actions={
          canEdit && (
            <Button
              onClick={() => {
                setEditingContract(null);
                setRenewEmployeeId(null);
                setIsModalOpen(true);
              }}
            >
              <FilePlus size={18} />
              Nouveau contrat
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

      <div className={styles.toolbar}>
        <div className={styles.searchAndFilters}>
          <div className={styles.search}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Rechercher par employé, matricule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Tous les types</option>
            {contractTypes.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Tous les statuts</option>
            <option value="current">En cours</option>
            <option value="past">Archivé / Terminé</option>
          </select>
        </div>

        <span className={styles.count}>
          {filtered.length} contrat(s) trouvé(s)
        </span>
      </div>

      <Card>
        {loading ? (
          <div className={styles.loading}>Chargement des contrats...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucun contrat trouvé"
            message={
              search || typeFilter !== "all" || statusFilter !== "all"
                ? "Aucun contrat ne correspond aux critères sélectionnés."
                : "Aucun contrat n'a été enregistré. Cliquez sur 'Nouveau contrat' pour commencer."
            }
          />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Matricule</th>
                  <th>Employé</th>
                  <th>Type</th>
                  <th>Date début</th>
                  <th>Date fin</th>
                  <th>Statut</th>
                  <th>Notes</th>
                  {canEdit && <th className={styles.actionsCol}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className={styles.row}>
                    <td className={styles.employeeMatricule}>
                      {c.employee_matricule || "—"}
                    </td>
                    <td>
                      <span className={styles.employeeName}>
                        {c.employee_nom || "—"} {c.employee_prenom || ""}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.typeBadge} ${getTypeBadgeClass(
                          c.type_name
                        )}`}
                      >
                        {c.type_name || "—"}
                      </span>
                    </td>
                    <td>{c.start_date}</td>
                    <td>{c.end_date || "Indéterminée"}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          c.is_current ? styles.badgeActive : styles.badgePast
                        }`}
                      >
                        {c.is_current ? "En cours" : "Archivé"}
                      </span>
                    </td>
                    <td>{c.notes || "—"}</td>
                    {canEdit && (
                      <td className={styles.actionsCell}>
                        <button
                          className={styles.actionBtn}
                          title="Modifier le contrat"
                          onClick={() => {
                            setEditingContract(c);
                            setRenewEmployeeId(null);
                            setIsModalOpen(true);
                          }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.renewBtn}`}
                          title="Renouveler ce contrat"
                          onClick={() => {
                            setEditingContract(c);
                            setRenewEmployeeId(c.employee_id);
                            setIsModalOpen(true);
                          }}
                        >
                          <RefreshCw size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: Create / Edit / Renew Contract */}
      <ContractModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingContract(null);
          setRenewEmployeeId(null);
        }}
        contract={editingContract}
        renewEmployeeId={renewEmployeeId}
        employees={employees}
        contractTypes={contractTypes}
        onSave={handleSaveContract}
      />
    </div>
  );
}
