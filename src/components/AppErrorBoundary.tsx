import React from 'react';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; message?: string; }

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : 'Erreur inattendue.' };
  }

  componentDidCatch(error: unknown) {
    console.error('Erreur d’affichage MHM SOLUTIONS:', error);
  }

  handleReset = () => {
    window.history.replaceState({}, '', '/');
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <section className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-400">MHM SOLUTIONS</p>
          <h1 className="mt-3 text-2xl font-bold">La page n’a pas pu être affichée</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Une erreur temporaire a interrompu l’affichage. Tes données ne sont pas supprimées. Reviens à l’accueil ou recharge la page pour reprendre.</p>
          {import.meta.env.DEV && this.state.message && <pre className="mt-4 overflow-auto rounded-xl bg-slate-950 p-3 text-left text-xs text-rose-300">{this.state.message}</pre>}
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={this.handleReset} className="rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white">Revenir à l’accueil</button>
            <button onClick={() => window.location.reload()} className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200">Recharger</button>
          </div>
        </section>
      </main>
    );
  }
}
