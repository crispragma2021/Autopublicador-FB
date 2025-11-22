
import React from 'react';
import { Icon } from './Icon';
import type { AppView } from '../types';

interface NavigationProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  
  isFacebookLinked: boolean;
  isFacebookLinking: boolean;
  onLinkFacebook: () => void;
  onUnlinkFacebook: () => void;

  isOpen: boolean;
  onClose: () => void;
  
  isSubscriptionOpen: boolean;
  onToggleSubscription: () => void;
}

const navItems: { view: AppView; label: string; icon: string }[] = [
  { view: 'DASHBOARD', label: 'Panel de Control', icon: 'dashboard' },
  { view: 'CREATE', label: 'Crear Publicación', icon: 'create' },
  { view: 'CONTENT', label: 'Contenido', icon: 'calendar' },
];

const AccountItem: React.FC<{
    isConnected: boolean;
    isLinking: boolean;
    onLink: () => void;
    onUnlink: () => void;
    name: string;
    platform: string;
    icon: string;
    colorClass: string;
}> = ({ isConnected, isLinking, onLink, onUnlink, name, platform, icon, colorClass }) => {
    if (isConnected) {
        return (
            <div className="bg-slate-900/50 rounded-lg p-3 space-y-3 border border-slate-700/50">
                  <div className="flex items-center gap-3">
                      <div className="relative">
                        <img className={`h-10 w-10 rounded-full border-2 ${colorClass}`} src={`https://picsum.photos/seed/${platform}/100/100`} alt="Avatar"/>
                        <div className="absolute -bottom-1 -right-1 bg-slate-800 rounded-full p-0.5">
                             <Icon name={icon} size={3} className={colorClass.replace('border-', 'text-')} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{name}</p>
                          <p className="text-xs text-green-400 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span> Conectado
                          </p>
                      </div>
                  </div>
                  <button 
                    onClick={onUnlink}
                    className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-slate-800 py-1.5 rounded transition-colors flex items-center justify-center gap-1"
                  >
                      Desvincular
                  </button>
            </div>
        )
    }

    return (
        <button 
            onClick={onLink}
            disabled={isLinking}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white p-3 rounded-lg transition-all flex items-center gap-3 group"
        >
             <div className="bg-slate-900 p-2 rounded-full group-hover:bg-slate-800 transition-colors">
                 <Icon name={icon} size={5} className={colorClass.replace('border-', 'text-')} />
             </div>
             <span className="text-sm font-medium">{isLinking ? 'Conectando...' : `Vincular ${platform}`}</span>
        </button>
    );
}

export const Navigation: React.FC<NavigationProps> = ({ 
  currentView, 
  setView, 
  isFacebookLinked,
  isFacebookLinking,
  onLinkFacebook,
  onUnlinkFacebook,
  isOpen,
  onClose,
  isSubscriptionOpen,
  onToggleSubscription
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <nav className={`
        fixed lg:static inset-y-0 left-0 z-[60] 
        w-64 bg-slate-900 border-r border-slate-700/50 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
          <div className="bg-blue-600 p-1.5 rounded-lg mr-3 shadow-lg shadow-blue-900/20">
             <Icon name="logo" className="text-white" size={6} />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Social AI</span>
        </div>

        {/* Menu Items */}
        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
           <p className="text-xs font-bold text-slate-500 px-4 mb-2 uppercase tracking-wider">Menú Principal</p>
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium group ${
                currentView === item.view
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-inner'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon 
                name={item.icon} 
                size={5} 
                className={`transition-colors ${
                  currentView === item.view ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                }`} 
              />
              {item.label}
            </button>
          ))}
           
           <div className="pt-6">
                <p className="text-xs font-bold text-slate-500 px-4 mb-4 uppercase tracking-wider">Cuenta</p>
                <div className="space-y-3">
                    <AccountItem 
                        isConnected={isFacebookLinked}
                        isLinking={isFacebookLinking}
                        onLink={onLinkFacebook}
                        onUnlink={onUnlinkFacebook}
                        name="Mi Página de Facebook"
                        platform="Facebook"
                        icon="facebook"
                        colorClass="border-blue-600"
                    />
                </div>
           </div>
        </div>

        {/* Plan Section */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-900">
             <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 bg-blue-500/10 w-24 h-24 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                
                <div className="flex items-center justify-between mb-3 relative">
                    <span className="text-xs font-bold text-white bg-slate-700 px-2 py-0.5 rounded uppercase">Gratis</span>
                    <Icon name="rocket" className="text-blue-400" size={5} />
                </div>
                
                <p className="text-sm text-slate-300 font-medium mb-3 relative">
                    Plan Básico
                </p>
                
                <button 
                    onClick={onToggleSubscription}
                    className={`w-full text-xs font-bold py-2 rounded-lg transition-colors relative z-10 ${
                        isSubscriptionOpen 
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-blue-600 text-white hover:bg-blue-500'
                    }`}
                >
                    {isSubscriptionOpen ? 'Cerrar Planes' : 'Mejorar Plan'}
                </button>
             </div>
        </div>
      </nav>
    </>
  );
};
