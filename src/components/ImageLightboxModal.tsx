import React from 'react';
import { X, ExternalLink } from 'lucide-react';

interface ImageLightboxModalProps {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  imageUrl,
  title,
  onClose,
}) => {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        className="w-full max-w-4xl flex items-center justify-between text-white z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="truncate max-w-[70%]">
          <h4 className="font-extrabold text-sm sm:text-base text-gray-100 truncate">
            {title || '查看大图原图'}
          </h4>
          <p className="text-[11px] text-gray-400">点击任意空白区域或右上角关闭按钮退出预览</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center gap-1 text-xs font-bold px-3"
            title="在新标签页中打开原图"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">新窗口打开原图</span>
          </a>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            title="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image View */}
      <div
        className="flex-1 w-full max-w-4xl flex items-center justify-center my-3 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={title || '查看原图'}
          className="max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10 select-none animate-in zoom-in-95 duration-200"
        />
      </div>

      {/* Bottom Hint */}
      <div className="text-center text-xs text-gray-400 font-medium z-10">
        🔍 提示：如在移动端或浏览窗口中，可手势捏合或在新标签页中查看最大尺寸原图
      </div>
    </div>
  );
};
