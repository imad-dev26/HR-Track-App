// Core domain types for HR Track

export type UserRole = "Admin" | "Guest";

export interface User {
  id: number;
  username: string;
  role: UserRole;
  display_name: string | null;
}

export interface Employee {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  date_naissance: string | null;
  lieu_naissance: string | null;
  national_id: string | null;
  securite_sociale: string | null;
  telephone: string | null;
  adresse: string | null;
  compte_bancaire: string | null;
  situation_familiale: string | null;
  nombre_enfants: number;
  category_id: number | null;
  current_status_id: number | null;
  status_name?: string | null;
  category_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeFormData {
  matricule: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  national_id: string;
  securite_sociale: string;
  telephone: string;
  adresse: string;
  compte_bancaire: string;
  situation_familiale: string;
  nombre_enfants: number;
  category_id: number | null;
  current_status_id: number | null;
}

export interface EmployeeStatusHistory {
  id: number;
  employee_id: number;
  old_status: string | null;
  new_status: string;
  date_change: string;
  reason: string | null;
  created_by: number | null;
  created_at: string;
}

export interface EmployeeStatusType {
  id: number;
  name: string;
  active: number;
  sort_order: number;
}

export interface Service {
  id: number;
  name: string;
  active: number;
  sort_order: number;
}

export interface Section {
  id: number;
  service_id: number;
  name: string;
  active: number;
  sort_order: number;
}

export interface Function {
  id: number;
  name: string;
  active: number;
  sort_order: number;
}

export interface Level {
  id: number;
  name: string;
  sort_order: number;
}

export interface ProfessionalCategory {
  id: number;
  name: string;
  active: number;
  sort_order: number;
}

export interface ContractType {
  id: number;
  name: string;
  active: number;
  sort_order: number;
}

export interface Contract {
  id: number;
  employee_id: number;
  contract_type_id: number;
  start_date: string;
  end_date: string | null;
  is_current: number;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  employee_nom?: string | null;
  employee_prenom?: string | null;
  employee_matricule?: string | null;
  type_name?: string | null;
}

export interface ContractFormData {
  employee_id: number | "";
  contract_type_id: number | "";
  start_date: string;
  end_date: string;
  is_current: number;
  notes: string;
}

export interface LeaveType {
  id: number;
  name: string;
  active: number;
  sort_order: number;
}

export interface LeaveExercise {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
}

export interface Leave {
  id: number;
  employee_id: number;
  leave_type_id: number;
  exercise_id: number | null;
  start_date: string;
  end_date: string;
  number_days: number;
  status: string;
  observation: string | null;
  created_at?: string;
  updated_at?: string;
  employee_nom?: string | null;
  employee_prenom?: string | null;
  employee_matricule?: string | null;
  type_name?: string | null;
  exercise_name?: string | null;
}

export interface LeaveFormData {
  employee_id: number | "";
  leave_type_id: number | "";
  exercise_id: number | "" | null;
  start_date: string;
  end_date: string;
  number_days: number;
  status: string;
  observation: string;
}

export interface LeaveExerciseFormData {
  name: string;
  start_date: string;
  end_date: string;
}

export interface RecoveryBalance {
  id: number;
  employee_id: number;
  balance: number;
  updated_at: string;
  employee_nom?: string | null;
  employee_prenom?: string | null;
  employee_matricule?: string | null;
}

export interface RecoveryHistory {
  id: number;
  employee_id: number;
  operation_type: string;
  amount: number;
  reason: string | null;
  date: string;
  created_at: string;
}

export interface MedicalRecord {
  id: number;
  employee_id: number;
  restriction_type: string | null;
  decision: string | null;
  type: "temporary" | "permanent";
  start_date: string;
  duration_months: number | null;
  end_date: string | null;
  status: string;
}

export interface DisciplinaryAction {
  id: number;
  employee_id: number;
  action_type: string;
  date: string;
  description: string | null;
  duration_days: number | null;
}

export interface TrainingRecord {
  id: number;
  employee_id: number;
  mission_order_number: string | null;
  subject: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
}

export interface Accident {
  id: number;
  employee_id: number;
  accident_date: string;
  stop_start: string | null;
  stop_end: string | null;
  location: string | null;
  type: string | null;
  cause: string | null;
  injury: string | null;
  investigation: string | null;
}

export interface AttendanceException {
  id: number;
  employee_id: number;
  date: string;
  status: string;
  reason: string | null;
  observation: string | null;
}

export interface CompanyInfo {
  id: number;
  name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_path: string | null;
  fiscal_id: string | null;
  legal_form: string | null;
}

export interface AppSetting {
  id: number;
  key: string;
  value: string | null;
  category: string;
  description: string | null;
}

export interface Notification {
  id: number;
  employee_id: number | null;
  type: string;
  message: string;
  date: string;
  read_status: number;
}

export interface AuditLogEntry {
  id: number;
  user_id: number | null;
  action: string;
  table_name: string;
  record_id: number | null;
  old_value: string | null;
  new_value: string | null;
  date: string;
}

export interface DatabaseResult {
  lastInsertId?: number;
  rowsAffected?: number;
}
