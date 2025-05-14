import { PDFDocument } from 'pdf-lib';

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
 * 将图像切割成多个部分用于PDF生成
 * @param {string} dataUrl - 图像的数据URL
 * @param {Object} options - 切割选项
 * @param {number} options.maxHeight - 每页的最大高度（像素）
 * @param {number} options.overlap - 页面间的重叠像素数
 * @param {boolean} options.autoDetectSplits - 是否自动检测分割线
 * @param {number} options.splitSensitivity - 分割线检测灵敏度
 * @returns {Promise<Array<{dataUrl: string, width: number, height: number}>>}
 */
export const sliceImage = async (dataUrl, { 
  maxHeight = 1200, 
  overlap = 50,
  autoDetectSplits = false,
  splitSensitivity = 30
} = {}) => {
  // 在浏览器环境中使用Canvas API处理图像
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const slices = [];
      
      // 如果图像高度小于最大高度，直接返回原图
      if (height <= maxHeight) {
        slices.push({ dataUrl, width, height });
        resolve(slices);
        return;
      }
      
      // 自动检测分割线
      let splitPoints = [];
      if (autoDetectSplits) {
        // 将灵敏度（10-100）转换为黑线亮度阈值（120-20）
        // 灵敏度越高，阈值越低，检测到的线越多
        const blackThreshold = 120 - splitSensitivity;
        splitPoints = detectSplitPoints(img, blackThreshold, 2, 60);
      }
      
      // 如果找不到分割线或未启用自动检测，则使用固定高度切割
      if (splitPoints.length === 0) {
        // 计算需要的切片数量
        const numSlices = Math.ceil(height / (maxHeight - overlap));
        
        for (let i = 0; i < numSlices; i++) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // 最后一个切片的高度可能小于maxHeight
          const sliceHeight = i === numSlices - 1 
            ? height - (maxHeight - overlap) * i 
            : maxHeight;
          
          canvas.width = width;
          canvas.height = sliceHeight;
          
          // 计算切片在原图中的起始位置（添加重叠）
          const startY = Math.max(0, i * (maxHeight - overlap));
          
          // 绘制切片
          ctx.drawImage(
            img, 
            0, startY, 
            width, sliceHeight, 
            0, 0, 
            width, sliceHeight
          );
          
          slices.push({
            dataUrl: canvas.toDataURL('image/png'),
            width,
            height: sliceHeight
          });
        }
      } else {
        // 按检测到的分割线切割
        splitPoints = [0, ...splitPoints, height];
        
        // 如果相邻分割点距离大于最大高度，进一步分割
        const finalSplitPoints = [0];
        
        for (let i = 1; i < splitPoints.length; i++) {
          const prevPoint = splitPoints[i - 1];
          const currentPoint = splitPoints[i];
          const distance = currentPoint - prevPoint;
          
          if (distance > maxHeight) {
            // 需要进一步分割
            const additionalPoints = Math.floor(distance / maxHeight);
            for (let j = 1; j <= additionalPoints; j++) {
              const newPoint = prevPoint + j * maxHeight - Math.min(overlap, maxHeight / 10);
              if (newPoint < currentPoint - 100) {  // 确保新点离下一个点有足够距离
                finalSplitPoints.push(newPoint);
              }
            }
          }
          
          finalSplitPoints.push(currentPoint);
        }
        
        // 根据分割点创建切片
        for (let i = 0; i < finalSplitPoints.length - 1; i++) {
          let startY = finalSplitPoints[i];
          let endY = finalSplitPoints[i + 1];
          
          // 添加重叠（除了第一个切片）
          if (i > 0) {
            startY = Math.max(0, startY - overlap);
          }
          
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
          
          slices.push({
            dataUrl: canvas.toDataURL('image/png'),
            width,
            height: sliceHeight
          });
        }
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
export const createPdfFromImages = async (imageSlices, { pageSize = 'A4', margin = 40 } = {}) => {
  const pdfDoc = await PDFDocument.create();
  
  for (const slice of imageSlices) {
    const page = pdfDoc.addPage([595, 842]); // A4 尺寸
    const { width, height } = page.getSize();
    
    // 从数据URL加载图像
    let image;
    if (slice.dataUrl.startsWith('data:image/png')) {
      const pngData = slice.dataUrl.split(',')[1];
      image = await pdfDoc.embedPng(Uint8Array.from(atob(pngData), c => c.charCodeAt(0)));
    } else {
      const jpgData = slice.dataUrl.split(',')[1];
      image = await pdfDoc.embedJpg(Uint8Array.from(atob(jpgData), c => c.charCodeAt(0)));
    }
    
    // 计算图像在页面上的尺寸，保持宽高比
    const imageWidth = width - 2 * margin;
    const imageHeight = (imageWidth / slice.width) * slice.height;
    
    // 在页面上绘制图像
    page.drawImage(image, {
      x: margin,
      y: height - margin - imageHeight,
      width: imageWidth,
      height: imageHeight,
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