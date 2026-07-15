'use client';

import React from 'react';
import { ImageGrid } from './ImageGrid';

export const ImageMessage = ({ urls }: { urls: string[] }) => {
  // TODO: Add Lightbox integration here (e.g. react-18-image-lightbox or a custom modal)
  return (
    <div className="my-0.5">
      <ImageGrid urls={urls} />
    </div>
  );
};
