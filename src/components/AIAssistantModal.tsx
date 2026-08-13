import React, { useState } from 'react';
import { X, Bot, Sparkles, Send, Image as ImageIcon, Loader2, HelpCircle, Sprout } from 'lucide-react';
import { askAiExpert } from '../lib/api';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantName?: string;
  healthStatus?: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  plantName = '辣椒植株',
  healthStatus = '正常成长中'
}) => {
  const [question, setQuestion] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQuickQuestion = (q: string) => {
    setQuestion(q);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() && !image) return;

    setLoading(true);
    setAnswer(null);
    try {
      const reply = await askAiExpert(
        question || '请帮我诊断这株辣椒苗的生长状况和注意事项',
        plantName,
        healthStatus,
        image || undefined
      );
      setAnswer(reply);
    } catch (err) {
      setAnswer('问答出现异常，请稍后再试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 touch-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-1.5">
                AI 辣椒养护小导师
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Gemini 驱动
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                针对 {plantName}（{healthStatus}）的专属顾问
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100 text-xs text-emerald-900 leading-relaxed">
            <p className="font-semibold text-emerald-950 mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              有什么养护疑问随时问我：
            </p>
            辣椒小苗叶子变黄？什么时候需要打顶摘心？或者施肥浓度该怎么配？拍照上传，小导师秒出建议！
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              大家常问的热门问题：
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                '幼苗期多久浇一次水合适？',
                '磷酸二氢钾应该怎么稀释和喷施？',
                '辣椒苗怎么打顶摘心促分枝？',
                '底叶微黄是缺氮还是水浇多了？'
              ].map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickQuestion(q)}
                  className="text-xs bg-gray-100 hover:bg-emerald-100 hover:text-emerald-800 text-gray-700 px-2.5 py-1.5 rounded-xl text-left transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {answer && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4 rounded-2xl border border-emerald-200/80 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs mb-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>养护导师解答：</span>
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed whitespace-pre-line font-medium">
                {answer}
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="pt-3 border-t border-gray-100 shrink-0 space-y-2">
          {image && (
            <div className="relative inline-block">
              <img src={image} alt="上传叶片" className="w-16 h-16 object-cover rounded-xl border border-emerald-200" />
              <button
                type="button"
                onClick={() => setImage(null)}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-0.5 rounded-full shadow-sm hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-emerald-600 hover:border-emerald-300 bg-gray-50 hover:bg-emerald-50 cursor-pointer transition-colors">
              <ImageIcon className="w-5 h-5" />
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>

            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="输入你的疑问或选上方常问..."
              className="flex-1 bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition-all"
            />

            <button
              type="submit"
              disabled={loading || (!question.trim() && !image)}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-2.5 rounded-xl shadow-md shadow-emerald-200 transition-all shrink-0 flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
