
import React from 'react';
import { Icon } from './Icon';

export const WarningBanner: React.FC = () => {
  return (
    <div className="bg-blue-900/30 border-l-4 border-blue-500 text-blue-100 p-4 rounded-r-md shadow-lg mb-6" role="alert">
      <div className="flex items-start">
        <div className="py-1">
          <Icon name="lock" className="h-6 w-6 text-blue-400 mr-4" />
        </div>
        <div>
          <p className="font-bold text-blue-300">🛡️ Protección Anti-Spam Activa</p>
          <p className="text-sm mt-1 text-slate-300 leading-relaxed">
            Para evitar el bloqueo de tu cuenta ("Facebook Jail"), esta aplicación aplica automáticamente:
          </p>
          <ul className="list-disc list-inside text-xs mt-2 text-slate-400 space-y-1 ml-1">
            <li><strong>Humanización:</strong> Añade variaciones aleatorias de tiempo a tus horarios.</li>
            <li><strong>Límite Diario:</strong> Máximo 20 publicaciones cada 24 horas.</li>
            <li><strong>Enfriamiento:</strong> Mínimo 30 minutos entre cada publicación.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
