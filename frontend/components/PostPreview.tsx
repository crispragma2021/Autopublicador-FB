import React, { useEffect, useRef, useState } from 'react';
import type { Post } from '../types';
import { PostType } from '../types';
import { Icon } from './Icon';

interface PostPreviewProps {
  post: Post;
  editable?: boolean;
  onTextChange?: (text: string) => void;
  onClearMedia?: () => void;
}

export const PostPreview: React.FC<PostPreviewProps> = ({ 
    post, 
    editable = false, 
    onTextChange, 
    onClearMedia 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
      if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      }
  }, [post.text]);

  const mediaCount = post.media?.length || 0;

  const getGridClass = () => {
      if (mediaCount === 1) return 'grid-cols-1';
      if (mediaCount === 2) return 'grid-cols-2';
      if (mediaCount >= 3) return 'grid-cols-2'; 
      return 'grid-cols-1';
  };

  const FB_CARD_BG = 'bg-[#242526]';
  const FB_TEXT_SEC = 'text-[#B0B3B8]';
  const FB_BORDER = 'border-[#3E4042]';

  const handleShareAction = (action: string) => {
      alert(`Acción simulada: ${action}`);
      setShowShareMenu(false);
  };

  return (
    <div className={`${FB_CARD_BG} rounded-lg w-full shadow-sm border ${FB_BORDER} font-sans overflow-hidden`}>
      <div className="p-3 flex items-start">
        <div className="relative">
            <img className="h-10 w-10 rounded-full border border-slate-700" src="https://picsum.photos/100/100" alt="User avatar" />
            {post.placements?.instagram && (
                <div className="absolute -bottom-1 -right-1 bg-pink-600 rounded-full p-0.5 border border-[#242526]">
                    <Icon name="instagram" size={2} className="text-white"/>
                </div>
            )}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-[15px] font-semibold text-[#E4E6EB] leading-snug cursor-pointer hover:underline">Tu Página Oficial</p>
          <div className={`flex items-center gap-1 text-[13px] ${FB_TEXT_SEC}`}>
             <span>Justo ahora</span>
             <span>·</span>
             <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                 <title>Público</title>
                 <g transform="translate(-448 -544)"><path d="M455 556.5a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-2z"></path><path d="M456 544a8 8 0 1 0 8 8 8 8 0 0 0-8-8zm0 14.5a6.5 6.5 0 1 1 6.5-6.5 6.5 6.5 0 0 1-6.5 6.5z"></path><path d="M454.5 551h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5z"></path></g>
             </svg>
          </div>
        </div>
        <div className={FB_TEXT_SEC}>
             <Icon name="menu" size={5} />
        </div>
      </div>

      <div className="px-3 pb-3">
          {editable && onTextChange ? (
              <textarea
                ref={textareaRef}
                value={post.text}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="Escribe algo..."
                className="w-full bg-transparent border-none p-0 text-[#E4E6EB] text-[15px] leading-normal placeholder-[#B0B3B8] resize-none focus:ring-0 focus:outline-none min-h-[40px]"
                rows={post.text ? 1 : 2}
              />
          ) : (
             <p className="text-[#E4E6EB] whitespace-pre-wrap text-[15px] leading-normal">{post.text || "..."}</p>
          )}
      </div>

      {mediaCount > 0 ? (
        <div className={`relative group/media bg-black grid gap-0.5 ${getGridClass()}`}>
          {post.media.map((item, index) => {
              if (item.type === PostType.VIDEO) {
                  return (
                      <video key={item.id} src={item.url} controls className="w-full h-auto max-h-[500px] col-span-full" />
                  );
              }
              
              if (mediaCount > 3 && index === 2) {
                  return (
                       <div key={item.id} className="relative h-48 bg-gray-800">
                            <img src={item.url} alt="Preview" className="w-full h-full object-cover opacity-60" />
                            <div className="absolute inset-0 flex items-center justify-center text-3xl font-medium text-white">
                                +{mediaCount - 3}
                            </div>
                       </div>
                  );
              }
              if (mediaCount > 3 && index > 2) return null;

              return (
                 <div key={item.id} className={`relative ${mediaCount === 3 && index === 0 ? 'col-span-2' : ''}`}>
                     <img src={item.url} alt="Preview" className="w-full h-64 object-cover" />
                 </div>
              );
          })}

          {editable && onClearMedia && (
              <div className="absolute top-3 right-3 opacity-0 group-hover/media:opacity-100 transition-opacity z-20">
                  <button 
                    onClick={onClearMedia}
                    className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition-colors border border-white/20"
                  >
                      <Icon name="x" size={5} />
                  </button>
              </div>
          )}
        </div>
      ) : null}

      <div className="px-3 py-1 border-t border-[#3E4042]">
           <div className="flex items-center justify-between text-[#B0B3B8] py-1">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-500 rounded-full p-0.5"><svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm-1-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg></div>
                    <span className="text-[13px]">Tú y 15 personas más</span>
                </div>
                <div className="text-[13px]">
                    1 comentario
                </div>
           </div>
      </div>
      <div className="px-2 border-t border-[#3E4042] flex items-center text-[#B0B3B8] font-medium h-10 relative">
          <button className="flex-1 flex items-center justify-center gap-2 hover:bg-[#3A3B3C] rounded h-8 transition-colors">
             <span className="text-[15px]">Me gusta</span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 hover:bg-[#3A3B3C] rounded h-8 transition-colors">
             <span className="text-[15px]">Comentar</span>
          </button>
          <div className="relative flex-1">
            <button 
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="w-full flex items-center justify-center gap-2 hover:bg-[#3A3B3C] rounded h-8 transition-colors"
            >
                <span className="text-[15px]">Compartir</span>
            </button>
            
            {showShareMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-56 bg-[#242526] border border-[#3E4042] rounded-lg shadow-xl z-30 overflow-hidden">
                    <button onClick={() => handleShareAction('Compartir ahora (Público)')} className="w-full text-left px-4 py-3 text-[#E4E6EB] text-sm hover:bg-[#3A3B3C] flex items-center gap-3">
                        <Icon name="rocket" size={4} className="text-white"/> Compartir ahora (Público)
                    </button>
                    <button onClick={() => handleShareAction('Enviar por Messenger')} className="w-full text-left px-4 py-3 text-[#E4E6EB] text-sm hover:bg-[#3A3B3C] flex items-center gap-3">
                        <div className="bg-blue-500 rounded-full p-1"><Icon name="text" size={2} className="text-white"/></div> Enviar por Messenger
                    </button>
                    <button onClick={() => handleShareAction('Compartir en un grupo')} className="w-full text-left px-4 py-3 text-[#E4E6EB] text-sm hover:bg-[#3A3B3C] flex items-center gap-3">
                        <Icon name="users" size={4} className="text-white"/> Compartir en un grupo
                    </button>
                    <div className="border-t border-[#3E4042] my-1"></div>
                    <button onClick={() => handleShareAction('Copiar enlace')} className="w-full text-left px-4 py-3 text-[#E4E6EB] text-sm hover:bg-[#3A3B3C] flex items-center gap-3">
                         Copiar enlace
                    </button>
                </div>
            )}
          </div>
      </div>
    </div>
  );
};
