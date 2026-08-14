import PageHeader from "@components/ui/PageHeader";
import Card from "@components/ui/Card";
import { ChartBar as BarChart3, ChartBar as FileBarChart, Users, CalendarDays, HeartPulse, TriangleAlert as AlertTriangle, FileText } from "lucide-react";
import { useAuthStore } from "@store/authStore";
import { canExport } from "@lib/permissions";
import Button from "@components/ui/Button";
import styles from "./Rapports.module.css";

export default function Rapports() {
  const role = useAuthStore((s) => s.role);
  const canExportData = canExport(role, "rapports");

  const reports = [
    { title: "Effectif par service", description: "Répartition des employés par service et section", icon: Users },
    { title: "État des congés", description: "Synthèse des congés par exercice et par type", icon: CalendarDays },
    { title: "Suivi médical", description: "Restrictions médicales actives et historiques", icon: HeartPulse },
    { title: "Accidents du travail", description: "Accidents avec arrêts et statistiques", icon: AlertTriangle },
    { title: "Contrats", description: "Contrats en cours et échéances", icon: FileText },
    { title: "Statistiques globales", description: "Vue d'ensemble de l'ensemble du personnel", icon: FileBarChart },
  ];

  return (
    <div className={styles.container}>
      <PageHeader
        title="Rapports"
        subtitle="Génération de rapports et statistiques RH"
        actions={
          canExportData && (
            <Button variant="secondary">
              <BarChart3 size={18} />
              Exporter
            </Button>
          )
        }
      />

      <div className={styles.grid}>
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.title}>
              <div className={styles.reportCard}>
                <div className={styles.reportIcon}>
                  <Icon size={24} />
                </div>
                <h3 className={styles.reportTitle}>{report.title}</h3>
                <p className={styles.reportDesc}>{report.description}</p>
                <button className={styles.reportBtn} disabled>
                  Générer
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
