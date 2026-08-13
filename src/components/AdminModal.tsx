import React, { useState } from 'react';
import { X, Shield, Lock, Trash2, Check, UserCheck } from 'lucide-react';
import { adminLogin, fetchUsers, adminDeleteUser } from '../lib/api';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onDataChanged
}) => {
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await adminLogin(adminPassword);
      if (res.success) {
        setIsAdminAuthenticated(true);
        const allUsers = await fetchUsers();
        setUsers(allUsers);
      } else {
        setErrorMsg('管理员密码错误！');
      }
    } catch (err: any) {
      setErrorMsg(err.message || '密码验证失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userName === '张伟' || userName === '李娜' || userId.startsWith('u-test')) {
      alert(`【提示】不能删除初始测试账号 ${userName}，请保留供测试！`);
      return;
    }

    if (!window.confirm(`确定要删除成员【${userName}】的账号吗？`)) {
      return;
    }

    try {
      await adminDeleteUser(userId, adminPassword);
      setUsers(users.filter(u => u.id !== userId));
      alert(`成员【${userName}】已成功删除`);
      onDataChanged();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 touch-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">管理员控制台</h3>
              <p className="text-[11px] text-gray-400">成员与账号安全管理</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAdminAuthenticated ? (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                输入管理员密码
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="请输入管理员密码"
                className="w-full bg-gray-50 border border-gray-200 focus:border-amber-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-gray-900 outline-none transition-all"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-red-500 bg-red-50 p-2 rounded-xl border border-red-200">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-xs shadow-md shadow-amber-200 flex items-center justify-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              {loading ? '正在验证...' : '管理员解锁进入'}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-800 pb-1 border-b border-gray-100">
              <span className="flex items-center gap-1 text-emerald-800">
                <UserCheck className="w-4 h-4" />
                已注册成员列表 ({users.length})
              </span>
              <span className="text-[10px] text-amber-700">（测试账号受保护不可删除）</span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {users.map(u => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-gray-900">{u.name}</span>
                    <span className="text-[10px] text-gray-500 block">养在：{u.location || '自选养护区域'}</span>
                  </div>

                  <button
                    onClick={() => handleDeleteUser(u.id, u.name)}
                    className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-1 text-[11px] font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    删除
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
