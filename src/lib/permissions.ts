import type { UserRole } from "@app-types/index";

export interface Permission {
  module: string;
  action: "view" | "view_details" | "create" | "edit" | "delete" | "export";
  label: string;
}

export const PERMISSIONS: Permission[] = [
  { module: "personnel", action: "view", label: "Consulter le personnel" },
  { module: "personnel", action: "create", label: "Ajouter du personnel" },
  { module: "personnel", action: "edit", label: "Modifier le personnel" },
  { module: "personnel", action: "delete", label: "Supprimer du personnel" },
  { module: "personnel", action: "export", label: "Exporter le personnel" },
  { module: "organisation", action: "view", label: "Consulter l'organisation" },
  { module: "organisation", action: "create", label: "Créer des éléments d'organisation" },
  { module: "organisation", action: "edit", label: "Modifier l'organisation" },
  { module: "contrats", action: "view", label: "Consulter les contrats" },
  { module: "contrats", action: "create", label: "Créer des contrats" },
  { module: "contrats", action: "edit", label: "Modifier les contrats" },
  { module: "conges", action: "view", label: "Consulter les congés" },
  { module: "conges", action: "create", label: "Créer des congés" },
  { module: "conges", action: "edit", label: "Modifier les congés" },
  { module: "medical", action: "view", label: "Consulter le module médical" },
  { module: "medical", action: "view_details", label: "Consulter les détails médicaux" },
  { module: "medical", action: "create", label: "Créer des dossiers médicaux" },
  { module: "medical", action: "edit", label: "Modifier les dossiers médicaux" },
  { module: "discipline", action: "view", label: "Consulter la discipline" },
  { module: "discipline", action: "create", label: "Créer des sanctions" },
  { module: "formation", action: "view", label: "Consulter les formations" },
  { module: "formation", action: "create", label: "Créer des formations" },
  { module: "accidents", action: "view", label: "Consulter les accidents" },
  { module: "accidents", action: "create", label: "Enregistrer des accidents" },
  { module: "rapports", action: "view", label: "Consulter les rapports" },
  { module: "rapports", action: "export", label: "Exporter les rapports" },
  { module: "administration", action: "view", label: "Consulter l'administration" },
  { module: "administration", action: "edit", label: "Modifier l'administration" },
];

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  Admin: [
    "personnel:view", "personnel:create", "personnel:edit", "personnel:delete", "personnel:export",
    "organisation:view", "organisation:create", "organisation:edit",
    "contrats:view", "contrats:create", "contrats:edit",
    "conges:view", "conges:create", "conges:edit",
    "medical:view", "medical:view_details", "medical:create", "medical:edit",
    "discipline:view", "discipline:create",
    "formation:view", "formation:create",
    "accidents:view", "accidents:create",
    "rapports:view", "rapports:export",
    "administration:view", "administration:edit",
  ],
  Guest: [
    "personnel:view",
    "organisation:view",
    "contrats:view",
    "conges:view",
    "medical:view",
    "discipline:view",
    "formation:view",
    "accidents:view",
    "rapports:view",
  ],
};

export function hasPermission(role: UserRole, module: string, action: string): boolean {
  const key = `${module}:${action}`;
  return ROLE_PERMISSIONS[role]?.includes(key) ?? false;
}

export function canViewMedicalDetails(role: UserRole): boolean {
  return role === "Admin";
}

export function canModify(role: UserRole, module: string): boolean {
  return hasPermission(role, module, "create") || hasPermission(role, module, "edit");
}

export function canExport(role: UserRole, module: string): boolean {
  return hasPermission(role, module, "export");
}

export function isAdmin(role: UserRole): boolean {
  return role === "Admin";
}
