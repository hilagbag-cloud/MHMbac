/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Pied de page complet avec liens légaux, présentation du créateur et avertissement
 * Créateur : Hilarus GBAGOULE
 */

import React from 'react';
import { Shield, Mail } from 'lucide-react';
import { MHM_PROMOTION_CONFIG } from '../lib/promotion';

interface FooterProps {
  navigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer id="app-footer" className="bg-slate-950 text-slate-400 border-t border-slate-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Colonne 1: Marque & Créateur */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-700 flex items-center justify-center text-white shadow-md overflow-hidden">
                <img src="/branding/bacpilot-mark-final.png" alt="" className="w-9 h-9 object-contain" />
              </div>
              <div>
                <span className="font-bold text-lg text-white font-sans">
                  MHM <span className="text-rose-400">SOLUTIONS</span>
                </span>
                <span className="block text-xs text-slate-300">BacPilot — Plateforme d’Orientation</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              {MHM_PROMOTION_CONFIG.subheadline}
            </p>

            <div className="pt-2 text-xs text-slate-300 border-t border-slate-900/80">
              Conçu & Développé par <strong className="text-white font-semibold">{MHM_PROMOTION_CONFIG.creatorName}</strong> ({MHM_PROMOTION_CONFIG.creatorTitle}).
            </div>
          </div>

          {/* Colonne 2: Navigation rapide */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  onClick={() => navigate('/')}
                  className="hover:text-white transition-colors"
                >
                  Accueil & Découverte
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/about')}
                  className="hover:text-white transition-colors"
                >
                  À propos de MHM SOLUTIONS
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/onboarding')}
                  className="hover:text-white transition-colors"
                >
                  Personnaliser mon orientation
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="hover:text-white transition-colors"
                >
                  Tableau de bord de suivi
                </button>
              </li>
            </ul>
          </div>

          {/* Colonne 3: Cadre Légal & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Informations & Éthique
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  onClick={() => navigate('/privacy')}
                  className="hover:text-white transition-colors"
                >
                  Politique de confidentialité
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/terms')}
                  className="hover:text-white transition-colors"
                >
                  Conditions d’utilisation
                </button>
              </li>
              <li className="pt-2">
                <a
                  href={`mailto:${MHM_PROMOTION_CONFIG.contact.creatorEmail}`}
                  className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{MHM_PROMOTION_CONFIG.contact.creatorEmail}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bannière de Transparence Déontologique dans le Footer */}
        <div className="mt-10 pt-6 border-t border-slate-900 text-xs text-slate-300 leading-relaxed">
          <p className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Avertissement déontologique :</strong> {MHM_PROMOTION_CONFIG.ethicsDisclaimer}
            </span>
          </p>
        </div>

        {/* Copyright */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div>
            © {new Date().getFullYear()} MHM SOLUTIONS. Tous droits réservés.
          </div>
          <div className="flex items-center gap-1">
            <span>Créé avec rigueur & bienveillance pour les bacheliers.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
