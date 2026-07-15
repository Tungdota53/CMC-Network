'use client';

import React, { useState } from 'react';
import { UploadCloud, File, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SUBJECTS = [
  { id: 'PROG2006', name: 'Lập trình hướng đối tượng' },
  { id: 'INFO2013', name: 'Nhập môn công nghệ thông tin' },
  { id: 'PROG2008', name: 'Phát triển ứng dụng web' },
  { id: 'INFO2002', name: 'Cấu trúc dữ liệu và giải thuật' },
  { id: 'INFO3001', name: 'Pháp lý và Đạo đức nghề nghiệp' },
  { id: 'MATH2005', name: 'Toán rời rạc' },
  { id: 'INFO2008', name: 'Dự án công nghệ mới' },
  { id: 'INFO3020', name: 'Khoa học dữ liệu' },
  { id: 'INFO2009', name: 'Phân tích thiết kế hệ thống' },
  { id: 'INFO3006', name: 'An toàn thông tin' },
  { id: 'INFO3007', name: 'Mạng máy tính và truyền thông' },
  { id: 'INFO3009', name: 'Quản lý dự án công nghệ thông tin' },
  { id: 'INFO3005', name: 'Trí tuệ nhân tạo' },
  { id: 'INFO4001', name: 'Tác tử thông minh' },
  { id: 'SOFT4002', name: 'Thiết kế và xây dựng phần mềm' },
  { id: 'BIGD4003', name: 'Xử lý ngôn ngữ tự nhiên' },
  { id: 'SOFT4003', name: 'Kiểm thử phần mềm' },
  { id: 'SECU4006', name: 'Công nghệ chuỗi khối' },
  { id: 'INFO2010', name: 'Cơ sở hệ thống máy tính' },
  { id: 'COSC4001', name: 'Hệ thống nhúng' },
  { id: 'INFO4003', name: 'Học máy' },
  { id: 'COSC4003', name: 'Lý thuyết tính toán' },
  { id: 'COSC4002', name: 'Lập trình trò chơi' },
  { id: 'INFO4002', name: 'Mô hình ngôn ngữ lớn' },
  { id: 'SENG3009', name: 'Phát triển ứng dụng web nâng cao' },
  { id: 'PROG3002', name: 'Phát triển ứng dụng di động' },
  { id: 'INFO3008', name: 'Điện toán đám mây' },
  { id: 'BIGD4001', name: 'Học sâu và ứng dụng' },
  { id: 'MATH2001', name: 'Giải tích' },
  { id: 'MATH2003', name: 'Xác suất thống kê' },
  { id: 'MATH2002', name: 'Đại số tuyến tính' },
  { id: 'GENE1006', name: 'Pháp luật đại cương' },
  { id: 'GENE1001', name: 'Triết học Mác - Lênin' },
  { id: 'GENE1005', name: 'Tư tưởng Hồ Chí Minh' },
];

const ALLOWED_TYPES = [
  'application/pdf', 
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed'
];

export const MaterialUploadForm = () => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setError('');
    
    if (selected) {
      if (!ALLOWED_TYPES.includes(selected.type) && !selected.name.endsWith('.zip') && !selected.name.endsWith('.rar')) {
        setError('Định dạng tệp không được hỗ trợ. Vui lòng tải lên PDF, DOCX, PPTX, XLSX, hoặc ZIP.');
        return;
      }
      if (selected.size > 50 * 1024 * 1024) {
        setError('Kích thước tệp vượt quá 50MB.');
        return;
      }
      setFile(selected);
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Tên tài liệu *</label>
          <input 
            type="text" 
            placeholder="VD: Giáo trình Giải tích 2 (Bản chuẩn 2026)" 
            className="w-full px-4 py-3 bg-hover/50 border border-border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-card transition-all text-foreground placeholder:text-foreground/40 hover:border-border/80"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Môn học *</label>
            <select className="w-full px-4 py-3 bg-hover/50 border border-border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-card transition-all text-foreground appearance-none hover:border-border/80 cursor-pointer">
              <option value="">Chọn môn học</option>
              {SUBJECTS.map(subj => (
                <option key={subj.id} value={subj.id}>{subj.id} - {subj.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Học kỳ / Khóa *</label>
            <input 
              type="text" 
              placeholder="VD: HK1 - 2026" 
              className="w-full px-4 py-3 bg-hover/50 border border-border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-card transition-all text-foreground placeholder:text-foreground/40 hover:border-border/80"
            />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Mô tả thêm (Không bắt buộc)</label>
          <textarea 
            rows={3}
            placeholder="Nội dung chính, lưu ý khi sử dụng..." 
            className="w-full px-4 py-3 bg-hover/50 border border-border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-card transition-all resize-none text-foreground placeholder:text-foreground/40 hover:border-border/80"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Tệp đính kèm *</label>
          
          <AnimatePresence mode="wait">
            {!file ? (
              <motion.label 
                key="upload-zone"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.01, backgroundColor: 'var(--hover-bg)' }}
                whileTap={{ scale: 0.99 }}
                className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors cursor-pointer group bg-card/50 block relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
                />
                <motion.div 
                  className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 shadow-sm border border-primary/20"
                  whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
                >
                  <UploadCloud className="w-8 h-8" />
                </motion.div>
                <p className="text-[16px] font-bold text-foreground mb-1">Bấm để chọn hoặc kéo thả file</p>
                <p className="text-[13px] text-foreground/50 mb-5">Hỗ trợ PDF, DOCX, PPTX, XLSX, ZIP (Tối đa 50MB)</p>
                <div className="px-6 py-2.5 bg-card border border-border text-foreground/80 rounded-xl font-semibold group-hover:border-primary/30 group-hover:text-primary transition-colors shadow-sm">
                  Duyệt tệp
                </div>
              </motion.label>
            ) : (
              <motion.div 
                key="file-preview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                <div className="flex items-center gap-4 pl-2">
                  <div className="w-12 h-12 bg-card border border-border text-primary rounded-xl flex items-center justify-center shadow-sm">
                    <File className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-foreground line-clamp-1 break-all pr-4">{file.name}</p>
                    <p className="text-[13px] text-foreground/60 font-medium mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB • Sẵn sàng tải lên</p>
                  </div>
                </div>
                <button 
                  onClick={() => setFile(null)}
                  className="w-9 h-9 rounded-full bg-card flex items-center justify-center text-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors border border-border shadow-sm shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-red-500 text-[13px] mt-3 font-medium flex items-center gap-1.5">
              <Info className="w-4 h-4" /> {error}
            </motion.p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-4 rounded-xl flex items-start gap-3 text-[13px] font-medium border border-blue-500/20">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Tài liệu của bạn sẽ được AI phân tích để tạo tóm tắt và flashcard tự động. Quá trình này diễn ra an toàn và bảo mật.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="pt-2 flex justify-end">
          <motion.button 
            whileHover={{ scale: file ? 1.02 : 1 }}
            whileTap={{ scale: file ? 0.98 : 1 }}
            className={`px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg ${file ? 'bg-primary text-white hover:bg-primary/90 shadow-primary/25' : 'bg-hover text-foreground/40 cursor-not-allowed border border-border shadow-none'}`}
            disabled={!file}
          >
            Xác nhận tải lên
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};
