import React from 'react';
import { Icon } from './Icon';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  isPositive?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, isPositive = false }) => {
  const changeColor = isPositive ? 'text-green-400' : 'text-red-400';
  const ChangeIcon = isPositive ? 'analyticsUp' : 'analyticsDown';
    
  return (
    <div className="bg-gray-800 p-5 rounded-lg shadow-lg border border-gray-700/50">
      <p className="text-sm text-gray-400 font-medium">{title}</p>
      <div className="mt-2 flex items-baseline justify-between">
        <p className="text-3xl font-bold text-white">{value}</p>
        <div className={`flex items-center text-sm font-semibold ${changeColor}`}>
           <Icon name={ChangeIcon} size={4} className="mr-1"/>
           <span>{change}</span>
        </div>
      </div>
    </div>
  );
};
