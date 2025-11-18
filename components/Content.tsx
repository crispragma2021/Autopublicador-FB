import React, { useState } from 'react';
import type { ScheduledPost } from '../types';
import { PostStatus } from '../types';
import { Icon } from './Icon';
import { Spinner } from './Spinner';
import { ContentCalendar } from './ContentCalendar';
import { ConnectOverlay } from './ConnectOverlay';

interface ContentProps {
  scheduledPosts: ScheduledPost[];
  history: ScheduledPost[];
  isFacebookLinked: boolean;
}

type ContentTab = 'CALENDAR' | 'SCHEDULED' | 'HISTORY';

const statusIndicator: Record<PostStatus, React.ReactNode> = {
  [PostStatus.SCHEDULED]: <Icon name="clock" className="text-yellow-400" size={5} />,
  [PostStatus.PUBLISHING]: <Spinner size={5} />,
  [PostStatus.PUBLISHED]: <Icon name="check" className="text-green-400" size={5} />,
  [PostStatus.FAILED]: <Icon name="x" className="text-red-400" size={5} />,
};

const PostItem: React.FC<{ post: ScheduledPost }> = ({ post }) => {
  const textSnippet = post.post.text.substring(0, 80) + (post.post.text.length > 80 ? '...' : '');
  const publishDate = new Date(post.publishAt);

  return (
    <li className="flex items-center justify-between p-3 bg-gray-800/50 rounded-md hover:bg-gray-700/50 transition-colors duration-200">
      <div className="flex items-center gap-4 overflow-hidden">
        {statusIndicator[post.status]}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{textSnippet || "Publicación con multimedia"}</p>
          <p className="text-xs text-gray-400">
            {post.status === PostStatus.SCHEDULED ? 'Próxima publicación: ' : 'Publicado: '} 
            {publishDate.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
      </div>
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
        post.status === PostStatus.SCHEDULED ? 'bg-yellow-500/20 text-yellow-300' :
        post.status === PostStatus.PUBLISHING ? 'bg-blue-500/20 text-blue-300' :
        post.status === PostStatus.PUBLISHED ? 'bg-green-500/20 text-green-300' :
        'bg-red-500/20 text-red-300'
      }`}>
        {post.status}
      </span>
    </li>
  );
};

const PostList: React.FC<{posts: ScheduledPost[], emptyMessage: string}> = ({posts, emptyMessage}) => (
    <div className="space-y-2 mt-4 max-h-[calc(100vh-20rem)] overflow-y-auto scrollbar-hide pr-2">
      {posts.length > 0 ? (
        posts.map(p => <PostItem key={p.id} post={p} />)
      ) : (
        <div className="text-center py-20 text-gray-500">{emptyMessage}</div>
      )}
    </div>
);


export const Content: React.FC<ContentProps> = ({ scheduledPosts, history, isFacebookLinked }) => {
  const [activeTab, setActiveTab] = useState<ContentTab>('CALENDAR');
  
  const tabs: {id: ContentTab, label: string, icon: string}[] = [
      { id: 'CALENDAR', label: 'Calendario', icon: 'calendar'},
      { id: 'SCHEDULED', label: 'Programadas', icon: 'clock'},
      { id: 'HISTORY', label: 'Historial', icon: 'history'},
  ]

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 h-full flex flex-col relative">
        {!isFacebookLinked && <ConnectOverlay />}
        {/* Tabs */}
        <div className="flex border-b border-gray-700">
            {tabs.map(tab => (
                 <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === tab.id ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    <Icon name={tab.icon} size={5} />
                    {tab.label}
                </button>
            ))}
        </div>
        <div className="mt-6 flex-1">
            {activeTab === 'CALENDAR' && <ContentCalendar posts={[...scheduledPosts, ...history]} />}
            {activeTab === 'SCHEDULED' && <PostList posts={scheduledPosts} emptyMessage="No hay publicaciones programadas." />}
            {activeTab === 'HISTORY' && <PostList posts={history} emptyMessage="El historial de publicaciones aparecerá aquí." />}
        </div>
    </div>
  );
};