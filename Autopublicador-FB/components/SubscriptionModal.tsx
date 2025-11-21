
import React, { useState } from 'react';
import { Icon } from './Icon';
import { startCheckoutSession } from '../services/paymentService';
import { Spinner } from './Spinner';

interface SubscriptionModalProps {
    onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const isPro = localStorage.getItem('is_pro_user') === 'true';

    const handleUpgrade = async () => {
        setIsLoading(true);
        try {
            const userId = localStorage.getItem('fb_user_id') || 'guest_user';
            await startCheckoutSession(userId);
        } catch (error) {
            console.error("Error en el proceso de compra:", error);
            setIsLoading(false);
            alert("Hubo un problema iniciando el pago. Por favor verifica la consola.");
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-slate-900/50 p-6 flex justify-between items-center border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Icon name="diamond" size={6} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Mejora tu Plan</h2>
                            <p className="text-sm text-slate-400">Desbloquea funciones premium de video</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-lg transition-colors">
                        <Icon name="x" size={6} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
                    <section>
                        <h3 className="text-lg font-bold text-white mb-4 text-center">Elige el plan ideal para ti</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            <div className={`bg-slate-800 border border-slate-700 rounded-xl p-6 relative ${isPro ? 'opacity-60' : 'opacity-100'}`}>
                                {!isPro && (
                                    <div className="absolute top-0 right-0 bg-slate-700 text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl text-slate-300">
                                        PLAN ACTUAL
                                    </div>
                                )}
                                <h4 className="text-xl font-bold text-white">Gratuito</h4>
                                <p className="text-2xl font-bold text-white mt-2">$0 <span className="text-sm text-slate-400 font-normal">/mes</span></p>
                                <p className="text-sm text-slate-400 mt-4 mb-6">Potenciado por Gemini Flash</p>
                                
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-center gap-3 text-sm text-slate-300">
                                        <Icon name="check" className="text-green-400" size={4}/> 
                                        <span>50 Imágenes / día</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-slate-300">
                                        <Icon name="check" className="text-green-400" size={4}/> 
                                        <span className="font-bold text-green-400">Textos Ilimitados</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-slate-300">
                                        <Icon name="warning" className="text-yellow-400" size={4}/> 
                                        <span>1 Video con IA / día</span>
                                    </li>
                                     <li className="flex items-center gap-3 text-sm text-slate-500">
                                        <Icon name="x" className="text-slate-600" size={4}/> 
                                        <span>Sin soporte prioritario</span>
                                    </li>
                                </ul>
                                <button disabled className="w-full bg-slate-700 text-slate-400 font-bold py-3 rounded-lg cursor-not-allowed">
                                    {isPro ? 'Plan Básico' : 'Plan Actual'}
                                </button>
                            </div>

                            <div className={`bg-gradient-to-b from-blue-900/20 to-slate-800 border ${isPro ? 'border-green-500/50' : 'border-blue-500/30'} rounded-xl p-6 relative overflow-hidden shadow-2xl transform ${!isPro ? 'scale-[1.02]' : ''}`}>
                                {isPro ? (
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                                ) : (
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                                )}
                                
                                {isPro ? (
                                     <div className="absolute top-0 right-0 bg-green-600 text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl text-white shadow-lg flex items-center gap-1">
                                        <Icon name="check" size={3} /> ACTIVO
                                    </div>
                                ) : (
                                    <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl text-white shadow-lg">
                                        RECOMENDADO
                                    </div>
                                )}

                                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                                    Pro Video <Icon name="diamond" className={isPro ? "text-green-400" : "text-blue-400"} size={5}/>
                                </h4>
                                <p className="text-2xl font-bold text-white mt-2">$9.99 <span className="text-sm text-slate-400 font-normal">/mes</span></p>
                                <p className="text-sm text-slate-400 mt-4 mb-6">Potencia tu estrategia de video.</p>
                                
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-center gap-3 text-sm text-white">
                                        <Icon name="check" className="text-blue-400" size={4}/> 
                                        <span className="font-bold">Generación ILIMITADA de Video (Veo)</span>
                                    </li>
                                     <li className="flex items-center gap-3 text-sm text-white">
                                        <Icon name="check" className="text-blue-400" size={4}/> 
                                        <span className="font-bold">Generación ILIMITADA de Imágenes</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-white">
                                        <Icon name="check" className="text-blue-400" size={4}/> 
                                        <span>Prioridad en la cola</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-white">
                                        <Icon name="check" className="text-blue-400" size={4}/> 
                                        <span>Soporte 24/7</span>
                                    </li>
                                </ul>
                                <button 
                                    onClick={handleUpgrade}
                                    disabled={isLoading || isPro}
                                    className={`w-full block text-center font-bold py-3 rounded-lg shadow-lg transition-all transform flex items-center justify-center gap-2 ${
                                        isPro 
                                        ? 'bg-green-600/20 text-green-400 border border-green-500/50 cursor-default' 
                                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white hover:scale-[1.02] animate-pulse'
                                    } disabled:opacity-70 disabled:cursor-not-allowed disabled:animate-none`}
                                >
                                    {isPro ? (
                                        <><Icon name="check" size={5} /> Plan Activo</>
                                    ) : (
                                        isLoading ? <Spinner size={5} /> : <><Icon name="diamond" size={5} /> Desbloquear Ilimitado</>
                                    )}
                                </button>
                                {!isPro && (
                                    <p className="text-xs text-center text-slate-500 mt-3">
                                        Procesado de forma segura por Stripe.
                                    </p>
                                )}
                            </div>

                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
