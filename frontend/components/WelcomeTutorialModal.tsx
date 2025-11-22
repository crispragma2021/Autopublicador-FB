
import React from 'react';
import { Icon } from './Icon';

interface WelcomeTutorialModalProps {
    onStartTutorial: () => void;
    onSkip: () => void;
}

export const WelcomeTutorialModal: React.FC<WelcomeTutorialModalProps> = ({ onStartTutorial, onSkip }) => {
    return (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative">
                {/* Decorative Elements */}
                <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-blue-600/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-50px] left-[-50px] w-40 h-40 bg-purple-600/20 rounded-full blur-3xl"></div>

                <div className="p-8 text-center relative z-10">
                    <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-20 h-20 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6 transform rotate-3">
                        <Icon name="school" className="text-white" size={10} />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">¡Te damos la bienvenida!</h2>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        Parece que es tu primera vez aquí. ¿Te gustaría aprender a usar la IA para potenciar tus redes sociales con un tutorial rápido?
                    </p>

                    <div className="space-y-3">
                        <button 
                            onClick={onStartTutorial}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-900/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            <Icon name="school" size={5} />
                            <span>Ver Tutorial Guiado</span>
                        </button>
                        
                        <button 
                            onClick={onSkip}
                            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-6 rounded-xl transition-colors"
                        >
                            Empezar a explorar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
