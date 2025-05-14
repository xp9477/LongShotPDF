import { useState } from 'react';

const SettingsForm = ({ defaultSettings, onSettingsChange }) => {
  const [settings, setSettings] = useState(defaultSettings);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : type === 'number' ? Number(value) : value;
    
    const updatedSettings = {
      ...settings,
      [name]: newValue
    };
    
    setSettings(updatedSettings);
    onSettingsChange(updatedSettings);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">PDF设置</h2>
      
      <div className="space-y-4">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="autoDetectSplits"
              name="autoDetectSplits"
              type="checkbox"
              checked={settings.autoDetectSplits}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="autoDetectSplits" className="font-medium text-gray-700">自动检测黑线分割</label>
            <p className="text-gray-500">智能检测图片中的黑色水平线作为分割点</p>
          </div>
        </div>

        {settings.autoDetectSplits && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              检测灵敏度
            </label>
            <input
              type="range"
              name="splitSensitivity"
              value={settings.splitSensitivity}
              onChange={handleChange}
              min="10"
              max="100"
              step="5"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>低 (仅检测明显黑线)</span>
              <span>高 (检测较浅黑线)</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              当前值: {settings.splitSensitivity}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            切片最大高度 (像素)
          </label>
          <input
            type="number"
            name="maxHeight"
            value={settings.maxHeight}
            onChange={handleChange}
            min="500"
            max="3000"
            step="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            每页的最大高度，建议介于1000-1500之间
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            切片重叠像素
          </label>
          <input
            type="number"
            name="overlap"
            value={settings.overlap}
            onChange={handleChange}
            min="0"
            max="200"
            step="10"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            页面间的重叠像素数，避免切割内容不完整
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            页面边距 (点)
          </label>
          <input
            type="number"
            name="margin"
            value={settings.margin}
            onChange={handleChange}
            min="10"
            max="100"
            step="5"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            PDF页面边距，默认为40点
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsForm; 