import React, { useState } from 'react';
import { Heart, MessageSquare, Sparkles, Search, MapPin, Droplets, Trash2, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { CareLog, Plant, SystemActionTypeConfig, UserProfile } from '../types';
import { toggleLike, addComment, softDeleteCareLog, adminRestoreCareLog, adminDeleteCareLogPermanently, deleteComment } from '../lib/api';

interface TimelineFeedProps {
  logs: CareLog[];
  plants: Plant[];
  currentUserName: string;
  currentUser?: UserProfile | null;
  onRefresh: () => void;
  onOpenPlantDetail: (plantId: number) => void;
  onQuickLog: (plantId?: number) => void;
  onPreviewImage?: (url: string, title?: string) => void;
  actionTypesConfig?: SystemActionTypeConfig[];
}

export const TimelineFeed: React.FC<TimelineFeedProps> = ({
  logs,
  plants,
  currentUserName,
  currentUser,
  onRefresh,
  onOpenPlantDetail,
  onQuickLog,
  onPreviewImage,
  actionTypesConfig,
}) => {
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('全部');
  const [selectedPlantFilter, setSelectedPlantFilter] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCommentLogId, setExpandedCommentLogId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);
  const [showDeletedLogs, setShowDeletedLogs] = useState(false);

  const isAdmin = Boolean(currentUser?.isAdmin || currentUserName?.trim().toLowerCase() === 'admin');
  const visibleDeletedLogsCount = logs.filter(l => l.isDeleted && (isAdmin || (currentUserName && l.userName === currentUserName))).length;

  const defaultCategories = ['全部', '浇水', '施肥', '叶面肥', '松土培土', '打药防虫', '打顶剪枝', '位置变更', '成长拍照', '日光照射', '除草清理', '换盆翻土', '采摘收获', '人工授粉', '互助照顾', '所有权转移'];
  const actionCategories = (() => {
    const categoriesSet = new Set(defaultCategories);
    if (Array.isArray(actionTypesConfig)) {
      actionTypesConfig.forEach(a => {
        if (a.label) categoriesSet.add(a.label);
      });
    }
    return Array.from(categoriesSet);
  })();

  const filteredLogs = logs.filter(log => {
    if (showDeletedLogs) {
      if (!log.isDeleted) return false;
      if (!isAdmin && log.userName !== currentUserName) return false;
    } else {
      if (log.isDeleted) return false;
    }

    if (selectedActionFilter !== '全部' && log.actionType !== selectedActionFilter) return false;
    if (selectedPlantFilter !== 'ALL') {
      const targetPlant = plants.find(p => p.id === selectedPlantFilter);
      const isMatch = log.plantIds && Array.isArray(log.plantIds) && log.plantIds.some(pid => 
        pid === selectedPlantFilter || 
        String(pid) === String(selectedPlantFilter) ||
        (targetPlant && (targetPlant.code === String(pid) || targetPlant.name === String(pid)))
      );
      if (!isMatch) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = log.userName.toLowerCase().includes(q);
      const matchNotes = log.notes?.toLowerCase().includes(q);
      const matchFert = log.fertilizerName?.toLowerCase().includes(q);
      if (!matchName && !matchNotes && !matchFert) return false;
    }
    return true;
  });

  const handleLike = async (logId: string) => {
    if (!currentUserName) {
      alert('请先登录设置名字再点赞~');
      return;
    }
    await toggleLike(logId, currentUserName);
    onRefresh();
  };

  const handleSendComment = async (logId: string) => {
    if (!commentInput.trim()) return;
    if (!currentUserName) {
      alert('请先登录设置名字再评论~');
      return;
    }
    await addComment(logId, currentUserName, commentInput.trim());
    setCommentInput('');
    onRefresh();
  };

  const handleDeleteComment = async (logId: string, commentId: string) => {
    if (!window.confirm('确定要删除此条评论吗？')) return;
    try {
      await deleteComment(logId, commentId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || '删除评论失败');
    }
  };

  const handleSoftDeleteLog = async (logId: string, isSelf = false) => {
    const promptMsg = isSelf
      ? '确定要隐藏/删除您发布的此条动态吗？删除后将移入“已删动态”，您可以随时恢复。'
      : '确定要删除此条动态吗？删除后移入已删动态回收站，支持随时恢复。';
    if (!window.confirm(promptMsg)) return;
    try {
      await softDeleteCareLog(logId, true);
      onRefresh();
    } catch (err: any) {
      alert(err.message || '删除动态失败');
    }
  };

  const handleRestoreLog = async (logId: string) => {
    if (!window.confirm('确定要恢复此条动态吗？恢复后将重新对所有成员展示。')) return;
    try {
      await adminRestoreCareLog(logId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || '恢复动态失败');
    }
  };

  const handlePermanentDeleteLog = async (logId: string) => {
    if (!window.confirm('⚠️ 警告：彻底删除后数据不可恢复！确定要彻底删除此条动态吗？')) return;
    try {
      await adminDeleteCareLogPermanently(logId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || '永久删除失败');
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}小时前`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}天前`;
    return new Date(isoString).toLocaleDateString();
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Filter Controls */}
      <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-emerald-100 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索成员姓名、肥料、备注..."
              className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 outline-none transition-all"
            />
          </div>
          <select
            value={selectedPlantFilter}
            onChange={(e) => setSelectedPlantFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl px-3 py-2 outline-none max-w-[120px]"
          >
            <option value="ALL">全部辣椒苗</option>
            {plants.map(p => (
              <option key={p.id} value={p.id}>{p.code} ({p.ownerName || '待领'})</option>
            ))}
          </select>
        </div>

        {/* Admin Deleted Toggle & Action Filter */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1">
            {actionCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedActionFilter(cat)}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                  selectedActionFilter === cat
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {(isAdmin || visibleDeletedLogsCount > 0) && (
            <button
              onClick={() => setShowDeletedLogs(!showDeletedLogs)}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all shrink-0 ${
                showDeletedLogs 
                  ? 'bg-rose-600 text-white shadow-xs' 
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              {showDeletedLogs ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showDeletedLogs ? '返回正常动态' : `查看已删动态 (${visibleDeletedLogsCount})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stream List */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-emerald-100 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl">
            {showDeletedLogs ? '🗑️' : '🌱'}
          </div>
          <p className="text-xs text-gray-500 font-medium">
            {showDeletedLogs ? '当前暂无已被删除的动态记录' : '暂无相关动态记录，快抢先记录第一笔吧！'}
          </p>
          {!showDeletedLogs && (
            <button
              onClick={() => onQuickLog()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all inline-flex items-center gap-1.5"
            >
              ➕ 我来记一笔
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-7">
          {filteredLogs.map(log => {
            const isLiked = log.likes.some(l => l.userName === currentUserName);
            const isCommentsExpanded = expandedCommentLogId === log.id;

            return (
              <div
                key={log.id}
                className={`rounded-2xl sm:rounded-3xl p-4.5 sm:p-5 shadow-sm hover:shadow-md transition-all space-y-3.5 relative overflow-hidden border ${
                  log.isDeleted
                    ? 'bg-rose-50/40 border-rose-200'
                    : 'bg-white border-emerald-100/90 hover:border-emerald-300'
                }`}
              >
                {/* Deleted Badge Header */}
                {log.isDeleted && (
                  <div className="bg-rose-100/80 border border-rose-200 text-rose-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span>⚠️</span>
                      <span>
                        {currentUserName && log.userName === currentUserName
                          ? '您发布的此动态已被隐藏/删除（对其他成员不可见）'
                          : '此动态已被管理员删除（已从前台隐藏）'}
                      </span>
                    </span>
                    <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded-md">已隐藏</span>
                  </div>
                )}

                {/* Header: User Avatar, Name, Location */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 shadow-sm">
                      {log.userAvatar ? (
                        <img src={log.userAvatar} alt={log.userName} className="w-full h-full object-cover" />
                      ) : (
                        log.userName.slice(0, 2)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-900 text-sm">{log.userName}</span>
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-100">
                          养在：{log.userLocation || log.userDept || '养护区域'}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400">{formatRelativeTime(log.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-100 shadow-2xs">
                    <span>{log.actionIcon}</span>
                    <span>{log.actionType}</span>
                  </div>
                </div>

                {/* Target Plants & Details Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {log.plantIds.map((pid, idx) => {
                    const plant = plants.find(p => 
                      p.id === pid || 
                      String(p.id) === String(pid) || 
                      p.code === String(pid) || 
                      p.name === String(pid) ||
                      p.code.replace(/\s+/g, '') === String(pid).replace(/\s+/g, '')
                    );

                    let displayCode = plant ? plant.code : undefined;
                    if (!displayCode) {
                      const str = String(pid).trim();
                      if (str.startsWith('辣椒') || str.includes('#')) {
                        displayCode = str;
                      } else {
                        const num = parseInt(str.replace(/\D/g, ''), 10);
                        if (!isNaN(num)) {
                          displayCode = `辣椒 #${num < 10 ? '0' + num : num}`;
                        } else {
                          displayCode = `辣椒 #${str}`;
                        }
                      }
                    }

                    const targetId = plant ? plant.id : (typeof pid === 'number' ? pid : parseInt(String(pid)) || 1);

                    return (
                      <button
                        key={`${pid}-${idx}`}
                        onClick={() => typeof targetId === 'number' && onOpenPlantDetail(targetId)}
                        className="text-xs bg-emerald-100/70 hover:bg-emerald-200/80 text-emerald-900 px-2.5 py-1 rounded-xl font-medium border border-emerald-200 flex items-center gap-1 transition-colors"
                      >
                        <span>🌶️</span>
                        <span>{displayCode}</span>
                      </button>
                    );
                  })}

                  {log.helpedColleagues && log.helpedColleagues.length > 0 && (
                    <span className="text-[11px] font-semibold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-xl border border-amber-200 flex items-center gap-1">
                      <span>🤝 帮照顾:</span>
                      <span>{log.helpedColleagues.join('、')}</span>
                    </span>
                  )}
                </div>

                {/* Specific Action Details */}
                {(log.fertilizerName || log.waterVolume || log.locationNew) && (
                  <div className="bg-gray-50 rounded-xl p-2.5 text-xs text-gray-800 border border-gray-100 space-y-1">
                    {log.fertilizerName && (
                      <div className="flex items-center gap-1.5 text-amber-900 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>肥料名称：<strong>{log.fertilizerName}</strong></span>
                        {log.fertilizerConcentration && (
                          <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md text-[10px]">
                            {log.fertilizerConcentration}
                          </span>
                        )}
                      </div>
                    )}
                    {log.waterVolume && (
                      <div className="flex items-center gap-1.5 text-blue-900">
                        <Droplets className="w-3.5 h-3.5 text-blue-600" />
                        <span>浇水量：{log.waterVolume}</span>
                      </div>
                    )}
                    {log.locationNew && (
                      <div className="flex items-center gap-1.5 text-rose-900">
                        <MapPin className="w-3.5 h-3.5 text-rose-600" />
                        <span>更新养护区域为：<strong>养在：{log.locationNew}</strong></span>
                      </div>
                    )}
                  </div>
                )}

                {/* Diary Notes */}
                {log.notes && (
                  <p className="text-xs text-gray-700 leading-relaxed font-normal bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                    “ {log.notes} ”
                  </p>
                )}

                {/* Photo attachment */}
                {log.photo && (
                  <div
                    className="relative inline-block max-w-xs group cursor-pointer"
                    onClick={() => onPreviewImage ? onPreviewImage(log.photo!, `养护记录照片 - ${log.userName}`) : setActivePhotoModal(log.photo!)}
                  >
                    <img
                      src={log.photo}
                      alt="护理现场"
                      className="rounded-xl border border-gray-200 max-h-48 object-cover shadow-2xs group-hover:opacity-95 transition-opacity"
                    />
                    <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md backdrop-blur-xs">
                      点击放大原图
                    </span>
                  </div>
                )}

                {/* Like & Comment Bar & Admin Post Management */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleLike(log.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
                        isLiked
                          ? 'bg-rose-50 text-rose-600 font-bold border border-rose-200'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{log.likes.length > 0 ? log.likes.length : '赞'}</span>
                    </button>

                    <button
                      onClick={() => setExpandedCommentLogId(isCommentsExpanded ? null : log.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{log.comments.length > 0 ? log.comments.length : '评论'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Author or Admin Log Controls */}
                    {(() => {
                      const isMyLog = Boolean(currentUserName && log.userName && currentUserName.trim() === log.userName.trim());
                      const canManageLog = isAdmin || isMyLog;
                      if (!canManageLog) return null;

                      return (
                        <div className="flex items-center gap-1.5">
                          {!log.isDeleted ? (
                            <button
                              onClick={() => handleSoftDeleteLog(log.id, isMyLog && !isAdmin)}
                              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors border border-rose-100"
                              title={isMyLog && !isAdmin ? "删除/隐藏我的这条动态" : "管理员删除此动态"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{isMyLog && !isAdmin ? '删除动态' : '删除动态'}</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleRestoreLog(log.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold transition-colors"
                                title="恢复此动态"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>恢复</span>
                              </button>
                              <button
                                onClick={() => handlePermanentDeleteLog(log.id)}
                                className="flex items-center gap-1 px-2 py-1 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold transition-colors"
                                title="彻底删除"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>彻底删除</span>
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })()}

                    {log.likes.length > 0 && (
                      <span className="text-[11px] text-gray-400 truncate max-w-[150px]">
                        ❤️ {log.likes.map(l => l.userName).join('、')} 觉得很棒
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Comments Section */}
                {isCommentsExpanded && (
                  <div className="bg-gray-50/80 rounded-xl p-3 space-y-2.5 border border-gray-100 animate-in fade-in duration-200">
                    {log.comments.length > 0 ? (
                      <div className="space-y-2">
                        {log.comments.map(c => {
                          const canDeleteComment = isAdmin || (currentUserName && currentUserName === c.userName);

                          return (
                            <div key={c.id} className="text-xs leading-relaxed flex items-center justify-between group bg-white/70 p-2 rounded-lg border border-gray-100">
                              <div>
                                <span className="font-bold text-gray-900 mr-1.5">{c.userName}:</span>
                                <span className="text-gray-700">{c.text}</span>
                              </div>
                              {canDeleteComment && (
                                <button
                                  onClick={() => handleDeleteComment(log.id, c.id)}
                                  className="text-gray-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-all text-[11px] flex items-center gap-0.5 shrink-0 ml-2"
                                  title="删除此条评论"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>删除</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400">暂无评论，发表一条温暖的评论吧~</p>
                    )}

                    <div className="flex gap-1.5 pt-1">
                      <input
                        type="text"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendComment(log.id)}
                        placeholder={`以 ${currentUserName || '登录身份'} 回复...`}
                        className="flex-1 bg-white border border-gray-200 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-gray-900 outline-none"
                      />
                      <button
                        onClick={() => handleSendComment(log.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        发送
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Photo Preview Modal */}
      {activePhotoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setActivePhotoModal(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <img src={activePhotoModal} alt="大图预览" className="rounded-2xl max-h-[85vh] object-contain shadow-2xl" />
            <p className="text-center text-white/80 text-xs mt-2">点击任意区域关闭</p>
          </div>
        </div>
      )}
    </div>
  );
};
