
import React, { useState } from 'react';
import type { ScheduleOptions, DayOfWeek, SchedulePattern } from '../types';
import { ScheduleType } from '../types';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

interface SchedulerProps {
  onPostNow: () => void;
  onSchedulePost: (options: ScheduleOptions) => void;
  disabled: boolean;
  isFacebookLinked: boolean;
}

const weekDays: { label: string; value: DayOfWeek; fullName: string }[] = [
    { label: 'L', value: 1, fullName: 'Lunes' }, { label: 'M', value: 2, fullName: 'Martes' }, { label: 'X', value: 3, fullName: 'Miércoles' },
    { label: 'J', value: 4, fullName: 'Jueves' }, { label: 'V', value: 5, fullName: 'Viernes' }, { label: 'S', value: 6, fullName: 'Sábado' },
    { label: 'D', value: 0, fullName: 'Domingo' },
];

const initialPatterns: SchedulePattern[] = [
    { id: 1, days: [1, 3, 5], times: ['09:00', '18:00'] }
];

export const Scheduler: React.FC<SchedulerProps> = ({ onPostNow, onSchedulePost, disabled, isFacebookLinked }) => {
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleType, setScheduleType] = useState<ScheduleType>(ScheduleType.SPECIFIC_DAYS);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  
  // Start Date State
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Interval state
  const [frequency, setFrequency] = useState(60);
  const [randomize, setRandomize] = useState(true);
  
  // Specific days state
  const [patterns, setPatterns] = useState<SchedulePattern[]>(initialPatterns);
  
  // Local state for the time input currently being edited per pattern
  const [tempTimes, setTempTimes] = useState<{[key: number]: string}>({});

  // Estado para simular análisis de IA
  const [analyzingPatternId, setAnalyzingPatternId] = useState<number | null>(null);

  const handleDayToggle = (patternId: number, day: DayOfWeek) => {
    setPatterns(prevPatterns => prevPatterns.map(p => {
        if (p.id === patternId) {
            const newDays = new Set(p.days);
            if (newDays.has(day)) {
                newDays.delete(day);
            } else {
                newDays.add(day);
            }
            return { ...p, days: Array.from(newDays) };
        }
        return p;
    }));
  };
  
  const handleAddTime = (patternId: number) => {
      const timeToAdd = tempTimes[patternId];
      if (!timeToAdd) return;

      setPatterns(prev => prev.map(p => {
          if (p.id === patternId) {
              if (!p.times.includes(timeToAdd)) {
                  return { ...p, times: [...p.times, timeToAdd].sort() };
              }
          }
          return p;
      }));
      setTempTimes(prev => ({...prev, [patternId]: ''}));
  };

  const handleRemoveTime = (patternId: number, timeToRemove: string) => {
      setPatterns(prev => prev.map(p => {
          if (p.id === patternId) {
              return { ...p, times: p.times.filter(t => t !== timeToRemove) };
          }
          return p;
      }));
  };

  const handleSuggestBestTimes = (patternId: number) => {
      setAnalyzingPatternId(patternId);
      
      // Simular tiempo de análisis de IA
      setTimeout(() => {
        setPatterns(prev => prev.map(p => {
            if (p.id === patternId) {
                // Lógica simple de "IA": Detectar si es fin de semana o semana laboral
                const hasWeekend = p.days.includes(0) || p.days.includes(6);
                
                let suggestedTimes = [];
                if (hasWeekend) {
                    // Fines de semana: Engagement más tarde (Brunch, Tarde, Noche)
                    suggestedTimes = ['10:30', '15:00', '21:00'];
                } else {
                    // Días laborales: Commute mañana, Almuerzo, Salida/Noche
                    suggestedTimes = ['08:15', '13:30', '19:45'];
                }

                const combined = Array.from(new Set([...p.times, ...suggestedTimes])).sort();
                return { ...p, times: combined };
            }
            return p;
        }));
        setAnalyzingPatternId(null);
      }, 1200);
  };
  
  const addPattern = () => {
    const newPattern: SchedulePattern = {
        id: Date.now(),
        days: [],
        times: [],
    };
    setPatterns(prev => [...prev, newPattern]);
  };
  
  const removePattern = (patternId: number) => {
    setPatterns(prev => prev.filter(p => p.id !== patternId));
  };

  const handleScheduleClick = () => {
    let options: ScheduleOptions;
    if (scheduleType === ScheduleType.INTERVAL) {
        options = {
            type: ScheduleType.INTERVAL,
            frequencyMinutes: frequency,
            randomize,
            startDate
        };
    } else {
        const validPatterns = patterns.filter(p => p.days.length > 0 && p.times.length > 0);
        if (validPatterns.length === 0) {
            alert("⚠️ Configuración incompleta.\n\nAsegúrate de seleccionar al menos un día de la semana y añadir al menos una hora de publicación.");
            return;
        }
        options = {
            type: ScheduleType.SPECIFIC_DAYS,
            patterns: validPatterns,
            startDate
        };
    }
    
    setShowSuccessToast(true);
    setTimeout(() => {
        onSchedulePost(options);
    }, 1500);
  };
  
  const actionButtonsDisabled = disabled || !isFacebookLinked || showSuccessToast;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-4 shadow-sm relative">
      
      {showSuccessToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[70] bg-slate-800 border border-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-bounce">
            <div className="bg-green-500/20 p-2 rounded-full">
                <Icon name="check" className="text-green-400" size={6} />
            </div>
            <div>
                <h4 className="font-bold text-green-400">¡Programado con éxito!</h4>
                <p className="text-sm text-slate-300">Tu publicación se ha añadido a la cola.</p>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={onPostNow}
          disabled={actionButtonsDisabled}
          className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition duration-200 text-center border border-transparent flex justify-center items-center gap-2"
        >
          <Icon name="rocket" size={5} /> Publicar Ahora
        </button>
        <button
          onClick={() => setIsScheduling(!isScheduling)}
          disabled={actionButtonsDisabled}
          className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition duration-200 text-center border border-transparent flex justify-center items-center gap-2"
        >
           <Icon name="calendar" size={5} /> {isScheduling ? 'Ocultar Programador' : 'Programar'}
        </button>
      </div>

      {isScheduling && (
        <div className="border-t border-slate-700 pt-4 space-y-4 animate-fade-in">
          
          {/* Safety Badge */}
          <div className="flex items-center justify-center gap-2 bg-blue-900/20 border border-blue-500/20 p-2 rounded text-xs text-blue-300">
             <Icon name="lock" size={3} />
             <span className="font-semibold">Modo Humano: Activado por defecto para tu seguridad</span>
          </div>
          
          {/* START DATE INPUT */}
          <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-lg border border-slate-700">
             <div className="bg-slate-800 p-2 rounded text-blue-400">
                 <Icon name="calendar" size={4} />
             </div>
             <div className="flex-1">
                 <label htmlFor="startDate" className="text-xs font-bold text-slate-400 block uppercase mb-1">Fecha de inicio de campaña</label>
                 <input 
                    type="date" 
                    id="startDate"
                    value={startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded p-1.5 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                 />
             </div>
          </div>

          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
            <button 
              onClick={() => setScheduleType(ScheduleType.SPECIFIC_DAYS)}
              className={`w-full text-center py-2 rounded-md text-sm font-medium transition-all duration-200 ${scheduleType === ScheduleType.SPECIFIC_DAYS ? 'bg-slate-700 text-white shadow ring-1 ring-slate-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              Días Específicos
            </button>
            <button 
              onClick={() => setScheduleType(ScheduleType.INTERVAL)}
              className={`w-full text-center py-2 rounded-md text-sm font-medium transition-all duration-200 ${scheduleType === ScheduleType.INTERVAL ? 'bg-slate-700 text-white shadow ring-1 ring-slate-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              Por Intervalo
            </button>
          </div>
          
          {scheduleType === ScheduleType.INTERVAL && (
            <div className="space-y-4 p-4 bg-slate-900/30 rounded-lg border border-slate-700/50">
              <div className="flex items-center gap-4">
                <label htmlFor="frequency" className="text-sm font-medium text-slate-300 whitespace-nowrap">
                  Frecuencia:
                </label>
                <div className="flex items-center">
                    <input
                    type="number"
                    id="frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(Math.max(1, parseInt(e.target.value, 10)))}
                    className="w-20 bg-slate-900 border border-slate-700 rounded-l-md p-2 text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:z-10 outline-none"
                    />
                    <span className="bg-slate-700 border border-slate-700 border-l-0 text-slate-300 text-sm px-3 py-2 rounded-r-md">min</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-900/20 border border-green-500/20 rounded-md">
                <div className="flex h-5 items-center">
                    <Icon name="check" size={4} className="text-green-400" />
                </div>
                <div>
                    <label className="text-sm font-bold text-green-400 select-none">
                    Modo Humano Protegido
                    </label>
                    <p className="text-xs text-slate-400 mt-1">El sistema variará automáticamente la hora exacta de publicación (+/- 5 min) para evitar detección de bots.</p>
                </div>
              </div>
            </div>
          )}

          {scheduleType === ScheduleType.SPECIFIC_DAYS && (
            <div className="space-y-6">
              {patterns.map((pattern, index) => (
                <div key={pattern.id} className="bg-slate-900/50 border border-slate-700 p-4 rounded-xl space-y-4 relative group transition-colors hover:border-slate-600">
                  <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span> 
                          Patrón #{index + 1}
                      </p>
                      {patterns.length > 1 && (
                        <button 
                            onClick={() => removePattern(pattern.id)} 
                            className="text-slate-500 hover:text-red-400 transition-colors p-1.5 hover:bg-slate-800 rounded-md"
                            title="Eliminar este patrón"
                        >
                            <Icon name="trash" size={4} />
                        </button>
                      )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-2 uppercase">1. Días de la semana</label>
                    <div className="flex justify-between gap-1 sm:gap-2">
                      {weekDays.map(day => {
                        const isSelected = pattern.days.includes(day.value);
                        return (
                            <button 
                            key={day.value}
                            onClick={() => handleDayToggle(pattern.id, day.value)}
                            title={day.fullName}
                            className={`
                                flex-1 aspect-square sm:aspect-auto sm:h-10 flex items-center justify-center 
                                rounded-md text-sm font-bold transition-all duration-200 border
                                ${isSelected 
                                    ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.3)] transform scale-105' 
                                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200 hover:border-slate-600'
                                }
                            `}
                            >
                            {day.label}
                            </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-end mb-2">
                         <label className="text-xs font-semibold text-slate-400 block uppercase">2. Horarios de publicación</label>
                         <button 
                            onClick={() => handleSuggestBestTimes(pattern.id)}
                            disabled={analyzingPatternId === pattern.id}
                            className="text-[10px] bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 px-3 py-1.5 rounded-full border border-purple-500/20 transition-colors flex items-center gap-1.5 disabled:opacity-70 disabled:cursor-wait"
                            title="Usar IA para detectar mejores horas"
                         >
                             {analyzingPatternId === pattern.id ? <Spinner size={3} /> : "✨"} 
                             {analyzingPatternId === pattern.id ? "Analizando..." : "Sugerir Mejores Horas"}
                         </button>
                    </div>
                    
                    <div className="flex gap-2 mb-3">
                         <input
                            type="time"
                            value={tempTimes[pattern.id] || ''}
                            onChange={(e) => setTempTimes(prev => ({...prev, [pattern.id]: e.target.value}))}
                            className="flex-1 bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                        />
                        <button 
                            onClick={() => handleAddTime(pattern.id)}
                            disabled={!tempTimes[pattern.id]}
                            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            Añadir
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[2rem]">
                        {pattern.times.length === 0 && (
                             <span className="text-xs text-slate-500 italic py-1">Sin horarios añadidos...</span>
                        )}
                        {pattern.times.map(time => (
                            <div key={time} className="bg-blue-900/40 border border-blue-500/30 text-blue-200 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-2 group hover:bg-blue-900/60 transition-colors">
                                <Icon name="clock" size={3} className="text-blue-400" />
                                <span>{time}</span>
                                <button 
                                    onClick={() => handleRemoveTime(pattern.id, time)}
                                    className="text-blue-400 hover:text-white bg-blue-800/50 rounded-full p-0.5 transition-colors"
                                >
                                    <Icon name="x" size={3} />
                                </button>
                            </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
               
               <button 
                    onClick={addPattern} 
                    className="w-full py-3 border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-semibold group"
                >
                    <span className="bg-slate-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs group-hover:bg-slate-600">+</span> 
                    Crear patrón adicional (fines de semana, etc.)
                </button>
            </div>
          )}

          <button
            onClick={handleScheduleClick}
            disabled={actionButtonsDisabled}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-70 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-blue-900/30 transform hover:translate-y-[-1px] flex items-center justify-center gap-2 mt-4"
          >
             {showSuccessToast ? <Spinner size={5} /> : <Icon name="check" size={5} />}
             {showSuccessToast ? 'Procesando...' : 'Confirmar Programación'}
          </button>
        </div>
      )}
    </div>
  );
};
