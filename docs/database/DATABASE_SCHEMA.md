# HR Track --- Database Schema v1.0

## Database Engine

SQLite is the main database.

Excel is only used for: - Initial import - Data exchange - Export

All HR changes must be stored in SQLite.

------------------------------------------------------------------------

# Core Tables

## employees

Main employee record.

Fields: - id (internal technical ID) - matricule (main HR identifier) -
nom - prenom - date_naissance - lieu_naissance - national_id -
securite_sociale - telephone - adresse - compte_bancaire -
situation_familiale - nombre_enfants - category_id - current_status_id -
created_at

------------------------------------------------------------------------

## employee_status_types

Configurable employee statuses.

Default: - Actif - Déclassé médical temporaire - Déclassé médical
définitif - Retraité - Muté - Affecté - Détaché - Démission - Licencié -
Fin CDD

------------------------------------------------------------------------

## employee_status_history

Stores every status change.

Fields: - id - employee_id - old_status - new_status - date_change -
reason - created_by

------------------------------------------------------------------------

# Organization

## services

Examples: - Administration - Maintenance - Exploitation - Transport -
Sécurité Industrielle - Sûreté Interne

Fields: - id - name - active

------------------------------------------------------------------------

## sections

Fields: - id - service_id - name

Relationship:

Service → Many Sections

------------------------------------------------------------------------

## functions

Fields: - id - name - active

------------------------------------------------------------------------

## function_services

Allows one function to exist in multiple services.

Fields: - function_id - service_id

------------------------------------------------------------------------

## levels

Default: - NIV 1 - NIV 2 - NIV 3

Fields: - id - name

Levels are optional.

------------------------------------------------------------------------

## professional_categories

Default: - Exécution - Maîtrise - Cadre - Cadre supérieur

Fields: - id - name - active

------------------------------------------------------------------------

# Contracts

## contract_types

Configurable.

Default: - CDI - CDD

Fields: - id - name - active

------------------------------------------------------------------------

## contracts

Keeps contract history.

Fields: - id - employee_id - contract_type_id - start_date - end_date -
is_current - notes

Rule: Sûreté Interne accepts only CDD contracts.

------------------------------------------------------------------------

# Employee History

## service_history

Tracks Service and Section changes.

Fields: - id - employee_id - old_service - old_section - new_service -
new_section - movement_date - reason

------------------------------------------------------------------------

## career_history

Tracks: - Function changes - Level changes - Category changes

Fields: - id - employee_id - old_function - old_level - old_category -
new_function - new_level - new_category - date_change - reason

------------------------------------------------------------------------

# Leave Management

## leave_types

Configurable leave types.

Examples: - Congé annuel - Congé récupération - Maladie - Sans solde -
Exceptionnel - Maternité - Accident travail - Formation - Mission -
Mutation - Détachement - Mise à pied

------------------------------------------------------------------------

## leave_exercises

Annual leave periods.

Example: CA EX26/27

Fields: - id - name - start_date - end_date

------------------------------------------------------------------------

## leaves

Fields: - id - employee_id - leave_type_id - exercise_id - start_date -
end_date - number_days - status - observation

Statuses: - Validé - Annulé - Nécessité de Service

------------------------------------------------------------------------

# Recovery Balance

## recovery_balance

Current DAC/Reliquat balance.

Fields: - id - employee_id - balance

------------------------------------------------------------------------

## recovery_history

Tracks additions and consumption.

Fields: - id - employee_id - operation_type - amount - reason - date

Examples: - Added RC/JF - Consumed DPC

------------------------------------------------------------------------

# Medical Module

## medical_records

Fields: - id - employee_id - restriction_type - decision - type
(temporary/permanent) - start_date - duration_months - end_date - status

Guest users cannot see details.

------------------------------------------------------------------------

# Discipline

## disciplinary_actions

Fields: - id - employee_id - action_type - date - description -
duration_days

Includes: - Avertissement - Blâme - Mise à pied

------------------------------------------------------------------------

# Training

## training_records

Fields: - id - employee_id - mission_order_number - subject - location -
start_date - end_date

------------------------------------------------------------------------

# Work Accidents

## accidents

Mandatory: - employee_id - accident_date - stop_start - stop_end

Optional: - location - type - cause - injury - investigation

------------------------------------------------------------------------

# Attendance

## attendance_exceptions

Only exceptions are recorded.

Fields: - id - employee_id - date - status - reason - observation

Default: Employees are considered Present.

------------------------------------------------------------------------

# System Tables

## users

Fields: - id - username - password_hash - role

Roles: - Admin - Guest

------------------------------------------------------------------------

## audit_log

Tracks changes.

Fields: - id - user_id - action - table_name - old_value - new_value -
date

------------------------------------------------------------------------

## notifications

Fields: - id - employee_id - type - message - date - read_status

------------------------------------------------------------------------

# Design Rules

-   Never delete important HR history.
-   Keep all movements traceable.
-   Use internal IDs for relations.
-   Use Matricule for HR searches.
-   Keep company rules configurable.
