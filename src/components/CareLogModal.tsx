import React, { useState, useEffect } from 'react';
import { X, Camera, Check, Droplets, Sparkles, MapPin, Sprout, ShieldAlert, Scissors, Sun, HeartHandshake, Loader2, RefreshCw, Heart, Users } from 'lucide-react';
import { Plant, ActionType, UserProfile, PRESET_LOCATIONS, COMMON_FERTILIZERS, FERTILIZER_CONCENTRATIONS, SystemActionTypeConfig } from '../types';
import { createLog } from '../lib/api';
import { compressImageFile, compressDataUrl } from '../lib/imageCompressor';

interface CareLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  plants: Plant[];
  onLogCreated: () => void;
  defaultPlantId?: number;
  defaultActionType?: string;
  onPreviewImage?: (url: string, title?: string) => void;
  actionTypesConfig?: SystemActionTypeConfig[];
}

export const CareLogModal: React.FC<CareLogModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  plants = [],
  onLogCreated,
  defaultPlantId,
  defaultActionType,
  onPreviewImage,
  actionTypesConfig,
}) => {
  const safePlants = Array.isArray(plants) ? plants.filter(Boolean) : [];
  const [selectedMainPlantId, setSelectedMainPlantId] = useState<number>(defaultPlantId || currentUser?.plantIds?.[0] || 1);
  const [coCaredPlantIds, setCoCaredPlantIds] = useState<number[]>([]);
  const [actionType, setActionType] = useState<ActionType>(defaultActionType || '浇水');
  
  const [fertilizerName, setFertilizerName] = useState('磷酸二氢钾');
  const [fertilizerConcentration, setFertilizerConcentration] = useState('1:1000 稀释液');
  const [waterVolume, setWaterVolume] = useState('200ml 透浇');
  const [locationNew, setLocationNew] = useState('技术部办公区');
  const [photo, setPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentSafePlants = Array.isArray(plants) ? plants.filter(Boolean) : [];
      const myFirstPlant = currentSafePlants.find(p => p && (p.ownerName === currentUser?.name || (Array.isArray(p.owners) && p.owners.includes(currentUser?.name || ''))));
      const targetId = defaultPlantId || myFirstPlant?.id || currentUser?.plantIds?.[0] || currentSafePlants[0]?.id || 1;
      setSelectedMainPlantId(targetId);
      if (defaultActionType) {
        setActionType(defaultActionType);
      } else {
        setActionType('浇水');
      }
      setCoCaredPlantIds([]);
      setFertilizerName('磷酸二氢钾');
      setFertilizerConcentration('1:1000 稀释液');
      setWaterVolume('200ml 透浇');
      setLocationNew(PRESET_LOCATIONS[0] || '技术部办公区');
      setPhoto(null);
      setNotes('');
    }
  }, [isOpen, defaultPlantId, defaultActionType, currentUser?.name]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Default preset icons and styles for standard actions
  const defaultActionItems: { type: ActionType; icon: React.ReactNode; label: string; bg: string; text: string; enableWaterInput?: boolean; enableFertilizerInput?: boolean; enableLocationInput?: boolean }[] = [
    { type: '浇水', icon: <Droplets className="w-4 h-4" />, label: '浇水', bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200', text: 'text-blue-700', enableWaterInput: true },
    { type: '施肥', icon: <Sparkles className="w-4 h-4" />, label: '施肥', bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200', text: 'text-amber-700', enableFertilizerInput: true },
    { type: '叶面肥', icon: <Sprout className="w-4 h-4" />, label: '叶面肥', bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200', text: 'text-emerald-700', enableFertilizerInput: true },
    { type: '松土培土', icon: <Sprout className="w-4 h-4" />, label: '松土培土', bg: 'bg-orange-50 hover:bg-orange-100 border-orange-200', text: 'text-orange-700' },
    { type: '打药防虫', icon: <ShieldAlert className="w-4 h-4" />, label: '打药防虫', bg: 'bg-purple-50 hover:bg-purple-100 border-purple-200', text: 'text-purple-700' },
    { type: '打顶剪枝', icon: <Scissors className="w-4 h-4" />, label: '打顶剪枝', bg: 'bg-teal-50 hover:bg-teal-100 border-teal-200', text: 'text-teal-700' },
    { type: '位置变更', icon: <MapPin className="w-4 h-4" />, label: '位置变更', bg: 'bg-rose-50 hover:bg-rose-100 border-rose-200', text: 'text-rose-700', enableLocationInput: true },
    { type: '成长拍照', icon: <Camera className="w-4 h-4" />, label: '成长拍照', bg: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200', text: 'text-indigo-700' },
    { type: '日光照射', icon: <Sun className="w-4 h-4" />, label: '日光照射', bg: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200', text: 'text-yellow-700' },
    { type: '除草清理', icon: <Sprout className="w-4 h-4" />, label: '除草清理', bg: 'bg-lime-50 hover:bg-lime-100 border-lime-200', text: 'text-lime-700' },
    { type: '换盆翻土', icon: <RefreshCw className="w-4 h-4" />, label: '换盆翻土', bg: 'bg-stone-50 hover:bg-stone-100 border-stone-200', text: 'text-stone-700' },
    { type: '采摘收获', icon: <Heart className="w-4 h-4" />, label: '采摘收获', bg: 'bg-red-50 hover:bg-red-100 border-red-200', text: 'text-red-700' },
    { type: '人工授粉', icon: <Sparkles className="w-4 h-4" />, label: '人工授粉', bg: 'bg-fuchsia-50 hover:bg-fuchsia-100 border-fuchsia-200', text: 'text-fuchsia-700' },
    { type: '互助照顾', icon: <Users className="w-4 h-4" />, label: '互助照顾', bg: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200', text: 'text-cyan-700' }
  ];

  // Directly derive from actionTypesConfig (Global Admin Dictionary) if present so that CareLogModal 100% matches Admin Console
  const displayActions = (() => {
    if (Array.isArray(actionTypesConfig) && actionTypesConfig.length > 0) {
      return actionTypesConfig.map(cfg => {
        const label = cfg.label || cfg.key || (cfg as any).name || '未命名';
        const presetMatch = defaultActionItems.find(item => item.label === label || item.type === label);
        
        return {
          type: label,
          label: label,
          icon: cfg.icon ? (
            typeof cfg.icon === 'string' && cfg.icon.length <= 4 ? (
              <span className="text-base leading-none">{cfg.icon}</span>
            ) : (
              <span className="text-base leading-none">{cfg.icon}</span>
            )
          ) : (presetMatch?.icon || <Sparkles className="w-4 h-4" />),
          bg: cfg.colorBg || presetMatch?.bg || 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
          text: cfg.colorText || presetMatch?.text || 'text-emerald-700',
          enableWaterInput: cfg.enableWaterInput,
          enableFertilizerInput: cfg.enableFertilizerInput,
          enableLocationInput: cfg.enableLocationInput,
        };
      });
    }
    return defaultActionItems;
  })();

  const activeActionObj = displayActions.find(a => a.label === actionType || a.type === actionType);
  const showWaterInput = actionType === '浇水' || activeActionObj?.enableWaterInput;
  const showFertilizerInput = actionType === '施肥' || actionType === '叶面肥' || activeActionObj?.enableFertilizerInput;
  const showLocationInput = actionType === '位置变更' || activeActionObj?.enableLocationInput;

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressingPhoto(true);
      try {
        const compressed = await compressImageFile(file, 1000, 1000, 0.75);
        setPhoto(compressed);
      } catch (err) {
        console.error('Compress photo failed:', err);
      } finally {
        setIsCompressingPhoto(false);
      }
    }
  };

  const toggleCoCaredPlant = (pid: number) => {
    if (pid === selectedMainPlantId) return;
    if (coCaredPlantIds.includes(pid)) {
      setCoCaredPlantIds(coCaredPlantIds.filter(id => id !== pid));
    } else {
      setCoCaredPlantIds([...coCaredPlantIds, pid]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.name) {
      alert('请先登录并设定你的名字！');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const allTargetPlantIds = Array.from(new Set([selectedMainPlantId, ...coCaredPlantIds]));

      const helpedColleagueNames: string[] = [];
      coCaredPlantIds.forEach(pid => {
        const p = safePlants.find(plant => plant && plant.id === pid);
        if (p && p.ownerName && p.ownerName !== currentUser.name && !helpedColleagueNames.includes(p.ownerName)) {
          helpedColleagueNames.push(p.ownerName);
        }
      });

      // Extra compression safety check
      let finalPhoto = photo;
      if (photo && photo.length > 300000) {
        finalPhoto = await compressDataUrl(photo, 1000, 1000, 0.75);
      }

      // Add timeout fallback to prevent UI hanging forever
      const createLogPromise = createLog({
        plantIds: allTargetPlantIds,
        userId: currentUser.id || 'u-user',
        userName: currentUser.name,
        userLocation: currentUser.location || '养护区域',
        userAvatar: currentUser.avatar,
        actionType,
        fertilizerName: (actionType === '施肥' || actionType === '叶面肥') ? fertilizerName : undefined,
        fertilizerConcentration: (actionType === '施肥' || actionType === '叶面肥') ? fertilizerConcentration : undefined,
        waterVolume: actionType === '浇水' ? waterVolume : undefined,
        locationNew: actionType === '位置变更' ? locationNew : undefined,
        photo: finalPhoto || undefined,
        notes: notes.trim() || undefined,
        helpedColleagues: helpedColleagueNames
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('网络请求超时，请检查网络连接后重试')), 12000)
      );

      await Promise.race([createLogPromise, timeoutPromise]);

      onLogCreated();
      onClose();
    } catch (err: any) {
      alert(err.message || '记录失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 touch-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-200">
              ✍️
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">记一笔操作记录</h3>
              <p className="text-xs text-gray-400">记录日常养护日志与成长动态</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Plant Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              本次照顾的植株盆号 <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedMainPlantId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedMainPlantId(id);
                setCoCaredPlantIds(coCaredPlantIds.filter(pid => pid !== id));
              }}
              className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-bold outline-none transition-all"
            >
              {safePlants.map(p => (
                <option key={p.id} value={p.id}>
                  {p.code} ({p.ownerName ? `认领人: ${p.ownerName}` : '待领用'}) - 养在: {p.location}
                </option>
              ))}
              {safePlants.length === 0 && (
                <option value={1}>1号盆 (暂无植株数据)</option>
              )}
            </select>
          </div>

          {/* Action Type Selection Grid */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              选择本次护理操作类型
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {displayActions.map(item => {
                const isSelected = actionType === item.label || actionType === item.type;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setActionType(item.label)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-center ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white font-bold shadow-md shadow-emerald-200 scale-105'
                        : `${item.bg} ${item.text} border-transparent hover:border-gray-300`
                    }`}
                  >
                    {item.icon}
                    <span className="text-[11px] leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Inputs Based on Action */}
          {showFertilizerInput && (
            <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 space-y-3">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>具体肥料名称与浓度记录</span>
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                  肥料名字 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={fertilizerName}
                    onChange={(e) => setFertilizerName(e.target.value)}
                    placeholder="例如：磷酸二氢钾、羊粪、复合肥"
                    className="flex-1 bg-white border border-amber-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-amber-950 outline-none"
                  />
                  <select
                    onChange={(e) => { if (e.target.value) setFertilizerName(e.target.value); }}
                    className="bg-white border border-amber-300 text-xs text-amber-900 rounded-xl px-2 outline-none"
                  >
                    <option value="">常用选项</option>
                    {COMMON_FERTILIZERS.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                  浓度配比（可选）
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={fertilizerConcentration}
                    onChange={(e) => setFertilizerConcentration(e.target.value)}
                    placeholder="如：1:1000 稀释液，也可不填"
                    className="flex-1 bg-white border border-amber-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-amber-950 outline-none"
                  />
                  <select
                    onChange={(e) => { if (e.target.value) setFertilizerConcentration(e.target.value); }}
                    className="bg-white border border-amber-300 text-xs text-amber-900 rounded-xl px-2 outline-none"
                  >
                    <option value="">快捷填选</option>
                    {FERTILIZER_CONCENTRATIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {showWaterInput && (
            <div className="bg-blue-50/80 p-3 rounded-2xl border border-blue-200 space-y-2">
              <label className="block text-xs font-semibold text-blue-900 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-blue-600" />
                浇水情况手写说明 / 量值
              </label>
              <input
                type="text"
                value={waterVolume}
                onChange={(e) => setWaterVolume(e.target.value)}
                placeholder="例如：透浇200ml、喷雾湿润表土、微淋等"
                className="w-full bg-white border border-blue-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-blue-950 outline-none"
              />
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {['150ml', '250ml 浇透', '喷雾湿润表土', '晾晒隔夜透水'].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setWaterVolume(v)}
                    className={`text-[11px] px-2 py-1 rounded-lg border font-medium transition-colors ${
                      waterVolume === v
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-blue-900 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showLocationInput && (
            <div className="bg-rose-50/80 p-3 rounded-2xl border border-rose-200">
              <label className="block text-xs font-semibold text-rose-900 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                养在*** 新位置
              </label>
              <select
                value={locationNew}
                onChange={(e) => setLocationNew(e.target.value)}
                className="w-full bg-white border border-rose-300 text-xs text-rose-950 rounded-xl px-3 py-2 outline-none"
              >
                {PRESET_LOCATIONS.map(d => (
                  <option key={d} value={d}>养在：{d}</option>
                ))}
              </select>
            </div>
          )}

          {/* Helped Colleagues Multi-check */}
          <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-950 flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
                帮忙照顾：其他同事的植株？
              </span>
              <span className="text-[11px] text-emerald-700">可多选</span>
            </div>
            
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
              {safePlants
                .filter(p => p && p.id !== selectedMainPlantId)
                .map(p => {
                  const isChecked = coCaredPlantIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleCoCaredPlant(p.id)}
                      className={`text-xs px-2.5 py-1 rounded-xl border flex items-center gap-1 transition-all ${
                        isChecked
                          ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <span>{p.code} ({p.ownerName || '待领用'})</span>
                      {isChecked && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Photo */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-gray-500" />
              随手拍照 / 上传图片
            </label>
            <div className="flex items-center gap-3">
              {photo ? (
                <div
                  className="relative w-16 h-16 rounded-xl overflow-hidden border border-emerald-300 group cursor-pointer"
                  onClick={() => onPreviewImage?.(photo, '打卡拟上传照片')}
                >
                  <img src={photo} alt="操作照片" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] text-center font-bold">
                    放大原图
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhoto(null);
                    }}
                    className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-rose-600 text-white rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex-1 cursor-pointer bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 border border-dashed border-gray-300 hover:border-emerald-400 py-3 px-4 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors">
                  {isCompressingPhoto ? (
                    <>
                      <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                      <span>照片压缩处理中...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <span>点击拍照或从相册选择照片</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={isCompressingPhoto} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              操作记录备注
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例如：今天长出了新叶片！土壤透气性不错。"
              className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl p-3 text-xs text-gray-900 outline-none transition-all resize-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isCompressingPhoto}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>保存记录中...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>发布到动态</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
