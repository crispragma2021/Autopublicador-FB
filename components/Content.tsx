
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
  onEditPost: (post: ScheduledPost) => void;
  onBack: () => void;
}

type ContentTab = 'CALENDAR' | 'SCHEDULED' | 'HISTORY';

const statusIndicator: Record<PostStatus, React.ReactNode> = {
  [PostStatus.SCHEDULED]: <Icon name="clock" className="text-yellow-400" size={5} />,
  [PostStatus.PUBLISHING]: <Spinner size={5} />,
  [PostStatus.PUBLISHED]: <Icon name="check" className="text-green-400" size={5} />,
  [PostStatus.FAILED]: <Icon name="x" className="text-red-400" size={5} />,
};

const PostItem: React.FC<{ post: ScheduledPost, onEdit: (p: ScheduledPost) => void }> = ({ post, onEdit }) => {
  const textSnippet = post.post.text.substring(0, 80) + (post.post.text.length > 80 ? '...' : '');
  const publishDate = new Date(post.publishAt);

  return (
    <li className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-700/50 rounded-lg hover:bg-slate-800 hover:border-slate-600 transition-all duration-200 group">
      <div className="flex items-center gap-4 overflow-hidden">
        <div className="bg-slate-800 p-2 rounded-full border border-slate-700 group-hover:border-slate-600">
            {statusIndicator[post.status]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 group-hover:text-white truncate">{textSnippet || "Publicación con multimedia"}</p>
          <p className="text-xs text-slate-500 group-hover:text-slate-400 mt-0.5">
            {post.status === PostStatus.SCHEDULED ? 'Programado para: ' : 'Fecha: '} 
            {publishDate.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
            post.status === PostStatus.SCHEDULED ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
            post.status === PostStatus.PUBLISHING ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            post.status === PostStatus.PUBLISHED ? 'bg-green-500/10 text-green-400 border-green-500/20' :
            'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {post.status}
          </span>
          {post.status === PostStatus.SCHEDULED && (
              <button 
                onClick={() => onEdit(post)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-blue-400 p-2 rounded-lg transition-colors"
                title="Editar"
              >
                  <Icon name="create" size={4} />
              </button>
          )}
      </div>
    </li>
  );
};

const PostList: React.FC<{posts: ScheduledPost[], emptyMessage: string, onEdit: (p: ScheduledPost) => void}> = ({posts, emptyMessage, onEdit}) => (
    <div className="space-y-3 mt-4 max-h-[calc(100vh-20rem)] overflow-y-auto pr-2 custom-scrollbar">
      {posts.length > 0 ? (
        posts.map(p => <PostItem key={p.id} post={p} onEdit={onEdit} />)
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-900/20">
            <Icon name="create" size={10} className="text-slate-600 mb-4 opacity-50" />
            <p>{emptyMessage}</p>
        </div>
      )}
    </div>
);


export const Content: React.FC<ContentProps> = ({ scheduledPosts, history, isFacebookLinked, onEditPost, onBack }) => {
  const [activeTab, setActiveTab] = useState<ContentTab>('CALENDAR');
  
  const tabs: {id: ContentTab, label: string, icon: string}[] = [
      { id: 'CALENDAR', label: 'Calendario', icon: 'calendar'},
      { id: 'SCHEDULED', label: 'Programadas', icon: 'clock'},
      { id: 'HISTORY', label: 'Historial', icon: 'history'},
  ]

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl p-6 h-full flex flex-col relative overflow-hidden">
        {!isFacebookLinked && <ConnectOverlay />}
        
        {/* Header with Back button and Tabs */}
        <div className="flex items-center border-b border-slate-700 pb-1 gap-2">
            <button 
                onClick={onBack}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
                title="Volver al Panel"
            >
                <Icon name="arrowLeft" size={5} />
            </button>
            <div className="w-px h-6 bg-slate-700 mx-1 shrink-0"></div>
            <div className="flex gap-2 overflow-x-auto custom-scrollbar flex-1">
                {tabs.map(tab => (
                     <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-t-lg transition-all whitespace-nowrap relative top-[1px] ${
                            activeTab === tab.id 
                            ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-500' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                    >
                        <Icon name={tab.icon} size={5} />
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
        
        <div className="mt-6 flex-1 min-h-0">
            {activeTab === 'CALENDAR' && <ContentCalendar posts={[...scheduledPosts, ...history]} />}
            {activeTab === 'SCHEDULED' && <PostList posts={scheduledPosts} emptyMessage="No hay publicaciones programadas." onEdit={onEditPost} />}
            {activeTab === 'HISTORY' && <PostList posts={history} emptyMessage="El historial de publicaciones aparecerá aquí." onEdit={() => {}} />}
        </div>
    </div>
  );
};
