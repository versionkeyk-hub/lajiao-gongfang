import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, Check, Upload, AlertCircle, QrCode, Sparkles, SwitchCamera } from 'lucide-react';
import jsQR from 'jsqr';
import { Plant } from '../types';

interface CameraScannerModalProps {
  plant: Plant;
  onClose: () => void;
  onSuccessClaim: (plantId: number) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  plant,
  onClose,
  onSuccessClaim,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'active' | 'error' | 'success' | 'mismatch'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [mismatchMsg, setMismatchMsg] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scanStatusText, setScanStatusText] = useState<string>('正在扫描花盆上的二维码挂牌...');

  const animFrameId = useRef<number | null>(null);

  // Helper to parse scanned plant info from QR data
  const parsePlantFromQR = (data: string): { scannedId: number | null; scannedLabel: string } => {
    if (!data) return { scannedId: null, scannedLabel: '未知二维码' };

    try {
      const url = new URL(data);
      const pId = url.searchParams.get('plantId');
      if (pId) {
        const parsed = parseInt(pId, 10);
        if (!isNaN(parsed)) {
          return {
            scannedId: parsed,
            scannedLabel: `辣椒 #${parsed < 10 ? '0' + parsed : parsed}`,
          };
        }
      }
    } catch {
      // Not URL
    }

    const paramMatch = data.match(/plantId=(\d+)/i);
    if (paramMatch && paramMatch[1]) {
      const parsed = parseInt(paramMatch[1], 10);
      return {
        scannedId: parsed,
        scannedLabel: `辣椒 #${parsed < 10 ? '0' + parsed : parsed}`,
      };
    }

    const codeMatch = data.match(/(?:辣椒\s*#?|#)(\d+)/);
    if (codeMatch && codeMatch[1]) {
      const parsed = parseInt(codeMatch[1], 10);
      return {
        scannedId: parsed,
        scannedLabel: `辣椒 #${parsed < 10 ? '0' + parsed : parsed}`,
      };
    }

    if (/^\d+$/.test(data.trim())) {
      const parsed = parseInt(data.trim(), 10);
      return {
        scannedId: parsed,
        scannedLabel: `辣椒 #${parsed < 10 ? '0' + parsed : parsed}`,
      };
    }

    return { scannedId: null, scannedLabel: data.trim() };
  };

  // Stop camera tracks
  const stopCamera = () => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      stopCamera();
    };
  }, []);

  // Handle QR detection with STRICT MATCHING to target plant
  const handleQRDetected = (data: string) => {
    const { scannedId, scannedLabel } = parsePlantFromQR(data);

    // Check if target plant is ALREADY claimed by anyone
    if (plant.claimed || (plant.ownerName && plant.ownerName.trim() !== '')) {
      stopCamera();
      setCameraState('mismatch');
      setMismatchMsg(
        `已被认领锁死！植株【${plant.code}】已被【${plant.ownerName || '他人'}】认领绑定。每一个二维码挂牌与编号只能被领用绑定一次，无法重复认领！`
      );
      return;
    }

    // Check if scanned QR matches target plant
    const isMatched =
      (scannedId !== null && scannedId === plant.id) ||
      data.includes(plant.code) ||
      data.includes(`plantId=${plant.id}`);

    if (!isMatched) {
      stopCamera();
      setCameraState('mismatch');
      setMismatchMsg(
        `扫码不匹配！您刚才扫描的是【${scannedLabel}】的二维码挂牌。请对准【${plant.code}】号盆栽进行扫描！`
      );
      return;
    }

    stopCamera();
    setScannedData(data);
    setCameraState('success');
    setScanStatusText(`成功对准并锁定【${plant.code}】专属二维码挂牌！`);

    // Trigger success audio feedback
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Audio fallback silent
    }

    // Delayed unlock
    setTimeout(() => {
      onSuccessClaim(plant.id);
    }, 1200);
  };

  // Continuous frame scanning loop
  const tickScan = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvasRef.current = canvas;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          // Found QR code
          handleQRDetected(code.data);
          return;
        }
      }
    }
    animFrameId.current = requestAnimationFrame(tickScan);
  };

  // Start Camera Stream
  const startCamera = async (overrideFacing?: 'environment' | 'user') => {
    stopCamera();
    setCameraState('starting');
    setErrorMsg('');

    const targetFacing = overrideFacing || facingMode;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('当前浏览器环境不支持直接调用摄像头，请通过图片识别功能上传二维码。');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraState('active');
        animFrameId.current = requestAnimationFrame(tickScan);
      }
    } catch (err: any) {
      console.warn('Camera access failed:', err);
      setCameraState('error');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('您未授予摄像头访问权限。请在浏览器设置中开启摄像头访问许可，或上传二维码图片识别。');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('未找到可用的摄像头设备。请使用照片文件识别功能。');
      } else {
        setErrorMsg(err.message || '摄像头启动失败，请检查设置或使用图片扫描。');
      }
    }
  };

  // Switch front/back camera
  const toggleCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    if (cameraState === 'active' || cameraState === 'error') {
      startCamera(nextFacing);
    }
  };

  // Handle uploaded QR image file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleQRDetected(code.data);
          } else {
            alert('未能从上传的图片中识别出有效二维码，请上传包含花盆二维码的清晰照片！');
          }
        }
      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 touch-none"
      onClick={() => {
        stopCamera();
        onClose();
      }}
    >
      <div
        className="bg-slate-900 rounded-3xl max-w-sm w-full p-5 text-center space-y-4 border border-slate-700 shadow-2xl relative overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h3 className="font-extrabold text-sm text-white">扫描【{plant.code}】二维码</h3>
              <p className="text-[10px] text-emerald-400">请对准花盆上的专属挂牌进行解锁</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-slate-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CAMERA PREVIEW & VIEWFINDER AREA */}
        <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border-2 border-emerald-500/40 flex items-center justify-center group shadow-inner">
          {/* Live Video element */}
          <video
            ref={videoRef}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              cameraState === 'active' ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Hidden Canvas for QR parsing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* IDLE / BEFORE CAMERA STARTS */}
          {cameraState === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-950/90">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <QrCode className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-200">准备开启相机扫描</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  将开启您的设备摄像头，扫描悬挂于【{plant.location}】花盆上的二维码挂牌
                </p>
              </div>
              <button
                onClick={() => startCamera()}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" />
                开启相机镜头
              </button>
            </div>
          )}

          {/* STARTING STATE */}
          {cameraState === 'starting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-950/90 space-y-2">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-gray-300 font-medium">正在请求并打开相机镜头...</p>
            </div>
          )}

          {/* SCANNING ACTIVE OVERLAY */}
          {cameraState === 'active' && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
              {/* Scan Reticle frame */}
              <div className="relative w-52 h-52 border-2 border-dashed border-emerald-400 rounded-2xl shadow-[0_0_15px_rgba(52,211,153,0.3)] flex items-center justify-center overflow-hidden">
                {/* Moving Scan Laser Line */}
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#34d399] animate-[ping_2s_infinite]" />
                <div className="w-full h-0.5 bg-emerald-400/90 shadow-[0_0_8px_#34d399] absolute top-1/2 -translate-y-1/2 animate-[bounce_1.5s_infinite]" />
                
                {/* Frame corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
              </div>

              <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                对准花盆二维码挂牌
              </div>
            </div>
          )}

          {/* SUCCESS STATE */}
          {cameraState === 'success' && (
            <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3 animate-in zoom-in-90 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/50">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-emerald-200">扫码识别成功！</h4>
                <p className="text-xs text-emerald-300/90 mt-1 font-medium">{scanStatusText}</p>
              </div>
              <div className="text-[11px] text-emerald-400/80 bg-emerald-900/60 px-3 py-1.5 rounded-lg border border-emerald-700/50 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                正在完成【{plant.code}】植株解绑与名下登记...
              </div>
            </div>
          )}

          {/* MISMATCH / WRONG PLANT QR STATE */}
          {cameraState === 'mismatch' && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-5 text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shadow-lg shadow-rose-950">
                <X className="w-8 h-8 stroke-[3]" />
              </div>
              <div className="space-y-1.5 px-2">
                <h4 className="text-sm font-extrabold text-rose-300">二维码不匹配提醒</h4>
                <p className="text-xs text-gray-200 leading-relaxed font-medium bg-rose-950/50 p-3 rounded-xl border border-rose-800/40">
                  {mismatchMsg}
                </p>
              </div>

              <div className="pt-2 w-full space-y-2">
                <button
                  onClick={() => startCamera()}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Camera className="w-4 h-4" /> 重新对准【{plant.code}】拍摄扫描
                </button>
                <button
                  onClick={() => handleQRDetected(`https://xiao-wa-plant.app/?plantId=${plant.id}`)}
                  className="w-full py-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" /> 确认已对准【{plant.code}】挂牌
                </button>
              </div>
            </div>
          )}

          {/* ERROR / PERMISSION DENIED STATE */}
          {cameraState === 'error' && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-5 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-400" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-200">摄像头开启提醒</p>
                <p className="text-[11px] text-gray-300 leading-relaxed px-2">{errorMsg}</p>
              </div>

              <div className="pt-2 w-full space-y-2">
                <button
                  onClick={() => startCamera()}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> 重新尝试开启相机
                </button>
                <button
                  onClick={() => handleQRDetected(`https://xiao-wa-plant.app/?plantId=${plant.id}`)}
                  className="w-full py-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" /> 模拟扫码（已对准实体挂牌）
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="space-y-2 pt-1">
          <div className="flex gap-2">
            {cameraState === 'active' && (
              <button
                onClick={toggleCamera}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-slate-700"
              >
                <SwitchCamera className="w-3.5 h-3.5" /> 切换镜头
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-500/30"
            >
              <Upload className="w-3.5 h-3.5" /> 选择二维码照片识别
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <p className="text-[10px] text-gray-400 leading-snug">
            💡 放置在【{plant.location}】的【{plant.code}】花盆挂牌印有专属二维码
          </p>
        </div>
      </div>
    </div>
  );
};
