import React from 'react';
import type { AppView } from '../types';

interface HeaderProps {
    view: AppView;
}

const viewTitles: Record<AppView, string> = {
    DASHBOARD: 'Panel de Control',
    CREATE: 'Crear Nueva Publicación',
    CONTENT: 'Contenido y Calendario',
};

export const Header: React.FC<HeaderProps> = ({ view }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-700/50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold text-white">{viewTitles[view]}</h1>
        </div>
      </div>
    </header>
  );
};