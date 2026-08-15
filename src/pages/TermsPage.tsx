/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Page des conditions générales d'utilisation simplifiées
 * Créateur : Hilarus GBAGOULE
 */

import React from 'react';
import { FileText, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';
import { MHM_PROMOTION_CONFIG } from '../lib/promotion';

export const TermsPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-12 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <FileText className="w-4 h-4" />
            <span>Cadre Légal & Déontologique</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight">
            Conditions d’Utilisation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Conditions applicables à BacPilot, une solution MHM SOLUTIONS.
          </p>
        </div>

        <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-500" />
              <span>1. Objet du service</span>
            </h2>
            <p>
              La plateforme MHM SOLUTIONS est un outil d'aide à la décision et de simulation d'orientation post-baccalauréat. Elle est conçue pour aider les nouveaux bacheliers à évaluer l'adéquation de leur profil avec différentes filières universitaires et d'écoles supérieures.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>2. Non-garantie d'Admission et de Bourse</span>
            </h2>
            <p>
              <strong>Important :</strong> MHM SOLUTIONS ne garantit en aucun cas une admission universitaire, une inscription définitive ou l'attribution d'une bourse ou d'un secours d'études. Les décisions d'admission et d'allocation relèvent de la compétence souveraine des ministères de tutelle, des commissions nationales d'orientation et des conseils d'établissements universitaires.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              <span>3. Statut et limites des observations</span>
            </h2>
            <p>
              Les indicateurs affichés par BacPilot proviennent d’observations synchronisées par une extension autorisée dans une session officielle active. Ils décrivent un état observé à un instant donné, peuvent évoluer et ne remplacent ni les règles, ni les décisions, ni les informations publiées par les autorités compétentes. BacPilot ne présente pas de donnée inventée comme une information réelle.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>4. Propriété Intellectuelle & Créateur</span>
            </h2>
            <p>
              L’architecture, les algorithmes de pondération, la marque et les interfaces MHM SOLUTIONS sont l'œuvre de M. Hilarus GBAGOULE. Toute reproduction intégrale sans accord préalable est interdite.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
