import { PDFDocument } from 'pdf-lib';

/**
 * 对图像应用增强锐化效果
 * @param {HTMLCanvasElement} canvas - 包含图像的画布
 * @returns {HTMLCanvasElement} - 锐化后的画布
 */
const sharpenImage = (canvas) => {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  
  // 获取图像数据
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // 创建结果画布
  const result = document.createElement('canvas');
  result.width = width;
  result.height = height;
  const resultCtx = result.getContext('2d');
  resultCtx.drawImage(canvas, 0, 0);
  
  // 应用多阶段锐化处理

  // 1. 对比度增强
  const resultData = resultCtx.getImageData(0, 0, width, height);
  const resultPixels = resultData.data;
  
  // 计算平均亮度
  let totalBrightness = 0;
  for (let i = 0; i < resultPixels.length; i += 4) {
    const r = resultPixels[i];
    const g = resultPixels[i + 1];
    const b = resultPixels[i + 2];
    totalBrightness += (r + g + b) / 3;
  }
  const avgBrightness = totalBrightness / (width * height);
  
  // 对比度因子
  const contrast = 1.2; // 增加20%对比度
  
  // 应用对比度
  for (let i = 0; i < resultPixels.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const val = resultPixels[i + c];
      // 对比度公式: (val - avgBrightness) * contrast + avgBrightness
      resultPixels[i + c] = Math.max(0, Math.min(255, Math.round((val - avgBrightness) * contrast + avgBrightness)));
    }
  }
  
  resultCtx.putImageData(resultData, 0, 0);
  
  // 2. 锐化处理 (使用UnsharpMask)
  const blurCanvas = document.createElement('canvas');
  blurCanvas.width = width;
  blurCanvas.height = height;
  const blurCtx = blurCanvas.getContext('2d');
  
  // 绘制原始图像到模糊画布
  blurCtx.drawImage(result, 0, 0);
  
  // 应用模糊效果
  blurCtx.filter = 'blur(2px)';
  blurCtx.drawImage(blurCanvas, 0, 0);
  blurCtx.filter = 'none';
  
  // 获取模糊后的图像数据
  const blurData = blurCtx.getImageData(0, 0, width, height);
  const blurPixels = blurData.data;
  
  // 获取当前锐化后的图像数据
  const sharpData = resultCtx.getImageData(0, 0, width, height);
  const sharpPixels = sharpData.data;
  
  // 应用UnsharpMask: 原图 + 系数 * (原图 - 模糊图)
  const amount = 2.5; // 锐化强度
  const threshold = 5; // 最小差异阈值
  
  for (let i = 0; i < sharpPixels.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const diff = sharpPixels[i + c] - blurPixels[i + c];
      
      // 仅当差异大于阈值时应用锐化
      if (Math.abs(diff) > threshold) {
        sharpPixels[i + c] = Math.max(0, Math.min(255, sharpPixels[i + c] + amount * diff));
      }
    }
  }
  
  // 应用最终锐化结果
  resultCtx.putImageData(sharpData, 0, 0);
  
  // 3. 黑色文本增强 (特别针对文档图像)
  const enhancedData = resultCtx.getImageData(0, 0, width, height);
  const enhancedPixels = enhancedData.data;
  
  for (let i = 0; i < enhancedPixels.length; i += 4) {
    const r = enhancedPixels[i];
    const g = enhancedPixels[i + 1];
    const b = enhancedPixels[i + 2];
    
    // 检测暗色文本区域
    if (r < 150 && g < 150 && b < 150) {
      // 使黑色更黑，增加对比度
      const darkFactor = 0.8;
      enhancedPixels[i] = Math.floor(r * darkFactor);
      enhancedPixels[i + 1] = Math.floor(g * darkFactor);
      enhancedPixels[i + 2] = Math.floor(b * darkFactor);
    }
  }
  
  resultCtx.putImageData(enhancedData, 0, 0);
  
  return result;
};

/**
 * 检测图像中的黑色水平线作为分割点
 * @param {HTMLImageElement} img - 图像元素
 * @param {number} threshold - 黑线亮度阈值（0-255，越低表示越黑）
 * @param {number} minLineWidth - 最小有效黑线宽度（像素）
 * @param {number} minLinePercent - 一行中黑色像素所占百分比的最小值，判定为黑线
 * @returns {Array<number>} - 分割线的Y坐标数组
 */
export const detectSplitPoints = (img, threshold = 50, minLineWidth = 2, minLinePercent = 70) => {
  // 创建Canvas来分析图像
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  
  // 获取图像数据
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // 存储可能是黑线的行
  const blackLines = [];
  let currentLineStart = -1;
  
  // 遍历每一行像素
  for (let y = 0; y < height; y++) {
    // 计算这一行中黑色像素的数量
    let blackPixelCount = 0;
    
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      
      // 计算亮度 (简化版RGB平均值)
      const brightness = (r + g + b) / 3;
      
      // 如果像素足够黑
      if (brightness < threshold) {
        blackPixelCount++;
      }
    }
    
    // 检查这一行黑色像素的百分比是否超过阈值
    const blackPixelPercent = (blackPixelCount / width) * 100;
    
    // 如果一行中的黑色像素超过设定的百分比，可能是黑线的一部分
    const isBlackLine = blackPixelPercent > minLinePercent;
    
    // 检测黑线的开始
    if (isBlackLine && currentLineStart === -1) {
      currentLineStart = y;
    } 
    // 检测黑线的结束
    else if (!isBlackLine && currentLineStart !== -1) {
      const lineHeight = y - currentLineStart;
      // 如果黑线宽度足够
      if (lineHeight >= minLineWidth) {
        // 添加黑线的中点作为切割点
        blackLines.push(Math.floor(currentLineStart + lineHeight / 2));
      }
      currentLineStart = -1;
    }
  }
  
  // 处理图像末尾可能的黑线
  if (currentLineStart !== -1) {
    const lineHeight = height - currentLineStart;
    if (lineHeight >= minLineWidth) {
      blackLines.push(Math.floor(currentLineStart + lineHeight / 2));
    }
  }
  
  // 过滤掉太近的切割点
  const filteredLines = [];
  let lastLine = -50; // 初始值设为负数，确保第一个点会被保留
  
  for (const line of blackLines) {
    if (line - lastLine > 50) { // 确保分割线间至少有50像素的距离
      filteredLines.push(line);
      lastLine = line;
    }
  }
  
  return filteredLines;
};

/**
 * 分析并裁剪图像中的空白区域
 * @param {HTMLCanvasElement} canvas - 包含图像的画布
 * @returns {HTMLCanvasElement} - 裁剪后的画布
 */
const trimEmptySpace = (canvas) => {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  
  // 获取图像数据
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // 初始化边界
  let top = height;
  let bottom = 0;
  let left = width;
  let right = 0;
  
  // 检测内容区域边界
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      // 如果像素不是白色（有内容）
      if (data[index] < 250 || data[index + 1] < 250 || data[index + 2] < 250 || data[index + 3] > 0) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  
  // 防止没有内容的情况
  if (top >= bottom || left >= right) {
    return canvas;
  }
  
  // 裁剪内容区域
  const trimWidth = right - left + 1;
  const trimHeight = bottom - top + 1;
  
  const trimmedCanvas = document.createElement('canvas');
  trimmedCanvas.width = trimWidth;
  trimmedCanvas.height = trimHeight;
  
  const trimmedCtx = trimmedCanvas.getContext('2d');
  trimmedCtx.drawImage(
    canvas, 
    left, top, trimWidth, trimHeight,
    0, 0, trimWidth, trimHeight
  );
  
  return trimmedCanvas;
};

/**
 * 将图像切割成多个部分用于PDF生成
 * @param {string} dataUrl - 图像的数据URL
 * @param {Object} options - 切割选项
 * @param {boolean} options.autoDetectSplits - 是否自动检测分割线
 * @param {boolean} options.sharpenImage - 是否应用锐化效果
 * @returns {Promise<Array<{dataUrl: string, width: number, height: number}>>}
 */
export const sliceImage = async (dataUrl, { 
  autoDetectSplits = true,
  splitSensitivity = 50,
  sharpenImage: applySharpen = true
} = {}) => {
  // 在浏览器环境中使用Canvas API处理图像
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const slices = [];
      
      // 默认不再考虑最大高度，只基于黑线分割
      // 如果图像没有可检测到的黑线，则将整个图像作为一个切片返回
      
      // 检测黑线分割点
      const blackThreshold = 120 - splitSensitivity;
      const splitPoints = detectSplitPoints(img, blackThreshold, 2, 60);
      
      // 如果没有找到黑线，返回整张图像
      if (splitPoints.length === 0) {
        // 先绘制到canvas上，方便应用锐化和裁剪
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0);
        
        // 应用锐化效果（如果启用）
        let processedCanvas = canvas;
        if (applySharpen) {
          processedCanvas = sharpenImage(canvas);
        }
        
        // 裁剪空白区域
        const trimmedCanvas = trimEmptySpace(processedCanvas);
        
        slices.push({
          dataUrl: trimmedCanvas.toDataURL('image/png'),
          width: trimmedCanvas.width,
          height: trimmedCanvas.height
        });
        
        resolve(slices);
        return;
      }
      
      // 按检测到的黑线分割图像
      const allSplitPoints = [0, ...splitPoints, height];
      
      // 根据分割点创建切片
      for (let i = 0; i < allSplitPoints.length - 1; i++) {
        let startY = allSplitPoints[i];
        let endY = allSplitPoints[i + 1];
        
        // 计算切片高度
        const sliceHeight = endY - startY;
        
        // 创建Canvas并绘制切片
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = sliceHeight;
        
        ctx.drawImage(
          img, 
          0, startY, 
          width, sliceHeight, 
          0, 0, 
          width, sliceHeight
        );
        
        // 应用锐化效果（如果启用）
        let processedCanvas = canvas;
        if (applySharpen) {
          processedCanvas = sharpenImage(canvas);
        }
        
        // 裁剪空白区域
        const trimmedCanvas = trimEmptySpace(processedCanvas);
        
        slices.push({
          dataUrl: trimmedCanvas.toDataURL('image/png'),
          width: trimmedCanvas.width,
          height: trimmedCanvas.height
        });
      }
      
      resolve(slices);
    };
    
    img.src = dataUrl;
  });
};

/**
 * 创建包含图像的PDF文档
 * @param {Array<{dataUrl: string, width: number, height: number}>} imageSlices - 图像切片数组
 * @param {Object} options - PDF生成选项
 * @param {string} options.pageSize - 页面大小 ('A4', 'Letter', 等)
 * @param {number} options.margin - 页面边距（点）
 * @returns {Promise<Uint8Array>} - PDF文档的二进制数据
 */
export const createPdfFromImages = async (imageSlices, { pageSize = 'A4', margin = 0 } = {}) => {
  const pdfDoc = await PDFDocument.create();
  
  for (const slice of imageSlices) {
    // 创建适合图片尺寸的页面而不是固定A4尺寸
    const { width: imgWidth, height: imgHeight } = slice;
    const pageWidth = imgWidth + 2 * margin;
    const pageHeight = imgHeight + 2 * margin;
    
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    
    // 从数据URL加载图像
    let image;
    if (slice.dataUrl.startsWith('data:image/png')) {
      const pngData = slice.dataUrl.split(',')[1];
      image = await pdfDoc.embedPng(Uint8Array.from(atob(pngData), c => c.charCodeAt(0)));
    } else {
      const jpgData = slice.dataUrl.split(',')[1];
      image = await pdfDoc.embedJpg(Uint8Array.from(atob(jpgData), c => c.charCodeAt(0)));
    }
    
    // 在页面上绘制图像（不进行缩放，保持原始尺寸）
    page.drawImage(image, {
      x: margin,
      y: margin,
      width: imgWidth,
      height: imgHeight,
    });
  }
  
  return pdfDoc.save();
};

/**
 * 从PDF数据创建下载链接
 * @param {Uint8Array} pdfBytes - PDF数据
 * @param {string} filename - 文件名
 * @returns {string} - 下载链接URL
 */
export const createDownloadLink = (pdfBytes, filename = 'longshot.pdf') => {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}; 