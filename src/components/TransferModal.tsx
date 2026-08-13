import React, { useState } from 'react';
import { X, Gift, Check, ArrowRight } from 'lucide-react';
import { Plant, UserProfile } from '../types';
import { transferPlant } from '../lib/api';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  plant: Plant | null;
  currentUser: UserProfile | null;
  onTransferred: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  plant,
  currentUser,
  onTransferred
}) => {
  const [toUserName, setToUserName] = useState('');
  const [reason, setReason] = useState('赠送同事/半路交接');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen || !plant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toUserName.trim()) {
      alert('请填写接收人姓名');
      return;
    }
    if (!currentUser?.name) {
      alert('请先登录身份');
      return;
    }

    setIsSubmitting(true);
    try {
      await transferPlant({
        plantId: plant.id,
        fromUserName: currentUser.name,
        toUserName: toUserName.trim(),
        reason: reason.trim()
      });
      alert(`已成功将 ${plant.code} 的所有权转让赠送给【${toUserName.trim()}】！此操作已记入所有权转移记录。`);
      onTransferred();
      onClose();
    } catch (err: any) {
      alert(err.message || '转让失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 touch-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-purple-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">财产所有权转移/赠送</h3>
              <p className="text-[11px] text-gray-400">{plant.code} 转让记录登记</p>
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
          <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-100 flex items-center justify-between text-xs font-semibold text-purple-900">
            <span>当前归属人: {currentUser?.name || '未知'}</span>
            <ArrowRight className="w-4 h-4 text-purple-500" />
            <span className="text-purple-700 font-bold">新接收人</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              新所有者 / 接收人姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={toUserName}
              onChange={(e) => setToUserName(e.target.value)}
              placeholder="填写新同事姓名（新老员工均可）"
              className="w-full bg-gray-50 border border-gray-200 focus:border-purple-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-gray-900 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              转让原因 / 移交说明
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例如：工作调动赠送给同桌照顾，或交代半路交接"
              className="w-full bg-gray-50 border border-gray-200 focus:border-purple-500 focus:bg-white rounded-xl p-3 text-xs text-gray-900 outline-none transition-all resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-xs shadow-md shadow-purple-200 flex items-center justify-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? '正在登记转移...' : '确认完成转移登记'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
