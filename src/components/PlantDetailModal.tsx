import React, { useState } from 'react';
import { X, Calendar, Droplets, Sparkles, MapPin, Plus, User, Edit3, Check } from 'lucide-react';
import { Plant, CareLog } from '../types';
import { updatePlant } from '../lib/api';

interface PlantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  plant: Plant | null;
  logs: CareLog[];
  onQuickLogForPlant: (plantId: number) => void;
  onDataRefresh?: () => void;
  onPreviewImage?: (url: string, title?: string) => void;
}

export const PlantDetailModal: React.FC<PlantDetailModalProps> = ({
  isOpen,
  onClose,
  plant,
  logs,
  onQuickLogForPlant,
  onDataRefresh,
  onPreviewImage,
}) => {
  const [isEditingStage, setIsEditingStage] = useState(false);
  const [stageInput, setStageInput] = useState('');
  const [isSavingStage, setIsSavingStage] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen || !plant) return null;

  const STAGE_OPTIONS = ['芽苗期', '定植期', '生长期', '开花期', '挂果期', '采收期'];

  // Filter care logs for this plant with flexible ID/code matching
  const plantLogs = logs.filter(l => 
    l.plantIds && Array.isArray(l.plantIds) && l.plantIds.some(pid => 
      pid === plant.id || 
      String(pid) === String(plant.id) || 
      String(pid) === plant.code ||
      (typeof pid === 'string' && String(pid).includes(String(plant.id)))
    )
  );

  const handleSaveStage = async () => {
    if (!stageInput.trim()) return;
    setIsSavingStage(true);
    try {
      await updatePlant(plant.id, { status: stageInput.trim() as any });
      if (onDataRefresh) onDataRefresh();
      setIsEditingStage(false);
      alert('植株生长阶段已成功更新！');
    } catch (err: any) {
      alert(err.message || '更新失败');
    } finally {
      setIsSavingStage(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 touch-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-gray-900 text-lg">{plant.code} 养护档案</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {plant.health}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">植株编号: {plant.code} (ID: #{plant.id}) | 完整生长与打卡日志</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plant Overview Card */}
        <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100 space-y-3">
          <div className="flex items-center gap-4">
            <div
              className="relative group cursor-pointer shrink-0"
              onClick={() => onPreviewImage?.((plant as any).image || plant.avatar || '', `${plant.code} 照片`)}
            >
              <img
                src={plant.avatar}
                alt={plant.code}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-200 shadow-xs group-hover:scale-105 transition-all"
              />
              <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                点击放大
              </span>
            </div>
            <div className="space-y-1 text-xs text-gray-700 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-sm">{plant.code}</span>
                <span className="text-[10px] bg-white border border-emerald-200 px-2 py-0.5 rounded-lg text-emerald-800 font-bold">
                  {plant.status}
                </span>
              </div>

              <p className="flex items-center gap-1 text-gray-600">
                <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                归属领用人：<strong className="text-gray-900 font-extrabold">{plant.ownerName || '待扫码绑定'}</strong>
              </p>

              <p className="flex items-center gap-1 text-gray-600">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                养在：<strong className="text-gray-800">{plant.location}</strong>
              </p>

              <p className="flex items-center gap-1 text-gray-500 text-[11px]">
                <Calendar className="w-3 h-3 text-gray-400" />
                领植日期：{plant.plantedDate || '2026-08-01'} | 累计打卡 {plant.careCount || 0} 次
              </p>
            </div>
          </div>

          {/* Editable Stage Control */}
          <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-800">生长阶段: <strong className="text-emerald-700">{plant.status}</strong></span>
              <button
                onClick={() => {
                  setIsEditingStage(!isEditingStage);
                  setStageInput(plant.status);
                }}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                {isEditingStage ? '收起编辑' : '修改阶段'}
              </button>
            </div>

            {isEditingStage && (
              <div className="pt-2 border-t border-gray-100 space-y-2 animate-in fade-in duration-150">
                <p className="text-[11px] text-gray-500 font-medium">快捷选择阶段或手动填写：</p>
                <div className="flex flex-wrap gap-1.5">
                  {STAGE_OPTIONS.map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStageInput(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        stageInput === st
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={stageInput}
                    onChange={(e) => setStageInput(e.target.value)}
                    placeholder="输入或修改辣椒苗生长阶段..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleSaveStage}
                    disabled={isSavingStage}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    保存
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="pt-1">
            <button
              onClick={() => {
                onQuickLogForPlant(plant.id);
                onClose();
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              给 {plant.code} 记一笔打卡记录
            </button>
          </div>
        </div>

        {/* History Care Logs Timeline */}
        <div className="mt-5 space-y-3">
          <h4 className="font-extrabold text-xs text-gray-900 border-b border-gray-100 pb-2">
            历史打卡及记录 ({plantLogs.length})
          </h4>

          {plantLogs.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-6 bg-gray-50 rounded-2xl">
              该盆植株暂无单独打卡记录，快去“记一笔”吧！
            </p>
          ) : (
            <div className="space-y-3">
              {plantLogs.map(log => (
                <div key={log.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-gray-900">{log.userName}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {log.actionIcon} {log.actionType}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(log.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {log.notes && <p className="text-gray-700 text-xs leading-relaxed">{log.notes}</p>}

                  {log.photo && (
                    <div
                      className="relative group cursor-pointer mt-2 overflow-hidden rounded-xl"
                      onClick={() => onPreviewImage?.(log.photo!, `养护过程照片 - ${log.userName}`)}
                    >
                      <img
                        src={log.photo}
                        alt="打卡拍照"
                        className="w-full max-h-48 object-cover rounded-xl border border-gray-200 group-hover:scale-105 transition-all"
                      />
                      <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                        点击查看原图
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
