
import React from 'react';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

interface LoginPageProps {
    onLoginFacebook: () => void;
    isLoggingInFacebook: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
    onLoginFacebook, 
    isLoggingInFacebook,
}) => {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background decoration elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="bg-slate-800/80 backdrop-blur-xl p-8 sm:p-10 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md z-10 text-center space-y-8 animate-fade-in">
                <div className="flex justify-center mb-2">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-5 rounded-2xl shadow-lg transform rotate-3">
                         <Icon name="logo" size={12} className="text-yellow-400" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Publicador IA</h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Gestiona, crea y automatiza tus redes sociales con el poder de la Inteligencia Artificial.
                    </p>
                </div>

                <div className="space-y-4 pt-4">
                    <button
                        onClick={onLoginFacebook}
                        disabled={isLoggingInFacebook}
                        className="w-full bg-[#1877F2] hover:bg-[#166fe5] disabled:bg-slate-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg text-lg"
                    >
                        {isLoggingInFacebook ? <Spinner size={6} /> : <Icon name="facebook" size={6} />}
                        {isLoggingInFacebook ? 'Conectando...' : 'Continuar con Facebook'}
                    </button>
                    
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-2">
                        <Icon name="lock" size={3} />
                        <span>Conexión segura SSL</span>
                    </div>

                    <p className="text-xs text-slate-500 border-t border-slate-700/50 pt-4">
                        Al continuar, aceptas los términos de servicio y la política de privacidad de nuestra plataforma.
                    </p>
                </div>
            </div>
            
             <div className="mt-8 text-slate-600 text-sm font-medium">
                &copy; 2024 Publicador IA Enterprise Suite
            </div>
        </div>
    );
};
