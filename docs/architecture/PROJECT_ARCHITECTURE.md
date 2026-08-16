# HR Track --- Project Architecture

## Project Overview

HR Track is an offline Human Resources management desktop application.

Objectives: - Manage employee dossiers - Track contracts and history -
Manage leaves and balances - Provide HR statistics and reports -
Maintain historical records

No cloud database, no internet dependency, no Supabase.

## Technical Architecture

Stack: - Tauri desktop application - React + TypeScript frontend -
SQLite local database - Excel import/export - PDF reporting

SQLite is the main database. Excel is only used for import/export.

## Employee Identity

Main identifier: - Matricule

Technical identifier: - Internal ID

All employee history remains attached to the same employee record.

Tracked history: - Contracts - Career changes - Service changes -
Leaves - Medical status - Discipline - Training - Accidents

## Employee Information

Mandatory: - Matricule - Nom - Prénom - Date de naissance - National
ID - Sécurité sociale

Optional: - Lieu de naissance - Téléphone - Adresse - Compte bancaire -
Situation familiale - Nombre d'enfants

## Organization

Structure:

Service → Section

Services: - Administration - Maintenance - Exploitation - Transport -
Sécurité Industrielle - Sûreté Interne

Rules: - Functions can belong to multiple services. - Levels NIV 1, NIV
2, NIV 3 are optional. - Categories: - Exécution - Maîtrise - Cadre -
Cadre supérieur

## Contracts

Default: - CDI - CDD

Contract types are configurable.

Contract history is preserved.

Special rule: Sûreté Interne accepts only CDD.

## Permissions

Admin: - Full access - Configuration - Import/export - Medical details

Guest: - View allowed information - Use permitted dashboard widgets - No
modification - No restricted export - No medical details

## Main Modules

-   Employee dossier
-   Contracts
-   Services and Sections
-   Functions and Levels
-   Career history
-   Service mobility history
-   Leaves
-   Annual leave exercises
-   Recovery balance
-   Attendance exceptions
-   Medical restrictions
-   Discipline
-   Training
-   Work accidents
-   Dashboard
-   Reports
-   Notifications
-   Administration

## Development Principles

-   French interface
-   Offline first
-   Modular clean code
-   No hard-coded company rules
-   Preserve HR history
-   Separate calculation logic from UI
