const fs = require('fs');
const path = require('path');

const routes = [
  { path: '/teacher/reports', eyebrow: 'Enseignant', title: 'Rapports Pédagogiques', features: ['Génération de bulletins', 'Statistiques de classe'] },
  { path: '/director/staff', eyebrow: 'Directeur', title: 'Gestion du Personnel', features: ['Corps enseignant', 'Personnels administratifs'] },
  { path: '/director/meetings', eyebrow: 'Directeur', title: 'Réunions & Conseils', features: ['Conseil scientifique', 'Conseil de discipline'] },
  { path: '/director/financial', eyebrow: 'Directeur', title: 'Gestion Financière', features: ["Budget de l'établissement", 'Bons de commande'] },
  { path: '/director/alerts', eyebrow: 'Directeur', title: "Centre d'alertes", features: ['Urgences', 'Anomalies de fréquentation', 'Dépassement de seuils'] },
  { path: '/director/reports', eyebrow: 'Directeur', title: "Rapports d'activité", features: ['Bilan annuel', 'Rapports ministère'] },
  { path: '/superadmin/coordination', eyebrow: 'Super Admin', title: 'Coordination', features: ['Directives ministérielles', 'Circulaires', 'Comités'] },
  { path: '/superadmin/offers', eyebrow: 'Super Admin', title: 'Offres & Appels', features: ["Appels d'offres publics", 'Marchés', 'Bourses nationales'] },
  { path: '/superadmin/academic', eyebrow: 'Super Admin', title: 'Suivi Académique National', features: ['Réussite globale', 'Réformes LMD', 'Accréditations'] },
  { path: '/superadmin/strategic', eyebrow: 'Super Admin', title: 'Stratégie & Prospective', features: ['Plan 2030', 'Cartographie des filières', 'Insertion pro.'] },
  { path: '/superadmin/financial', eyebrow: 'Super Admin', title: 'Finance Globale', features: ['Budget consolidé', 'Transferts', 'Audit'] },
  { path: '/superadmin/demands', eyebrow: 'Super Admin', title: 'Demandes & Requêtes', features: ['Recours', 'Plaintes', 'Requêtes inter-universitaires'] },
  { path: '/superadmin/users', eyebrow: 'Super Admin', title: 'Gestion des Utilisateurs', features: ['Annuaire central', 'Rôles & Permissions', 'Sécurité'] },
  { path: '/admin/messages', eyebrow: 'Admin. Établissement', title: 'Messages', features: ['Communication interne'] },
  { path: '/director/messages', eyebrow: 'Directeur', title: 'Messages', features: ['Communication interne'] },
  { path: '/superadmin/messages', eyebrow: 'Super Admin', title: 'Messages', features: ['Réseau global'] }
];

for (const r of routes) {
  const fileName = r.path.substring(1).replace(/\//g, '.') + '.tsx';
  const fullPath = path.join('src/routes', fileName);
  
  if (fs.existsSync(fullPath)) continue;

  const content = `import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/ui/stub-page";

export const Route = createFileRoute("${r.path}")({
  head: () => ({ meta: [{ title: "${r.title} — UCAR" }] }),
  component: () => (
    <StubPage
      eyebrow="${r.eyebrow}"
      title={"${r.title.replace(/"/g, '\\"')}"}
      description="Module en cours d'intégration."
      features={[${r.features.map(f => '"' + f.replace(/"/g, '\\"') + '"').join(', ')}]}
    />
  ),
});
`;

  fs.writeFileSync(fullPath, content);
  console.log('Created', fileName);
}
