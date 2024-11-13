import React, { useState } from 'react';
import { Bell, ChevronDown, ChevronRight, Volume2, Vibrate, Radio, Eye } from 'lucide-react';
import { NotificationService, NotificationPreferences } from '../../services/NotificationService';

interface NotificationSettingsProps {
  expanded: boolean;
  onToggle: () => void;
}

export default function NotificationSettings({ expanded, onToggle }: NotificationSettingsProps) {
  const notificationService = NotificationService.getInstance();
  const [settings, setSettings] = useState<NotificationPreferences>(
    notificationService.getSettings()
  );

  const handleSettingChange = (key: keyof NotificationPreferences, value: boolean | string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    notificationService.saveSettings({ [key]: value });
  };

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:theme-bg-secondary transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Bell className="w-5 h-5 text-blue-500" />
          <span className="theme-text">Notifiche</span>
        </div>
        {expanded ? (
          <ChevronDown className="w-5 h-5 theme-text" />
        ) : (
          <ChevronRight className="w-5 h-5 theme-text" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Volume2 className="w-5 h-5 text-green-500" />
                <span className="theme-text">Suoni</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.sound}
                  onChange={(e) => handleSettingChange('sound', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Vibrate className="w-5 h-5 text-purple-500" />
                <span className="theme-text">Vibrazione</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.vibration}
                  onChange={(e) => handleSettingChange('vibration', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Radio className="w-5 h-5 text-orange-500" />
                <span className="theme-text">Notifiche in background</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.background}
                  onChange={(e) => handleSettingChange('background', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Eye className="w-5 h-5 text-cyan-500" />
                <span className="theme-text">Anteprima messaggi</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.preview}
                  onChange={(e) => handleSettingChange('preview', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t theme-divide">
            <p className="text-sm theme-text opacity-70">
              Le notifiche ti permettono di rimanere aggiornato sui nuovi messaggi e chiamate anche quando l'app è in background.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}