
import React from 'react';
import type { Post } from '../types';
import { PostType } from '../types';

interface PostPreviewProps {
  post: Post;
}

export const PostPreview: React.FC<PostPreviewProps> = ({ post }) => {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 w-full">
      <div className="flex items-center mb-4">
        <img className="h-10 w-10 rounded-full" src="https://picsum.photos/100/100" alt="User avatar" />
        <div className="ml-3">
          <p className="text-sm font-semibold text-white">Tu Página</p>
          <p className="text-xs text-gray-400">Ahora mismo · 🌎</p>
        </div>
      </div>

      {post.text && (
        <p className="text-gray-200 whitespace-pre-wrap mb-4">{post.text}</p>
      )}

      {post.media && (
        <div className="rounded-lg overflow-hidden border border-gray-700">
          {post.media.type === PostType.IMAGE ? (
            <img src={post.media.url} alt="Vista previa" className="w-full h-auto object-cover" />
          ) : (
            <video src={post.media.url} controls className="w-full h-auto" />
          )}
        </div>
      )}

      {!post.text && !post.media && (
          <div className="text-center py-10 text-gray-500">
            <p>La vista previa de tu publicación aparecerá aquí.</p>
          </div>
      )}
    </div>
  );
};
