
import React, { useState } from 'react';
import type { ScheduledPost } from '../types';
import { PostStatus } from '../types';

interface ContentCalendarProps {
  posts: ScheduledPost[];
}

export const ContentCalendar: React.FC<ContentCalendarProps> = ({ posts }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const postsByDay: { [key: number]: ScheduledPost[] } = {};
  posts.forEach(post => {
    const postDate = new Date(post.publishAt);
    if (postDate.getFullYear() === currentDate.getFullYear() && postDate.getMonth() === currentDate.getMonth()) {
      const day = postDate.getDate();
      if (!postsByDay[day]) {
        postsByDay[day] = [];
      }
      postsByDay[day].push(post);
    }
  });

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: startDay }, (_, i) => i);
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="bg-slate-800/50 p-3 sm:p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)} className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600">&lt;</button>
        <h3 className="text-base sm:text-lg font-bold text-white">
          {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
        </h3>
        <button onClick={() => changeMonth(1)} className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600">&gt;</button>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map(day => <div key={day} className="text-center text-[10px] sm:text-xs font-bold text-slate-400">{day}</div>)}
        {blanks.map(b => <div key={`blank-${b}`} />)}
        {days.map(day => (
          <div key={day} className="relative aspect-square bg-slate-900/50 rounded p-1 sm:p-1.5 text-xs sm:text-sm text-left align-top">
            <span className={new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() ? "bg-blue-600 rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center text-white text-[10px] sm:text-xs" : ""}>
                {day}
            </span>
            {postsByDay[day] && (
              <div className="absolute bottom-1 left-1 sm:bottom-1.5 sm:left-1.5 flex gap-0.5 sm:gap-1 flex-wrap">
                {postsByDay[day].slice(0, 4).map(post => {
                  let color = 'bg-slate-500';
                  if (post.status === PostStatus.SCHEDULED) color = 'bg-yellow-400';
                  if (post.status === PostStatus.PUBLISHED) color = 'bg-green-400';
                  if (post.status === PostStatus.FAILED) color = 'bg-red-400';
                  return <div key={post.id} className={`h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full ${color}`} title={post.status}></div>
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
