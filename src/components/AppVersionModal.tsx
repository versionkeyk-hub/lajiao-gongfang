import React, { useEffect } from 'react';
import { X, Sparkles, CheckCircle2, Cloud, ShieldCheck, Rocket, Tag } from 'lucide-react';

interface AppVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppVersionModal: React.FC<AppVersionModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentVersion = 'v2.5.0';
  const releaseDate = '2026-08-13';

  const versionLogs = [
    {
      version: 'v2.5.0',
      date: '2026-08-13',
      tag: '最新版本',
      isLatest: true,
      changes: [
        '新增应用头像/Logo点击交互，可随时查看版本号与更新日志',
        '新增管理员对打卡动态与评论的删除、隐藏与恢复权限',
        '新增用户自主删除/隐藏自己发表的打卡动态，并支持已删列表恢复',
        '优化动态回收站视图，自动隔离隐藏记录与公开展示',
      ],
    },
    {
      version: 'v2.4.0',
      date: '2026-08-12',
      tag: '核心升级',
      isLatest: false,
      changes: [
        '全面接入 Firebase 云端 Firestore 数据库',
        '实现 Shared App、GitHub Pages 与多设备间 100% 实时同步',
        '优化网络请求锁与快速回退机制，确保首屏毫秒级加载',
      ],
    },
    {
      version: 'v2.3.0',
      date: '2026-08-10',
      tag: 'AI 增强',
      isLatest: false,
      changes: [
        '集成 Gemini 大模型 AI 种植专家助手',
        '支持植物拍照上传诊断与自动化农技养护建议',
      ],
    },
    {
      version: 'v2.2.0',
      date: '2026-08-08',
      tag: '功能拓展',
      isLatest: false,
      changes: [
        '支持二维码一键生成、导出打印与现场扫码打卡',
        '新增植株认领、认领限制设置与所有权过户转移功能',
      ],
    },
    {
      version: 'v2.1.0',
      date: '2026-08-05',
      tag: '基础架构',
      isLatest: false,
      changes: [
        '独立小蛙管理后台 Console，支持数据全字段与全操作灵活配置',
        '多维度排行榜、积分打卡与个人中心统计看板',
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 touch-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in duration-200 max-h-[85vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src="/nong-xiao-wa.svg"
                alt="小蛙头像"
                className="w-11 h-11 rounded-2xl object-contain shadow-xs bg-emerald-50/50 p-1 border border-emerald-100"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" title="在线部署运行中" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-gray-900 text-base">小蛙种植记</h3>
                <span className="bg-emerald-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                  {currentVersion}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">内部自用智能农业与植株协同系统</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System Status Banner */}
        <div className="mt-4 bg-emerald-50/80 rounded-2xl p-3 border border-emerald-100 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-emerald-900 font-semibold">
            <Cloud className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>Firebase 实时云端数据库：</span>
            <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md text-[11px]">
              已连接 100% 同步
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">{releaseDate}</span>
        </div>

        {/* Scrollable Version Logs */}
        <div className="mt-4 overflow-y-auto no-scrollbar space-y-4 pr-1 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
            <Rocket className="w-4 h-4 text-emerald-600" />
            <span>版本更新历程</span>
          </div>

          <div className="space-y-3.5">
            {versionLogs.map((item) => (
              <div
                key={item.version}
                className={`rounded-2xl p-3.5 border transition-all ${
                  item.isLatest
                    ? 'bg-emerald-50/40 border-emerald-200 shadow-2xs'
                    : 'bg-gray-50/60 border-gray-200/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-extrabold text-xs px-2 py-0.5 rounded-lg ${
                      item.isLatest ? 'bg-emerald-700 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {item.version}
                    </span>
                    <span className="text-[11px] font-bold text-gray-500">{item.date}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                    item.isLatest
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Tag className="w-2.5 h-2.5" />
                    {item.tag}
                  </span>
                </div>

                <ul className="space-y-1.5 text-xs text-gray-700">
                  {item.changes.map((change, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 leading-snug">
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                        item.isLatest ? 'text-emerald-600' : 'text-gray-400'
                      }`} />
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-gray-400 font-medium">
            小蛙团队 ❤️ 持续迭代维护
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
};
