import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Loader2, Check } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedFile: File) => void;
  onClose: () => void;
  aspectRatio?: number;
  isCircular?: boolean;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<File | null> {
  try {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const file = new File([blob], 'cropped_avatar.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        resolve(file);
      }, 'image/jpeg');
    });
  } catch (e) {
    console.error(e);
    return null;
  }
}

export function ImageCropper({ imageSrc, onCropComplete, onClose, aspectRatio = 1, isCircular = true }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedFile) {
        onCropComplete(croppedFile);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 m-4 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h3 className="font-bold text-[18px] text-foreground">Chỉnh sửa ảnh</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-hover hover:bg-foreground/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative w-full h-[350px] bg-black/10">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            cropShape={isCircular ? "round" : "rect"}
            showGrid={false}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={onZoomChange}
          />
        </div>

        <div className="p-4 flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Thu phóng</label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 font-semibold text-[15px] rounded-lg bg-hover hover:bg-foreground/10 text-foreground transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="px-4 py-2 font-semibold text-[15px] rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors flex items-center gap-2 shadow-sm"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isProcessing ? 'Đang xử lý...' : 'Cập nhật'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
