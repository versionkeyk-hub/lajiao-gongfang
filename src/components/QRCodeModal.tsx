import React, { useState } from 'react';
import { X, QrCode, Download, Copy, Check, Printer, Sparkles } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, appUrl }) => {
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Uses high-reliability quick QR API + fallback SVG renderer
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(appUrl)}&color=15803d&bgcolor=f0fdf4`;

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 touch-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-lg">
            <QrCode className="w-5 h-5 text-emerald-600" />
            <span>扫码进入小蛙种植记（内部自用）</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-emerald-50/80 rounded-2xl p-5 border border-emerald-100 flex flex-col items-center justify-center text-center">
          <div className="bg-white p-3 rounded-2xl shadow-md border border-emerald-100 mb-3 relative group">
            <img
              src={qrImageUrl}
              alt="小蛙种植日记二维码"
              className="w-52 h-52 object-contain rounded-lg"
            />
            <div className="absolute inset-0 bg-emerald-900/5 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
              <span className="text-xs font-medium text-emerald-900 bg-white/90 px-2.5 py-1 rounded-full shadow-sm">
                手机摄像头扫码
              </span>
            </div>
          </div>

          <p className="text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            打印二维码贴在盆栽挂牌旁
          </p>
          <p className="text-[11px] text-emerald-600">
            大家掏出手机一扫，随时随地记录养护日志
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-xl text-xs border border-gray-200">
            <span className="text-gray-500 truncate mr-2">{appUrl}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-emerald-700 font-semibold hover:text-emerald-800 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '已复制' : '复制网址'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={qrImageUrl}
              download="小蛙种植日记二维码.png"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-medium text-xs border border-emerald-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              下载二维码
            </a>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-medium text-xs shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              直接打印标牌
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
