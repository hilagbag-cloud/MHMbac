/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Page de présentation institutionnelle MHM SOLUTIONS et du créateur Hilarus GBAGOULE
 * Créateur : Hilarus GBAGOULE
 */

import React, { useState } from 'react';
import {
  Compass,
  User,
  ShieldCheck,
  Target,
  Sparkles,
  Send,
  Mail,
  Globe,
  Phone,
  CheckCircle2,
  ExternalLink,
  Linkedin,
  Twitter,
  Facebook,
  MessageCircle,
  AlertTriangle,
} from 'lucide-react';
import { MHM_PROMOTION_CONFIG } from '../lib/promotion';
import { TransparencyBadge } from '../components/TransparencyBadge';

interface AboutPageProps {
  navigate: (route: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ navigate }) => {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSent(true);
    setContactName('');
    setContactEmail('');
    setContactMessage('');
    setTimeout(() => setContactSent(false), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-10 sm:py-16 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* ========================================================================= */}
        {/* 1. EN-TÊTE PRINCIPAL                                                      */}
        {/* ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-500 dark:text-rose-300">
            <Compass className="w-3.5 h-3.5" />
            <span>À propos de MHM SOLUTIONS</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-slate-900 dark:text-white">
            {MHM_PROMOTION_CONFIG.brandName}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            {MHM_PROMOTION_CONFIG.headline}
          </p>

          <div className="inline-block p-2 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium">
            Créateur & Concepteur : <strong className="text-slate-900 dark:text-white">{MHM_PROMOTION_CONFIG.creatorName}</strong>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. SECTION MISSION & VISION                                               */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-500 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
              Notre Mission
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {MHM_PROMOTION_CONFIG.mission}
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
              Notre Vision
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {MHM_PROMOTION_CONFIG.vision}
            </p>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 3. CE QUE LA PLATEFORME APPORTE                                           */}
        {/* ========================================================================= */}
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-6 shadow-xl">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Valeur Ajoutée & Rigueur
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight mt-1">
              Ce que la plateforme apporte concrètement
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MHM_PROMOTION_CONFIG.whatPlatformBrings.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-3 text-xs sm:text-sm text-slate-200"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. COORDONNÉES OFFICIELLES & RÉSEAUX SOCIAUX                               */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Site Officiel
            </div>
            <a
              href={MHM_PROMOTION_CONFIG.contact.officialWebsite}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-sm text-rose-500 hover:underline flex items-center gap-1.5"
            >
              <Globe className="w-4 h-4" />
              <span>{MHM_PROMOTION_CONFIG.contact.officialWebsite}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <p className="text-xs text-slate-500">Portail des solutions et initiatives MHM.</p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Email de Contact
            </div>
            <a
              href={`mailto:${MHM_PROMOTION_CONFIG.contact.creatorEmail}`}
              className="font-bold text-sm text-indigo-500 hover:underline flex items-center gap-1.5"
            >
              <Mail className="w-4 h-4" />
              <span>{MHM_PROMOTION_CONFIG.contact.creatorEmail}</span>
            </a>
            <p className="text-xs text-slate-500">Support et demandes de partenariats académiques.</p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Réseaux Sociaux
            </div>
            <div className="flex items-center gap-2">
              <a
                href={MHM_PROMOTION_CONFIG.socialLinks[0].url}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-rose-500 transition-colors"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href={MHM_PROMOTION_CONFIG.socialLinks[1].url}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-rose-500 transition-colors"
                title="Twitter / X"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href={MHM_PROMOTION_CONFIG.socialLinks[2].url}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-rose-500 transition-colors"
                title="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={MHM_PROMOTION_CONFIG.socialLinks[3].url}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-500 transition-colors"
                title="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-slate-500">Suivez nos actualités et alertes d'orientation.</p>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 5. FORMULAIRE DE CONTACT (PRÊT POUR RELIURE FUTURE)                       */}
        {/* ========================================================================= */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-sans">
              Nous contacter / Poser une question
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Ce formulaire est prêt pour être relié à notre passerelle de messagerie (n8n / Supabase Edge Functions).
            </p>
          </div>

          {contactSent && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>Merci pour votre message ! L'équipe de contact MHM SOLUTIONS vous répondra prochainement.</span>
            </div>
          )}

          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Votre Nom
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Ex: Hilarus"
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Votre Adresse E-mail
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="votre.email@exemple.com"
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Votre Message
              </label>
              <textarea
                rows={4}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Décrivez votre besoin d'information ou votre demande d'assistance..."
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="px-7 py-3 rounded-xl font-bold text-sm bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-950/30 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Send className="w-4 h-4" />
              <span>Envoyer mon message</span>
            </button>
          </form>
        </div>

        {/* ========================================================================= */}
        {/* 6. AVERTISSEMENT DÉONTOLOGIQUE                                            */}
        {/* ========================================================================= */}
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs leading-relaxed flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Avertissement déontologique :</strong> {MHM_PROMOTION_CONFIG.ethicsDisclaimer}
          </div>
        </div>

      </div>
    </div>
  );
};
