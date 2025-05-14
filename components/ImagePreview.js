import { useState, useEffect } from 'react';

const ImagePreview = ({ image, slices = [] }) => {
  const [previewMode, setPreviewMode] = useState('original');
  
  if (!image) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">图片预览</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setPreviewMode('original')}
            className={`px-3 py-1 rounded-md text-sm ${
              previewMode === 'original'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            原图
          </button>
          <button
            onClick={() => setPreviewMode('slices')}
            className={`px-3 py-1 rounded-md text-sm ${
              previewMode === 'slices'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            disabled={slices.length === 0}
          >
            切片预览 ({slices.length})
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-auto max-h-[600px] border border-gray-200 rounded-lg">
        {previewMode === 'original' ? (
          <div className="flex justify-center">
            <img 
              src={image.dataUrl} 
              alt="原始图片" 
              className="max-w-full h-auto"
              style={{ maxHeight: '1000px' }}
            />
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {slices.map((slice, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  切片 {index + 1} ({slice.width} x {slice.height})
                </h3>
                <div className="flex justify-center">
                  <img 
                    src={slice.dataUrl} 
                    alt={`切片 ${index + 1}`}
                    className="max-w-full h-auto border border-gray-300"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagePreview; 