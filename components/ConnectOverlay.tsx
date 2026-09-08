import React from 'react';
import { Icon } from './Icon';

export const ConnectOverlay: React.FC = () => {
    return (
        <div className="absolute inset-0 bg-slate-800/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg">
            <div className="text-center p-8 bg-slate-900/50 rounded-xl border border-slate-700">
                <Icon name="lock" className="text-blue-400 mx-auto" size={10} />
                <h2 className="mt-4 text-xl font-bold text-white">Función Bloqueada</h2>
                <p className="mt-2 text-sm text-slate-300">
                    Por favor, vincula tu cuenta de Facebook desde el panel de navegación <br/> para habilitar esta funcionalidad.
                </p>
            </div>
        </div>
    )
}