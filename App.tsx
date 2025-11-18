import React, { useState, useCallback, useEffect } from 'react';
import { CreatePost } from './components/CreatePost';
import { Dashboard } from './components/Dashboard';
import { Content } from './components/Content';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import type { Post, ScheduledPost, ScheduleOptions, AppView, DayOfWeek } from './types';
import { PostStatus, ScheduleType } from './types';
import { postToFacebook } from './services/facebookService';

const calculateNextPublishTime = (schedule: ScheduleOptions, fromDate: Date = new Date()): Date => {
  if (schedule.type === ScheduleType.INTERVAL) {
    const startDate = new Date(fromDate.getTime() + 1000); 
    const delay = schedule.randomize
      ? schedule.frequencyMinutes * 0.8 + Math.random() * (schedule.frequencyMinutes * 0.4)
      : schedule.frequencyMinutes;
    return new Date(startDate.getTime() + delay * 60 * 1000);
  }

  if (schedule.type === ScheduleType.SPECIFIC_DAYS) {
    let earliestNextDate: Date | null = null;
    const searchFromDate = new Date(fromDate.getTime() + 1000);

    for (const pattern of schedule.patterns) {
        const sortedTimes = pattern.times.sort();
        const sortedDays = pattern.days.sort();
        if (sortedDays.length === 0 || sortedTimes.length === 0) continue;

        for (let i = 0; i < 14; i++) {
            const checkDate = new Date(searchFromDate);
            checkDate.setDate(searchFromDate.getDate() + i);
            const checkDay = checkDate.getDay() as DayOfWeek;

            if (sortedDays.includes(checkDay)) {
                for (const time of sortedTimes) {
                    const [hours, minutes] = time.split(':').map(Number);
                    const potentialDate = new Date(checkDate);
                    potentialDate.setHours(hours, minutes, 0, 0);

                    if (potentialDate > searchFromDate) {
                       if (!earliestNextDate || potentialDate < earliestNextDate) {
                           earliestNextDate = potentialDate;
                       }
                       break; 
                    }
                }
            }
            if (earliestNextDate && new Date(earliestNextDate).getDate() === checkDate.getDate()) {
                break;
            }
        }
    }
    
    if (earliestNextDate) {
        return earliestNextDate;
    }

    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + 7);
    return fallbackDate;
  }
  
  throw new Error("Unknown schedule type");
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('DASHBOARD');
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [history, setHistory] = useState<ScheduledPost[]>([]);
  const [isFacebookLinked, setIsFacebookLinked] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  const handleLinkFacebook = () => {
    setIsLinking(true);
    setTimeout(() => {
        setIsFacebookLinked(true);
        setIsLinking(false);
    }, 2000);
  };

  const handleSchedulePost = useCallback((post: Post, schedule: ScheduleOptions) => {
    if (!isFacebookLinked) return;
    const firstPublishAt = calculateNextPublishTime(schedule);
    
    const newScheduledPost: ScheduledPost = {
      id: Date.now(),
      post,
      schedule,
      status: PostStatus.SCHEDULED,
      publishAt: firstPublishAt,
    };
    setScheduledPosts(prev => [...prev, newScheduledPost].sort((a, b) => new Date(a.publishAt).getTime() - new Date(b.publishAt).getTime()));
    setView('CONTENT');
  }, [isFacebookLinked]);

  const handlePostNow = useCallback(async (post: Post) => {
    if (!isFacebookLinked) return;
    const newPost: ScheduledPost = {
      id: Date.now(),
      post,
      schedule: { type: ScheduleType.INTERVAL, frequencyMinutes: 0, randomize: false },
      status: PostStatus.PUBLISHING,
      publishAt: new Date(),
    };

    setHistory(prev => [newPost, ...prev]);
    setView('CONTENT');

    try {
      await postToFacebook(post);
      setHistory(prev => prev.map(p => p.id === newPost.id ? { ...p, status: PostStatus.PUBLISHED } : p));
    } catch (error) {
      console.error("Error al publicar:", error);
      setHistory(prev => prev.map(p => p.id === newPost.id ? { ...p, status: PostStatus.FAILED } : p));
    }
  }, [isFacebookLinked]);

  useEffect(() => {
    if (!isFacebookLinked) return;
    const interval = setInterval(() => {
      const now = new Date();
      scheduledPosts.forEach(async (p) => {
        if (p.status === PostStatus.SCHEDULED && new Date(p.publishAt) <= now) {
          
          setScheduledPosts(prev => prev.map(sp => sp.id === p.id ? {...sp, status: PostStatus.PUBLISHING} : sp));
          const historyPost = { ...p, status: PostStatus.PUBLISHING, publishAt: new Date() };
          setHistory(prev => [historyPost, ...prev]);

          try {
            await postToFacebook(p.post);
            setHistory(prev => prev.map(hp => hp.id === historyPost.id ? { ...hp, status: PostStatus.PUBLISHED } : hp));
            
            const nextPublishAt = calculateNextPublishTime(p.schedule, new Date());
            
            setScheduledPosts(prev => prev.map(sp => sp.id === p.id ? {
              ...sp,
              status: PostStatus.SCHEDULED,
              publishAt: nextPublishAt
            } : sp).sort((a, b) => new Date(a.publishAt).getTime() - new Date(b.publishAt).getTime()));

          } catch (error) {
            console.error("Error en publicación programada:", error);
            setHistory(prev => prev.map(hp => hp.id === historyPost.id ? { ...hp, status: PostStatus.FAILED } : hp));
            setScheduledPosts(prev => prev.map(sp => sp.id === p.id ? {...sp, status: PostStatus.FAILED} : sp));
          }
        }
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [scheduledPosts, isFacebookLinked]);

  const renderView = () => {
    switch(view) {
      case 'DASHBOARD':
        return <Dashboard scheduledPosts={scheduledPosts} history={history} createPost={() => setView('CREATE')} isFacebookLinked={isFacebookLinked} />;
      case 'CREATE':
        return <CreatePost onPostNow={handlePostNow} onSchedulePost={handleSchedulePost} isFacebookLinked={isFacebookLinked} />;
      case 'CONTENT':
        return <Content scheduledPosts={scheduledPosts} history={history} isFacebookLinked={isFacebookLinked} />;
      default:
        return <Dashboard scheduledPosts={scheduledPosts} history={history} createPost={() => setView('CREATE')} isFacebookLinked={isFacebookLinked} />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex">
      <Navigation 
        currentView={view} 
        setView={setView} 
        isFacebookLinked={isFacebookLinked} 
        isLinking={isLinking}
        onLinkFacebook={handleLinkFacebook} 
      />
      <div className="flex-1 flex flex-col">
        <Header view={view} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;