import React from 'react';
import { Icon } from './Icon';
import { MetricCard } from './MetricCard';
import type { ScheduledPost } from '../types';
import { PostStatus } from '../types';
import { WarningBanner } from './WarningBanner';

interface DashboardProps {
  scheduledPosts: ScheduledPost[];
  history: ScheduledPost[];
  createPost: () => void;
  isFacebookLinked: boolean;
}

const PostItem: React.FC<{ post: ScheduledPost }> = ({ post }) => {
  const textSnippet = post.post.text.substring(0, 50) + (post.post.text.length > 50 ? '...' : '');
  const publishDate = new Date(post.publishAt);

  return (
    <li className="flex items-center justify-between py-2 border-b border-gray-700/50">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{textSnippet || "Publicación con multimedia"}</p>
        <p className="text-xs text-gray-400">
          {publishDate.toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
        post.status === PostStatus.SCHEDULED ? 'bg-yellow-500/20 text-yellow-300' :
        post.status === PostStatus.PUBLISHED ? 'bg-green-500/20 text-green-300' :
        'bg-red-500/20 text-red-300'
      }`}>
        {post.status}
      </span>
    </li>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ scheduledPosts, history, createPost, isFacebookLinked }) => {
    const upcomingPosts = scheduledPosts.filter(p => p.status === PostStatus.SCHEDULED).slice(0, 5);
    const recentActivity = history.slice(0, 5);

  return (
    <div className="space-y-8">
        {!isFacebookLinked && (
            <div className="bg-blue-900/50 border border-blue-600 text-blue-200 px-4 py-3 rounded-lg relative" role="alert">
                <strong className="font-bold">¡Bienvenido! </strong>
                <span className="block sm:inline">Para empezar, vincula tu cuenta de Facebook desde el panel de navegación.</span>
            </div>
        )}
        <WarningBanner />

        {/* Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard title="Alcance Total" value="75.3K" change="+12.5%" isPositive />
            <MetricCard title="Interacciones" value="4.8K" change="+8.2%" isPositive />
            <MetricCard title="Nuevos Seguidores" value="281" change="-2.1%" />
            <MetricCard title="Tasa de Clics" value="3.4%" change="+0.5%" isPositive />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Próximas Publicaciones */}
            <div className="bg-gray-800 rounded-lg shadow-xl p-6">
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Icon name="clock" /> Próximamente
                </h3>
                {upcomingPosts.length > 0 ? (
                    <ul className="space-y-2">
                        {upcomingPosts.map(p => <PostItem key={p.id} post={p} />)}
                    </ul>
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        <p className="mb-4">No hay publicaciones en la cola.</p>
                        <button onClick={createPost} disabled={!isFacebookLinked} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition duration-200">
                            Crear una ahora
                        </button>
                    </div>
                )}
            </div>

            {/* Actividad Reciente */}
             <div className="bg-gray-800 rounded-lg shadow-xl p-6">
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Icon name="history" /> Actividad Reciente
                </h3>
                {recentActivity.length > 0 ? (
                    <ul className="space-y-2">
                        {recentActivity.map(p => <PostItem key={p.id} post={p} />)}
                    </ul>
                ) : (
                    <div className="text-center py-10 text-gray-500">
                       <p>No hay actividad reciente.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};