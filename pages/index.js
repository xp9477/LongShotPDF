import { useState, useEffect } from 'react';
import Head from 'next/head';
import ImageUploader from '../components/ImageUploader';
import SettingsForm from '../components/SettingsForm';
import ImagePreview from '../components/ImagePreview';
import { sliceImage, createPdfFromImages, createDownloadLink } from '../utils/imageProcessor';

// 默认设置
const defaultSettings = {
  margin: 0,
  autoDetectSplits: true,  // 默认启用黑线检测
  sharpenImage: true       // 默认启用锐化
};

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [imageSlices, setImageSlices] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 处理图片上传
  const handleImageUpload = (image) => {
    setUploadedImage(image);
    setPdfUrl(null);
    setImageSlices([]);
    setErrorMessage('');
  };

  // 处理设置变更
  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
  };

  // 生成切片预览
  const handlePreviewSlices = async () => {
    if (!uploadedImage) return;

    try {
      setIsProcessing(true);
      setErrorMessage('');
      
      const slices = await sliceImage(uploadedImage.dataUrl, {
        autoDetectSplits: true,  // 强制启用黑线检测
        splitSensitivity: 50,
        sharpenImage: settings.sharpenImage
      });
      
      setImageSlices(slices);
    } catch (error) {
      console.error('切片处理出错:', error);
      setErrorMessage('图片处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 生成PDF
  const handleCreatePdf = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage('');
      
      // 如果还没有切片，先生成切片
      if (imageSlices.length === 0 && uploadedImage) {
        const slices = await sliceImage(uploadedImage.dataUrl, {
          autoDetectSplits: true,  // 强制启用黑线检测
          splitSensitivity: 50,
          sharpenImage: settings.sharpenImage
        });
        setImageSlices(slices);
        
        // 使用生成的切片创建PDF
        const pdfBytes = await createPdfFromImages(slices, {
          margin: settings.margin
        });
        
        const url = createDownloadLink(pdfBytes, `${uploadedImage.name.split('.')[0]}.pdf`);
        setPdfUrl(url);
      } else {
        // 使用已有的切片创建PDF
        const pdfBytes = await createPdfFromImages(imageSlices, {
          margin: settings.margin
        });
        
        const url = createDownloadLink(pdfBytes, `${uploadedImage.name.split('.')[0]}.pdf`);
        setPdfUrl(url);
      }
    } catch (error) {
      console.error('PDF生成出错:', error);
      setErrorMessage('PDF生成失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 清除资源
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>LongShotPDF - 长截图转PDF工具</title>
        <meta name="description" content="将手机长截图转换为精美PDF文档" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto py-8 px-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            LongShotPDF
          </h1>
          <p className="text-gray-600 mt-2">
            轻松将手机长截图转换为精美的PDF文档
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <ImageUploader onImageUpload={handleImageUpload} />
            
            {uploadedImage && (
              <SettingsForm 
                defaultSettings={settings} 
                onSettingsChange={handleSettingsChange}
              />
            )}
            
            {uploadedImage && (
              <div className="flex flex-col space-y-4">
                <button
                  onClick={handlePreviewSlices}
                  disabled={isProcessing || !uploadedImage}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isProcessing ? '处理中...' : '生成切片预览'}
                </button>
                
                <button
                  onClick={handleCreatePdf}
                  disabled={isProcessing || !uploadedImage}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isProcessing ? '生成中...' : '生成PDF文档'}
                </button>
                
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    download={`${uploadedImage.name.split('.')[0]}.pdf`}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md text-center"
                  >
                    下载PDF
                  </a>
                )}
                
                {errorMessage && (
                  <div className="p-3 bg-red-100 text-red-700 rounded-md">
                    {errorMessage}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div>
            {uploadedImage && (
              <ImagePreview 
                image={uploadedImage} 
                slices={imageSlices}
              />
            )}
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-gray-500 text-sm">
        <p>LongShotPDF &copy; {new Date().getFullYear()} - 将长截图转为PDF的最佳工具</p>
      </footer>
    </div>
  );
} 