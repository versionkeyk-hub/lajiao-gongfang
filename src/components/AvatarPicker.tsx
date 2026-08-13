import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, RefreshCw, X, Check, SwitchCamera, User, Sparkles } from 'lucide-react';

export const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150'
];

interface AvatarPickerProps {
  currentAvatar?: string;
  userName?: string;
  onAvatarSelect: (avatarUrl: string) => void;
  className?: string;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  currentAvatar,
  userName = '',
  onAvatarSelect,
  className = ''
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraLoading(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Start Camera
  const startCamera = async (overrideFacing?: 'user' | 'environment') => {
    stopCamera();
    setCameraLoading(true);
    setCameraError('');
    setIsCameraActive(true);

    const targetFacing = overrideFacing || facingMode;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('当前浏览器环境不支持直接调用摄像头，请使用照片上传功能。');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 480 },
          height: { ideal: 480 }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }
      setCameraLoading(false);
    } catch (err: any) {
      console.warn('Camera failed:', err);
      setCameraLoading(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('获取相机权限失败，请在浏览器中开启允许，或直接点击相册上传。');
      } else {
        setCameraError(err.message || '相机开启失败，请直接选择相册图片。');
      }
    }
  };

  // Toggle Camera Facing
  const toggleFacing = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // Capture Photo from Camera
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Crop center square
      const minDim = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - minDim) / 2;
      const startY = (video.videoHeight - minDim) / 2;

      ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, 300, 300);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onAvatarSelect(dataUrl);
      stopCamera();
    }
  };

  // Process Uploaded File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, 300, 300);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onAvatarSelect(dataUrl);
        }
      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Current Avatar Display & Trigger Buttons */}
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md shadow-emerald-200 overflow-hidden flex items-center justify-center text-white font-extrabold text-2xl">
            {currentAvatar ? (
              <img src={currentAvatar} alt="用户头像" className="w-full h-full object-cover rounded-[14px]" />
            ) : (
              <span>{userName ? userName.slice(0, 1) : <User className="w-8 h-8" />}</span>
            )}
          </div>

          <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1.5 rounded-full shadow-md border-2 border-white group-hover:scale-110 transition-transform">
            <Camera className="w-3.5 h-3.5" />
          </div>
        </div>

        <p className="text-[11px] text-gray-400 font-medium">点击个人头像更换，或选择下方动作</p>

        {/* Action Buttons: Camera & Album */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => startCamera()}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200/80 transition-colors flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-600" />
            现场拍照
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold border border-gray-200 transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-gray-600" />
            相册选择
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Preset Avatars Row */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-gray-600 text-center">或快捷选用默认形象：</label>
        <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-1">
          {PRESET_AVATARS.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onAvatarSelect(url)}
              className={`w-8 h-8 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                currentAvatar === url
                  ? 'border-emerald-600 scale-110 shadow-xs ring-2 ring-emerald-300'
                  : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'
              }`}
            >
              <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* CAMERA CAPTURE MODAL / OVERLAY */}
      {isCameraActive && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-3xl max-w-xs w-full p-5 text-center space-y-4 border border-slate-700 shadow-2xl relative overflow-hidden text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="font-extrabold text-sm text-white">拍照拍摄个人头像</span>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1 rounded-full text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video preview container */}
            <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border-2 border-emerald-500/40 flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
              />

              {/* Center Portrait Guide circle */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-44 h-44 rounded-full border-2 border-dashed border-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.3)]" />
              </div>

              {cameraLoading && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
                  <span className="text-xs text-gray-300">正在请求开启相机...</span>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center space-y-2">
                  <p className="text-xs text-rose-300 font-bold">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      fileInputRef.current?.click();
                    }}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                  >
                    改为相册上传
                  </button>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={toggleFacing}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl text-xs font-bold border border-slate-700"
                title="切换前后镜头"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                disabled={cameraLoading || !!cameraError}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                拍摄并设为头像
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
