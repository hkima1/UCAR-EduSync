export type AppNotification = {
  id: string;
  type: "alert" | "task" | "message" | "report";
  priority: "info" | "warning" | "critical";
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  role?: string;
};

export const seedNotifications: AppNotification[] = [
  { id: "n1", type: "alert", priority: "warning", title: "Présence faible — Réseaux", body: "Votre taux d'absence dépasse 25% sur ce cours.", timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), read: false },
  { id: "n2", type: "task", priority: "info", title: "Formulaire de feedback à compléter", body: "Évaluation du semestre — algorithmique avancée.", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), read: false },
  { id: "n3", type: "report", priority: "info", title: "Relevé de notes prêt", body: "Votre relevé du semestre 5 est disponible au téléchargement.", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), read: true },
  { id: "n4", type: "message", priority: "info", title: "Message du Pr. Ben Younès", body: "Rappel : remise du projet algorithmique vendredi.", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(), read: true },
  { id: "n5", type: "alert", priority: "critical", title: "Échéance bourse Erasmus+", body: "Plus que 7 jours pour soumettre le dossier.", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), read: false },
];
