import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const ImageUploader = ({ onImageUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        onImageUpload({ 
          file, 
          dataUrl: reader.result,
          name: file.name,
          type: file.type,
          size: file.size
        });
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    multiple: false,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false)
  });

  return (
    <div 
      {...getRootProps()} 
      className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
    >
      <input {...getInputProps()} />
      <div className="space-y-2">
        <svg 
          className="mx-auto h-12 w-12 text-gray-400" 
          stroke="currentColor" 
          fill="none" 
          viewBox="0 0 48 48" 
          aria-hidden="true"
        >
          <path 
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
            strokeWidth={2} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
        <p className="text-lg font-medium text-gray-700">拖拽长截图或点击选择文件</p>
        <p className="text-sm text-gray-500">支持 PNG, JPG, JPEG 格式</p>
      </div>
    </div>
  );
};

export default ImageUploader; 