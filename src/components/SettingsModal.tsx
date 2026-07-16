import React, { useState } from 'react'
import { useSyncStore } from '@/store/syncStore'
import Modal from './Modal'

const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { config, updateConfig, testConnection, uploadToCloud, downloadFromCloud, syncing, syncStatus, syncMessage } = useSyncStore()
  const [form, setForm] = useState({ ...config })

  const handleSave = () => {
    updateConfig(form)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="云端同步设置 (WebDAV)"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary btn-sm"
              disabled={syncing}
              onClick={() => {
                updateConfig(form)
                setTimeout(() => testConnection(), 100)
              }}
            >
              测试连接
            </button>
            <button
              className="btn-primary btn-sm"
              disabled={syncing}
              onClick={downloadFromCloud}
            >
              从云端恢复
            </button>
            <button
              className="btn-primary btn-sm"
              disabled={syncing}
              onClick={uploadToCloud}
            >
              备份到云端
            </button>
          </div>
          <button className="btn-secondary" onClick={onClose}>
            关闭
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div
          className="text-sm p-3 rounded-xl"
          style={{
            background: 'rgba(96, 165, 250, 0.08)',
            border: '1px solid rgba(96, 165, 250, 0.15)',
            color: '#60a5fa',
          }}
        >
          <p>支持 WebDAV 协议，以下云盘可用：</p>
          <ul className="list-disc ml-5 mt-1">
            <li>坚果云 WebDAV</li>
            <li>Nextcloud / 群晖 / OneDrive（支持 WebDAV）</li>
            <li>iCloud Drive（通过 WebDAV 访问）</li>
          </ul>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">WebDAV 地址</label>
          <input
            className="input"
            placeholder="https://dav.jianguoyun.com/dav/你的目录/"
            value={form.webdavUrl}
            onChange={(e) => setForm({ ...form, webdavUrl: e.target.value })}
          />
          <p className="text-xs text-muted-foreground mt-1">地址需要包含 https://，结尾不需要 /v1，会自动拼接</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">用户名 / 账号</label>
          <input
            className="input"
            placeholder="你的用户名"
            value={form.webdavUser}
            onChange={(e) => setForm({ ...form, webdavUser: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">密码 / 授权码</label>
          <input
            className="input"
            type="password"
            placeholder="你的密码"
            value={form.webdavPassword}
            onChange={(e) => setForm({ ...form, webdavPassword: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">备份路径</label>
          <input
            className="input"
            placeholder="/pm-workbench-backup.json"
            value={form.syncPath}
            onChange={(e) => setForm({ ...form, syncPath: e.target.value })}
          />
          <p className="text-xs text-muted-foreground mt-1">备份文件会保存到这个路径</p>
        </div>
        {syncStatus !== 'idle' && (
          <div
            className="p-3 rounded-xl text-sm"
            style={{
              background:
                syncStatus === 'success'
                  ? 'rgba(52, 211, 153, 0.08)'
                  : syncStatus === 'error'
                    ? 'rgba(248, 113, 113, 0.08)'
                    : 'rgba(96, 165, 250, 0.08)',
              border: `1px solid ${
                syncStatus === 'success'
                  ? 'rgba(52, 211, 153, 0.15)'
                  : syncStatus === 'error'
                    ? 'rgba(248, 113, 113, 0.15)'
                    : 'rgba(96, 165, 250, 0.15)'
              }`,
              color:
                syncStatus === 'success'
                  ? '#34d399'
                  : syncStatus === 'error'
                    ? '#f87171'
                    : '#60a5fa',
            }}
          >
            <p>{syncMessage}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default SettingsModal
