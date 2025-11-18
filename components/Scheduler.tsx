import React, { useState } from 'react';
import type { ScheduleOptions, DayOfWeek, SchedulePattern } from '../types';
import { ScheduleType } from '../types';
import { Icon } from './Icon';

interface SchedulerProps {
  onPostNow: () => void;
  onSchedulePost: (options: ScheduleOptions) => void;
  disabled: boolean;
  isFacebookLinked: boolean;
}

const weekDays: { label: string; value: DayOfWeek }[] = [
    { label: 'L', value: 1 }, { label: 'M', value: 2 }, { label: 'X', value: 3 },
    { label: 'J', value: 4 }, { label: 'V', value: 5 }, { label: 'S', value: 6 },
    { label: 'D', value: 0 },
];

const initialPatterns: SchedulePattern[] = [
    { id: 1, days: [1, 3, 5], times: ['09:00', '17:30'] }
];

export const Scheduler: React.FC<SchedulerProps> = ({ onPostNow, onSchedulePost, disabled, isFacebookLinked }) => {
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleType, setScheduleType] = useState<ScheduleType>(ScheduleType.SPECIFIC_DAYS);

  // Interval state
  const [frequency, setFrequency] = useState(60);
  const [randomize, setRandomize] = useState(true);
  
  // Specific days state (multiple patterns)
  const [patterns, setPatterns] = useState<SchedulePattern[]>(initialPatterns);


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
  
  const handleTimesChange = (patternId: number, newTimes: string) => {
     setPatterns(prevPatterns => prevPatterns.map(p => {
        if (p.id === patternId) {
            return { ...p, times: newTimes.split(',').map(t => t.trim()) };
        }
        return p;
    }));
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
            randomize
        };
    } else {
        const validPatterns = patterns
            .map(p => ({
                ...p,
                times: p.times.filter(t => /^\d{2}:\d{2}$/.test(t))
            }))
            .filter(p => p.days.length > 0 && p.times.length > 0);

        if (validPatterns.length === 0) {
            alert("Por favor, configura al menos un patrón de programación válido con días y horas (formato HH:MM).");
            return;
        }
        options = {
            type: ScheduleType.SPECIFIC_DAYS,
            patterns: validPatterns
        };
    }
    onSchedulePost(options);
    setIsScheduling(false);
  };
  
  const actionButtonsDisabled = disabled || !isFacebookLinked;

  return (
    <div className="bg-gray-700/50 rounded-lg p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={onPostNow}
          disabled={actionButtonsDisabled}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition duration-200 text-center"
        >
          Publicar Ahora
        </button>
        <button
          onClick={() => setIsScheduling(!isScheduling)}
          disabled={actionButtonsDisabled}
          className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition duration-200 text-center"
        >
          {isScheduling ? 'Cancelar Programación' : 'Programar Publicación'}
        </button>
      </div>

      {isScheduling && (
        <div className="border-t border-gray-600 pt-4 space-y-4 animate-fade-in">
          {/* Tabs */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button 
              onClick={() => setScheduleType(ScheduleType.SPECIFIC_DAYS)}
              className={`w-full text-center py-2 rounded-md text-sm font-semibold transition-colors ${scheduleType === ScheduleType.SPECIFIC_DAYS ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
            >
              Días Específicos
            </button>
            <button 
              onClick={() => setScheduleType(ScheduleType.INTERVAL)}
              className={`w-full text-center py-2 rounded-md text-sm font-semibold transition-colors ${scheduleType === ScheduleType.INTERVAL ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
            >
              Por Intervalo
            </button>
          </div>
          
          {scheduleType === ScheduleType.INTERVAL && (
            <div className="space-y-4 p-2">
              <div className="flex items-center gap-4">
                <label htmlFor="frequency" className="text-sm font-medium text-gray-300 whitespace-nowrap">
                  Publicar cada
                </label>
                <input
                  type="number"
                  id="frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(Math.max(1, parseInt(e.target.value, 10)))}
                  className="w-24 bg-gray-900 border border-gray-600 rounded-md p-2 text-white text-center"
                />
                <span className="text-sm text-gray-300">minutos</span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="randomize"
                  checked={randomize}
                  onChange={(e) => setRandomize(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700"
                />
                <label htmlFor="randomize" className="text-sm font-medium text-gray-300">
                  Añadir retraso aleatorio (Recomendado)
                </label>
              </div>
            </div>
          )}

          {scheduleType === ScheduleType.SPECIFIC_DAYS && (
            <div className="space-y-4 p-2">
              {patterns.map((pattern, index) => (
                <div key={pattern.id} className="bg-gray-900/50 p-4 rounded-lg space-y-3 relative">
                  <p className="text-sm font-semibold text-gray-200">Patrón de Publicación #{index + 1}</p>
                   <button 
                      onClick={() => removePattern(pattern.id)} 
                      className="absolute top-2 right-2 text-gray-500 hover:text-red-400 transition-colors"
                      aria-label="Eliminar patrón"
                    >
                        <Icon name="trash" size={5} />
                    </button>
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-2">Días</label>
                    <div className="flex justify-start gap-1 sm:gap-2">
                      {weekDays.map(day => (
                        <button 
                          key={day.value}
                          onClick={() => handleDayToggle(pattern.id, day.value)}
                          className={`h-8 w-8 text-xs sm:h-9 sm:w-9 sm:text-sm rounded-full font-bold transition-colors ${pattern.days.includes(day.value) ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                   <div>
                    <label htmlFor={`times-${pattern.id}`} className="text-xs font-medium text-gray-400 block mb-2">Horas (HH:MM, separado por comas)</label>
                     <input
                      type="text"
                      id={`times-${pattern.id}`}
                      value={pattern.times.join(', ')}
                      onChange={(e) => handleTimesChange(pattern.id, e.target.value)}
                      placeholder="Ej: 08:00, 12:30, 19:00"
                      className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white text-sm"
                    />
                  </div>
                </div>
              ))}
               <button onClick={addPattern} className="w-full text-sm font-semibold text-blue-400 hover:text-blue-300 bg-gray-800 hover:bg-gray-700/50 py-2 px-4 rounded-md transition duration-200">
                    + Añadir Patrón de Publicación
                </button>
            </div>
          )}


          <button
            onClick={handleScheduleClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-200"
          >
            Confirmar Programación
          </button>
        </div>
      )}
    </div>
  );
};