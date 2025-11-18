import React from 'react';
import { Icon } from './Icon';
import type { AppView } from '../types';
import { Spinner } from './Spinner';

interface NavigationProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  isFacebookLinked: boolean;
  isLinking: boolean;
  onLinkFacebook: () => void;
}

const navItems: { view: AppView; label: string; icon: string }[] = [
  { view: 'DASHBOARD', label: 'Panel de Control', icon: 'dashboard' },
  { view: 'CREATE', label: 'Crear Publicación', icon: 'create' },
  { view: 'CONTENT', label: 'Contenido', icon: 'calendar' },
];

export const Navigation: React.FC<NavigationProps> = ({ currentView, setView, isFacebookLinked, isLinking, onLinkFacebook }) => {
  return (
    <nav className="w-64 bg-slate-800 p-4 flex flex-col h-screen sticky top-0 border-r border-slate-700">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="bg-blue-500 p-2 rounded-lg">
          <Icon name="logo" size={8} />
        </div>
        <h1 className="text-xl font-bold text-white">Publicador IA</h1>
      </div>
      
      <div className="flex-grow">
        <p className="px-4 text-sm font-semibold text-slate-400 mb-2">MENÚ</p>
        <ul className="space-y-2">
          {navItems.map(item => (
            <li key={item.view}>
              <button
                onClick={() => setView(item.view)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-base font-semibold transition-colors duration-200 ${
                  currentView === item.view
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon name={item.icon} />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <p className="px-4 text-sm font-semibold text-slate-400 mb-2">CUENTA</p>
        {isFacebookLinked ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 rounded-lg">
                <img className="h-10 w-10 rounded-full" src="https://picsum.photos/100/100" alt="Avatar"/>
                <div>
                    <p className="font-semibold text-white text-sm">Mi Página de Facebook</p>
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-green-400"></span>
                        <p className="text-xs text-green-400">Conectado</p>
                    </div>
                </div>
            </div>
        ) : (
            <button
                onClick={onLinkFacebook}
                disabled={isLinking}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-colors duration-200 bg-blue-800/50 hover:bg-blue-700/50 text-white disabled:bg-slate-600"
            >
                {isLinking ? <Spinner/> : <Icon name="facebook" size={5}/>}
                {isLinking ? 'Vinculando...' : 'Vincular Cuenta'}
            </button>
        )}
      </div>

      <div className="mt-6 p-4 bg-slate-900/50 rounded-lg text-center">
        <p className="text-xs text-slate-400">© 2024 Publicador IA</p>
        <p className="text-xs text-slate-500 mt-1">Simulación para fines demostrativos.</p>
      </div>
    </nav>
  );
};