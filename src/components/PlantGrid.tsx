import React, { useState } from 'react';
import { MapPin, Droplets, Sparkles, User, Eye, Gift, QrCode, Check, Camera, RefreshCw } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Plant, CareLog, PRESET_LOCATIONS } from '../types';
import { CameraScannerModal } from './CameraScannerModal';

interface PlantGridProps {
  plants: Plant[];
  logs?: CareLog[];
  currentUserName: string;
  onOpenPlantDetail: (plantId: number) => void;
  onQuickCareForPlant: (plantId: number, actionType: '浇水' | '施肥' | '成长拍照') => void;
  onQuickLog: (plantId: number) => void;
  onClaimPlant: (plantId: number) => void;
  onTransferPlant: (plant: Plant) => void;
  onPreviewImage?: (url: string, title?: string) => void;
}

export const PlantGrid: React.FC<PlantGridProps> = ({
  plants,
  logs = [],
  currentUserName,
  onOpenPlantDetail,
  onQuickCareForPlant,
  onQuickLog,
  onClaimPlant,
  onTransferPlant,
  onPreviewImage,
}) => {
  const [filterLocation, setFilterLocation] = useState<string>('全部');
  const [filterHealth, setFilterHealth] = useState<string>('全部');
  const [claimingPlant, setClaimingPlant] = useState<Plant | null>(null);
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  // Helper to build plant URL for QR Code
  const getPlantQrUrl = (plantId: number) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0].split('#')[0] : '';
    return `${baseUrl}?plantId=${plantId}`;
  };

  // Filter logic
  const filteredPlants = plants.filter(p => {
    if (filterLocation !== '全部' && p.location !== filterLocation) return false;
    if (filterHealth !== '全部' && p.health !== filterHealth) return false;
    return true;
  });

  const handleConfirmClaim = (plantId: number) => {
    onClaimPlant(plantId);
    setClaimingPlant(null);
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Filter Chips */}
      <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-gray-800">
          <span>筛选养护区域：</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilterLocation('全部')}
            className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 border transition-all ${
              filterLocation === '全部'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            全部区域 ({plants.length})
          </button>

          {PRESET_LOCATIONS.map(loc => {
            const count = plants.filter(p => p.location === loc).length;
            return (
              <button
                key={loc}
                onClick={() => setFilterLocation(loc)}
                className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 border transition-all ${
                  filterLocation === loc
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {loc} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredPlants.map(plant => {
          const isMyPlant = plant.ownerName === currentUserName || plant.owners?.includes(currentUserName);

          // Find the absolute latest photo uploaded for this plant from care logs if available
          const latestLogPhoto = (() => {
            if (!Array.isArray(logs) || logs.length === 0) return null;
            const plantLogsWithPhoto = logs.filter(l => 
              l.photo && 
              l.photo.trim() !== '' && 
              l.plantIds && 
              Array.isArray(l.plantIds) && 
              (l.plantIds.includes(plant.id) || l.plantIds.some(pid => String(pid) === String(plant.id)))
            );
            if (plantLogsWithPhoto.length === 0) return null;
            plantLogsWithPhoto.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return plantLogsWithPhoto[0].photo || null;
          })();

          const displayPhoto = latestLogPhoto || plant.avatar || '';

          return (
            <div
              key={plant.id}
              className={`bg-white rounded-3xl p-4 border transition-all duration-200 shadow-sm flex flex-col justify-between space-y-3 relative overflow-hidden ${
                isMyPlant ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-emerald-100 hover:border-emerald-200'
              }`}
            >
              {isMyPlant && (
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-bl-2xl shadow-xs">
                  我的植株
                </div>
              )}

              <div className="flex items-start gap-3">
                {/* Plant Thumbnail */}
                <div
                  className="relative shrink-0 cursor-pointer group"
                  onClick={() => onPreviewImage ? onPreviewImage(displayPhoto, `${plant.code} 最新照片`) : onOpenPlantDetail(plant.id)}
                >
                  <img
                    src={displayPhoto}
                    alt={plant.code}
                    className="w-20 h-20 rounded-2xl object-cover border border-emerald-100 shadow-2xs group-hover:scale-105 transition-all"
                  />
                  <span className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                    {plant.status}
                  </span>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                    <Eye className="w-3.5 h-3.5" /> 大图
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1 text-xs flex-1 min-w-0">
                  {/* 上一行：归属领取人 (放大作为卡片主标题) */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <User className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className={`font-black text-base truncate ${plant.claimed ? 'text-gray-900' : 'text-amber-600'}`}>
                      {plant.claimed ? (plant.ownerName ? `领用人：${plant.ownerName}` : '已领用人') : '待扫码绑定'}
                    </span>
                  </div>

                  {/* 下一行：辣椒植株编号 */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-emerald-800">植株编号：{plant.code}</span>
                  </div>

                  <p className="text-gray-500 flex items-center gap-1 text-[11px]">
                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                    养在：{plant.location}
                  </p>

                  <div className="pt-1 flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      plant.health === '需要浇水'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : plant.health === '需要施肥'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {plant.health}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">打卡 {plant.careCount || 0} 次</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-1.5">
                {!plant.claimed ? (
                  <button
                    onClick={() => {
                      setClaimingPlant(plant);
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl text-xs font-extrabold shadow-xs flex items-center justify-center gap-1 transition-all"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    需要扫码解锁植株
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => onQuickCareForPlant(plant.id, '浇水')}
                      className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 py-1.5 rounded-xl font-bold text-[11px] border border-emerald-200 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Droplets className="w-3 h-3 text-blue-600" />
                      浇水打卡
                    </button>

                    {isMyPlant && (
                      <button
                        onClick={() => onTransferPlant(plant)}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-800 px-2.5 py-1.5 rounded-xl font-bold text-[11px] border border-purple-200 transition-colors"
                        title="所有权转让登记"
                      >
                        <Gift className="w-3 h-3 text-purple-600" />
                      </button>
                    )}

                    <button
                      onClick={() => onOpenPlantDetail(plant.id)}
                      className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-xl font-bold text-[11px] border border-gray-200 transition-colors"
                    >
                      <Eye className="w-3 h-3 text-gray-500" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* REAL QR CODE SCANNING CLAIM MODAL */}
      {claimingPlant && !showCameraScanner && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 border border-emerald-100 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
              <Camera className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-extrabold text-gray-900 text-base">您需要扫码解锁植株</h3>
              <p className="text-xs text-amber-700 font-bold mt-1 bg-amber-50 py-1 px-2.5 rounded-lg inline-block border border-amber-200/80">
                请扫描放置在植物上的二维码
              </p>
            </div>

            {/* SCANNING INSTRUCTION CARD */}
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700 text-white space-y-3 relative overflow-hidden text-left">
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-slate-800 pb-2">
                  <QrCode className="w-4 h-4 shrink-0" />
                  <span>扫码解锁归属</span>
                </div>
                <p className="text-gray-300 leading-relaxed text-xs pt-1">
                  请点击下方“开启相机扫码”，对准放置在花盆上的专属二维码挂牌进行现场实时镜头扫描绑定！
                </p>
              </div>
            </div>

            <div className="pt-1 flex gap-2">
              <button
                onClick={() => {
                  setClaimingPlant(null);
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-bold"
              >
                关闭
              </button>
              
              <button
                onClick={() => setShowCameraScanner(true)}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl text-xs font-extrabold shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" />
                开启相机扫码
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAMERA SCANNER MODAL */}
      {showCameraScanner && claimingPlant && (
        <CameraScannerModal
          plant={claimingPlant}
          onClose={() => setShowCameraScanner(false)}
          onSuccessClaim={(plantId) => {
            handleConfirmClaim(plantId);
            setShowCameraScanner(false);
            setClaimingPlant(null);
          }}
        />
      )}
    </div>
  );
};
