
import React from 'react';
import { Icon } from './Icon';

export const WarningBanner: React.FC = () => {
  return (
    <div className="bg-yellow-500/10 border-l-4 border-yellow-400 text-yellow-300 p-4 rounded-md shadow-lg" role="alert">
      <div className="flex items-center">
        <div className="py-1">
          <Icon name="warning" className="h-6 w-6 text-yellow-400 mr-4" />
        </div>
        <div>
          <p className="font-bold">¡Atención! Uso Responsable</p>
          <p className="text-sm">
            La automatización excesiva o el contenido repetitivo pueden violar las políticas de Facebook y poner en riesgo tu cuenta.
            Utiliza la función de <strong>retraso aleatorio</strong> y genera <strong>contenido variado</strong> con la IA para minimizar los riesgos. Publica con moderación.
          </p>
        </div>
      </div>
    </div>
  );
};
