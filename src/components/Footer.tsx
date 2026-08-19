import React from 'react';
import { Shield, Mail } from 'lucide-react';
import { MHM_PROMOTION_CONFIG } from '../lib/promotion';

interface FooterProps {
  navigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  const onInternalLink = (event: React.MouseEvent<HTMLAnchorElement>, route: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    navigate(route);
  };

  return (
    <footer id="app-footer" className="mt-20 border-t border-slate-900 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:gap-12">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center">
                <img src="/branding/bacpilot-mark-512.png" alt="Logo BacPilot" className="h-10 w-auto object-contain" />
              </div>
              <div>
                <span className="font-sans text-lg font-bold text-white">MHM <span className="text-rose-400">SOLUTIONS</span></span>
                <span className="block text-xs text-slate-300">BacPilot — Plateforme d’orientation</span>
              </div>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-slate-400 sm:text-sm">{MHM_PROMOTION_CONFIG.subheadline}</p>
            <div className="border-t border-slate-900/80 pt-2 text-xs text-slate-300">Créé et développé par <a href="/fondateur-hilarus-gbagoule" onClick={(event) => onInternalLink(event, '/fondateur-hilarus-gbagoule')} className="font-semibold text-white underline decoration-rose-400/70 underline-offset-4 transition hover:text-rose-200">{MHM_PROMOTION_CONFIG.creatorName}</a> ({MHM_PROMOTION_CONFIG.creatorTitle}) · <a href={MHM_PROMOTION_CONFIG.contact.creatorPortfolio} target="_blank" rel="noreferrer" className="font-semibold text-rose-300 underline underline-offset-4 transition hover:text-rose-200">Voir son portfolio</a>.</div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Navigation</h2>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><a href="/" onClick={(event) => onInternalLink(event, '/')} className="transition-colors hover:text-white">Accueil BacPilot</a></li>
              <li><a href="/orientation-bac-benin" onClick={(event) => onInternalLink(event, '/orientation-bac-benin')} className="transition-colors hover:text-white">Guide orientation après le bac au Bénin</a></li>
              <li><a href="/methodologie" onClick={(event) => onInternalLink(event, '/methodologie')} className="transition-colors hover:text-white">Comment BacPilot fonctionne</a></li>
              <li><a href="/articles" onClick={(event) => onInternalLink(event, '/articles')} className="transition-colors hover:text-white">Articles et conseils d’orientation</a></li>
              <li><a href="/about" onClick={(event) => onInternalLink(event, '/about')} className="transition-colors hover:text-white">À propos de MHM SOLUTIONS</a></li>
              <li><a href="/fondateur-hilarus-gbagoule" onClick={(event) => onInternalLink(event, '/fondateur-hilarus-gbagoule')} className="transition-colors hover:text-white">Hilarus Gbagoule, créateur de BacPilot</a></li>
              <li><a href="/beta" onClick={(event) => onInternalLink(event, '/beta')} className="transition-colors hover:text-white">Programme bêta BacPilot</a></li>
              <li><a href="/contributeurs-beta" onClick={(event) => onInternalLink(event, '/contributeurs-beta')} className="transition-colors hover:text-white">Contributeurs bêta BacPilot</a></li>
              <li><a href="https://partenaires.bacpilot.site" className="transition-colors hover:text-white">Devenir partenaire</a></li>
              <li><a href="/onboarding" onClick={(event) => onInternalLink(event, '/onboarding')} className="transition-colors hover:text-white">Préparer mes pistes</a></li>
              <li><a href="/avis" onClick={(event) => onInternalLink(event, '/avis')} className="transition-colors hover:text-white">Avis de la communauté</a></li>
              <li><a href="/soutenir" onClick={(event) => onInternalLink(event, '/soutenir')} className="transition-colors hover:text-white">Soutenir BacPilot</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Informations et éthique</h2>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><a href="/privacy" onClick={(event) => onInternalLink(event, '/privacy')} className="transition-colors hover:text-white">Politique de confidentialité</a></li>
              <li><a href="/terms" onClick={(event) => onInternalLink(event, '/terms')} className="transition-colors hover:text-white">Conditions d’utilisation</a></li>
              <li><a href="/contact" onClick={(event) => onInternalLink(event, '/contact')} className="transition-colors hover:text-white">Nous contacter</a></li>
              <li><a href="https://whatsapp.com/channel/0029VbDpHRNAYlUQHSqika2n" target="_blank" rel="noreferrer" className="transition-colors hover:text-white">Suivre BacPilot sur WhatsApp</a></li>
              <li className="pt-2"><a href={`mailto:${MHM_PROMOTION_CONFIG.contact.officialEmail}`} className="flex items-center gap-1.5 text-rose-400 transition-colors hover:text-rose-300"><Mail className="h-3.5 w-3.5" /><span>{MHM_PROMOTION_CONFIG.contact.officialEmail}</span></a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-900 pt-6 text-xs leading-relaxed text-slate-300"><p className="flex items-start gap-2"><Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" /><span><strong>Avertissement déontologique :</strong> {MHM_PROMOTION_CONFIG.ethicsDisclaimer}</span></p></div>
        <div className="mt-6 flex flex-col items-center justify-between gap-2 text-xs text-slate-400 sm:flex-row"><div>© {new Date().getFullYear()} MHM SOLUTIONS. Tous droits réservés.</div><div>Créé avec rigueur et bienveillance pour les bacheliers.</div></div>
      </div>
    </footer>
  );
};

export default Footer;
