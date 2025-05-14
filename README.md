# LongShotPDF

一个简单的工具，用于将手机长截图切割并转换为PDF文档。

## 功能特点

- 导入长截图图片文件
- **严格按照黑色水平线切割截图**
- **图像锐化优化，提高清晰度**
- 生成PDF文档
- 简洁直观的用户界面

## 技术栈

- React（前端框架）
- Next.js（React框架）
- PDF-LIB（PDF生成）
- Sharp（图像处理）
- Tailwind CSS（样式）

## 部署方式

### 方式一：从Docker Hub拉取镜像（推荐）

在支持Docker的设备上（如NAS）直接拉取预构建的镜像：

```bash
# 拉取镜像
docker pull xp9477/longshot-pdf:latest

# 运行容器
docker run -d -p 3000:3000 --name longshot-pdf xp9477/longshot-pdf:latest
```

然后在浏览器中访问 `http://设备IP:3000`

### 方式二：本地安装

#### 安装依赖

```bash
npm install
# 或
yarn install
```

#### 开发环境运行

```bash
npm run dev
# 或
yarn dev
```

#### 生产环境部署

```bash
npm run build
npm start
# 或
yarn build
yarn start
```

## 使用方法

1. 点击上传按钮或拖拽图片到指定区域
2. 调整设置（可选）
   - 图像锐化：默认开启，提高图像清晰度
   - 页面边距：调整PDF边距，默认为0
3. 点击"生成切片预览"查看切割效果
4. 点击"生成PDF"按钮
5. 下载生成的PDF文件

## 功能说明

### 黑线检测分割

此功能会分析图片内容，精确检测黑色水平线（如分隔符、章节分割线等），并在这些位置切割图片。这种方式可以确保PDF页面划分准确，完全按照图片中的黑线作为分隔。

### 图像锐化

通过卷积算法增强图像边缘细节，使文字和线条更加清晰，提高生成PDF的质量。特别适合处理略显模糊的截图。

### 其他设置

- 页面边距：PDF页面的边距，默认为0
  
