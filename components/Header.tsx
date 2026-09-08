import React from 'react';
import type { AppView } from '../types';
import { Icon } from './Icon';

interface HeaderProps {
    view: AppView;
    onMenuClick: () => void;
}

const viewTitles: Record<AppView, string> = {
    DASHBOARD: 'Panel de Control',
    CREATE: 'Crear Nueva Publicación',
    CONTENT: 'Contenido y Calendario',
};

export const Header: React.FC<HeaderProps> = ({ view, onMenuClick }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-700/50 sticky top-0 z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
                onClick={onMenuClick}
                className="lg:hidden text-slate-400 hover:text-white focus:outline-none"
                aria-label="Abrir menú"
            >
                <Icon name="menu" size={6} />
            </button>
            <h1 className="text-2xl font-bold text-white truncate">{viewTitles[view]}</h1>
          </div>
        </div>
      </div>
    </header>
  );
};