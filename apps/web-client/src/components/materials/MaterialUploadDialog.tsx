import React, { useState } from 'react';
import { UploadCloud, X, Info, CheckCircle2, FileText, LayoutGrid, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SUBJECTS } from './MaterialUploadForm'; // reuse subjects list
import api from '@/lib/api';

const ALLOWED_TYPES = [
  'application/pdf', 'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip', 'application/x-zip-compressed'
];

interface MaterialUploadDialogProps {
  onClose: () => void;
  onUploaded?: () => void;
}

const getFileType = (selected: File) => {
  const extension = selected.name.split('.').pop()?.toUpperCase();
  if (extension === 'PDF') return 'PDF';
  if (['DOC', 'DOCX'].includes(extension || '')) return 'DOCX';
  if (['PPT', 'PPTX'].includes(extension || '')) return 'PPTX';
  if (['ZIP', 'RAR'].includes(extension || '')) return 'ZIP';
  return 'OTHER';
};

export const MaterialUploadDialog = ({ onClose, onUploaded }: MaterialUploadDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState('');
  const [description, setDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'success'>('idle');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | any) => {
    let selected = e.target?.files?.[0];
    if (e.dataTransfer?.files?.[0]) {
      selected = e.dataTransfer.files[0];
    }
    
    setError('');
    
    if (selected) {
      if (!ALLOWED_TYPES.includes(selected.type) && !selected.name.endsWith('.zip') && !selected.name.endsWith('.rar')) {
        setError('Định dạng tệp không hỗ trợ (PDF, DOCX, PPTX, XLSX, ZIP).');
        return;
      }
      if (selected.size > 50 * 1024 * 1024) {
        setError('Tệp quá lớn, tối đa 50MB.');
        return;
      }
      setFile(selected);
    }
  };

  const canSubmit = Boolean(file && title.trim() && subject && semester.trim() && uploadState !== 'uploading' && uploadState !== 'processing');

  const handleSubmit = async () => {
    if (!file) {
      setError('Vui lòng chọn tệp trước khi tải lên.');
      return;
    }
    if (!title.trim() || !subject || !semester.trim()) {
      setError('Vui lòng nhập đủ tên tài liệu, môn học và học kỳ.');
      return;
    }

    setError('');
    setUploadProgress(0);
    setUploadState('uploading');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());
    formData.append('subject', subject);
    formData.append('semester', semester.trim());
    formData.append('description', description.trim());
    formData.append('fileType', getFileType(file));

    try {
      await api.post('/materials/upload', formData, {
        onUploadProgress: (event) => {
          if (!event.total) return;
          setUploadProgress(Math.min(95, Math.round((event.loaded / event.total) * 100)));
        },
      });
      setUploadProgress(100);
      setUploadState('processing');
      onUploaded?.();
      window.setTimeout(() => setUploadState('success'), 500);
      window.setTimeout(onClose, 1200);
    } catch (uploadError: any) {
      setUploadState('idle');
      setUploadProgress(0);
      setError(uploadError?.message || uploadError?.data?.message || 'Không tải lên được tài liệu. Hãy đăng nhập và thử lại.');
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e);
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4 sm:p-8"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-[900px] bg-card/90 backdrop-blur-2xl rounded-[32px] shadow-2xl overflow-hidden border border-white/10 flex flex-col md:flex-row relative"
          style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05) inset' }}
        >
          {/* Close Button */}
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/10 dark:bg-white/10 rounded-full flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-black/20 dark:hover:bg-white/20 transition-all backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Column: Dropzone */}
          <div className="w-full md:w-[45%] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent p-8 flex flex-col justify-center relative overflow-hidden isolate border-b md:border-b-0 md:border-r border-white/5">
            {/* Background decorative blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-50">
              <div className="absolute -top-[20%] -left-[20%] w-[70%] h-[70%] rounded-full bg-primary/30 blur-3xl mix-blend-screen" />
              <div className="absolute -bottom-[20%] -right-[20%] w-[70%] h-[70%] rounded-full bg-blue-500/20 blur-3xl mix-blend-screen" />
            </div>

            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-bold mb-4 border border-primary/20 shadow-inner">
                <UploadCloud className="w-4 h-4" /> Upload Center
              </div>
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight leading-tight mb-2">Chia sẻ<br/>tài liệu học tập</h2>
              <p className="text-foreground/70 text-sm">Đóng góp kiến thức và nhận +10 Reputation Point cho cộng đồng.</p>
            </div>

            <div 
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className="relative flex-1 min-h-[220px]"
            >
              <AnimatePresence mode="wait">
                {!file ? (
                  <motion.label 
                    key="dropzone"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`absolute inset-0 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group overflow-hidden ${isDragging ? 'border-primary bg-primary/10 scale-105' : 'border-primary/30 bg-card/40 hover:border-primary/60 hover:bg-card/60'}`}
                  >
                    <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar" />
                    
                    <motion.div 
                      className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-blue-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-primary/30"
                      animate={isDragging ? { y: [-5, 5, -5] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <UploadCloud className="w-8 h-8" />
                    </motion.div>
                    
                    <h3 className="text-[17px] font-bold text-foreground mb-1 group-hover:text-primary transition-colors">Kéo thả file vào đây</h3>
                    <p className="text-[13px] text-foreground/50 px-6">Hỗ trợ PDF, DOCX, PPTX...<br/>Tối đa 50MB</p>
                    
                    <div className="mt-5 px-5 py-2 rounded-xl bg-foreground/5 text-foreground font-semibold text-sm group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      Duyệt tệp tin
                    </div>
                  </motion.label>
                ) : (
                  <motion.div 
                    key="file-preview"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-0 bg-card/60 backdrop-blur-md rounded-3xl border border-white/10 p-6 flex flex-col items-center justify-center text-center shadow-inner"
                  >
                    <div className="relative">
                      <div className="w-20 h-24 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg text-white relative z-10">
                        <FileText className="w-10 h-10" />
                      </div>
                      <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}
                        className="absolute -right-3 -bottom-3 w-8 h-8 bg-green-500 rounded-full border-4 border-card flex items-center justify-center z-20 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </motion.div>
                    </div>
                    
                    <div className="mt-6 w-full">
                      <h4 className="font-bold text-foreground truncate px-2">{file.name}</h4>
                      <p className="text-foreground/60 text-sm mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>

                    <button 
                      onClick={(e) => { e.preventDefault(); setFile(null); }}
                      className="mt-6 px-4 py-2 rounded-full bg-red-500/10 text-red-500 text-sm font-bold hover:bg-red-500/20 transition-colors"
                    >
                      Xóa / Chọn file khác
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </div>

          {/* Right Column: Form */}
          <div className="w-full md:w-[55%] p-8 flex flex-col bg-card/40">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-primary" /> Thông tin tài liệu
            </h3>

            <div className="space-y-5 flex-1">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <label className="block text-sm font-bold text-foreground mb-2">Tên tài liệu <span className="text-red-500">*</span></label>
                <input 
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  type="text" 
                  placeholder="VD: Giáo trình Giải tích 2 (Bản chuẩn)" 
                  className="w-full px-4 py-3.5 bg-black/5 dark:bg-white/5 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground placeholder:text-foreground/40 font-medium shadow-inner"
                />
              </motion.div>

              <div className="grid grid-cols-2 gap-4">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                  <label className="block text-sm font-bold text-foreground mb-2">Môn học <span className="text-red-500">*</span></label>
                  <select
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    className="w-full px-4 py-3.5 bg-black/5 dark:bg-white/5 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground appearance-none font-medium cursor-pointer shadow-inner"
                  >
                    <option value="">Chọn môn học</option>
                    {SUBJECTS.map(subj => (
                      <option key={subj.id} value={subj.id}>{subj.name}</option>
                    ))}
                  </select>
                </motion.div>
                
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                  <label className="block text-sm font-bold text-foreground mb-2">Học kỳ <span className="text-red-500">*</span></label>
                  <input 
                    value={semester}
                    onChange={(event) => setSemester(event.target.value)}
                    type="text" 
                    placeholder="VD: HK1-2026" 
                    className="w-full px-4 py-3.5 bg-black/5 dark:bg-white/5 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground placeholder:text-foreground/40 font-medium shadow-inner"
                  />
                </motion.div>
              </div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                <label className="block text-sm font-bold text-foreground mb-2">Mô tả thêm</label>
                <textarea 
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  placeholder="Ghi chú thêm về nội dung, lưu ý..." 
                  className="w-full px-4 py-3.5 bg-black/5 dark:bg-white/5 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none text-foreground placeholder:text-foreground/40 font-medium shadow-inner"
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex gap-3 mt-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-primary animate-ping absolute" />
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-primary mb-0.5">Tích hợp AI Analysis</h4>
                  <p className="text-[12px] text-foreground/70 leading-relaxed font-medium">Hệ thống sẽ tự động phân tích tài liệu này để tạo Flashcard và Tóm tắt thông minh ngay sau khi tải lên.</p>
                </div>
              </motion.div>

              {uploadState !== 'idle' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
                  <div className="flex items-center justify-between text-sm font-bold text-primary mb-2">
                    <span>{uploadState === 'success' ? 'Hoàn tất' : uploadState === 'processing' ? 'Đang đưa vào hàng đợi AI' : 'Đang tải lên'}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-primary/15 overflow-hidden">
                    <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-foreground/60 font-medium">
                    {uploadState === 'processing' ? 'Tài liệu đã tải lên. AI sẽ tạo tóm tắt, flashcard và quiz khi xử lý xong.' : 'Vui lòng giữ hộp thoại mở trong lúc tải tệp.'}
                  </p>
                </motion.div>
              )}
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8">
              <button 
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`w-full py-4 rounded-2xl font-bold text-[16px] transition-all flex items-center justify-center gap-2 ${canSubmit ? 'bg-primary text-white shadow-lg shadow-primary/30 hover:scale-[1.02] hover:shadow-primary/50' : 'bg-black/5 dark:bg-white/5 text-foreground/40 cursor-not-allowed'}`}
              >
                {uploadState === 'uploading' || uploadState === 'processing' ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                {uploadState === 'success' ? 'Đã tải lên' : 'Xác nhận tải lên'}
              </button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
