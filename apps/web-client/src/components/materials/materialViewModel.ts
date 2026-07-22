export type MaterialFileType = 'PDF' | 'DOCX' | 'PPTX' | 'XLSX' | 'ZIP' | 'OTHER';

export interface MaterialApiItem {
  id: string;
  title?: string | null;
  description?: string | null;
  fileType?: string | null;
  fileSize?: string | null;
  subject?: string | null;
  semester?: string | null;
  downloadCount?: number | null;
  bookmarkCount?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  createdAt?: string | null;
  uploader?: {
    fullName?: string | null;
    avatarUrl?: string | null;
    isVerified?: boolean | null;
  } | null;
}

export interface MaterialViewModel {
  id: string;
  title: string;
  fileType: MaterialFileType;
  fileSize: string | null;
  subject: string;
  semester: string | null;
  downloadCount: number;
  bookmarkCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string | null;
  uploaderName: string;
  uploaderAvatar: string | null;
  uploaderVerified: boolean;
}

const FILE_TYPES = new Set<MaterialFileType>([
  'PDF',
  'DOCX',
  'PPTX',
  'XLSX',
  'ZIP',
  'OTHER',
]);

export function toMaterialViewModel(item: MaterialApiItem): MaterialViewModel {
  const rawType = item.fileType?.toUpperCase() as MaterialFileType | undefined;
  return {
    id: item.id,
    title: item.title?.trim() || 'Tài liệu chưa đặt tên',
    fileType: rawType && FILE_TYPES.has(rawType) ? rawType : 'OTHER',
    fileSize: item.fileSize?.trim() || null,
    subject: item.subject?.trim() || 'Chưa phân loại',
    semester: item.semester?.trim() || null,
    downloadCount: Number.isFinite(item.downloadCount) ? Number(item.downloadCount) : 0,
    bookmarkCount: Number.isFinite(item.bookmarkCount) ? Number(item.bookmarkCount) : 0,
    rating: Number.isFinite(item.rating) ? Number(item.rating) : 0,
    reviewCount: Number.isFinite(item.reviewCount) ? Number(item.reviewCount) : 0,
    createdAt: item.createdAt || null,
    uploaderName: item.uploader?.fullName?.trim() || 'Thành viên CMC',
    uploaderAvatar: item.uploader?.avatarUrl || null,
    uploaderVerified: Boolean(item.uploader?.isVerified),
  };
}
