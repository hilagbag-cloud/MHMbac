/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Page de politique de confidentialité simplifiée
 * Créateur : Hilarus GBAGOULE
 */

import React from 'react';
import { ShieldCheck, Lock, Eye, Database, Server } from 'lucide-react';
import { MHM_PROMOTION_CONFIG } from '../lib/promotion';

export const PrivacyPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-12 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
            <span>Sécurité & Vie Privée</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight">
            Politique de Confidentialité
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Mise à jour pour le MVP1 — Plateforme MHM SOLUTIONS.
          </p>
        </div>

        <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-500" />
              <span>1. Collecte Minimale des Données</span>
            </h2>
            <p>
              Dans le cadre de ce MVP1, nous collectons exclusivement les données nécessaires à la personnalisation de vos recommandations d’orientation : votre nom d'affichage, votre adresse e-mail, votre série de BAC, votre mention et vos centres d'intérêt professionnels.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              <span>2. Sécurité & Politiques Row Level Security (RLS)</span>
            </h2>
            <p>
              Toutes les données hébergées sur Supabase PostgreSQL sont protégées par des politiques strictes de sécurité au niveau des lignes (RLS). Aucun utilisateur ne peut accéder, lire ou modifier les profils ou préférences d'un autre utilisateur. Les mots de passe sont hachés et gérés par l’infrastructure Supabase Auth et ne sont jamais stockés dans nos tables applicatives.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-500" />
              <span>3. Non-commercialisation des Données</span>
            </h2>
            <p>
              MHM SOLUTIONS et son créateur, Hilarus GBAGOULE, s'engagent formellement à ne jamais vendre, céder ou commercialiser les données personnelles des bacheliers à des organismes tiers ou régies publicitaires.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-500" />
              <span>4. Exercice de vos Droits</span>
            </h2>
            <p>
              Vous pouvez à tout moment demander la modification ou la suppression intégrale de vos données en écrivant à :{' '}
              <a href={`mailto:${MHM_PROMOTION_CONFIG.contact.creatorEmail}`} className="text-rose-500 font-bold hover:underline">
                {MHM_PROMOTION_CONFIG.contact.creatorEmail}
              </a>.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
