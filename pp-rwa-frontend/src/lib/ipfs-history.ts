/**
 * IPFS历史记录管理工具
 * 用于持久化存储上传历史
 */

export interface IPFSHistoryItem {
  id: string
  timestamp: number
  type: 'file' | 'metadata'
  name: string
  cid: string
  size?: number
  url?: string
  gatewayUrls?: Array<{ name: string; url: string; isLocal: boolean }>
  metadata?: {
    description?: string
    attributes?: Array<{
      trait_type: string
      value: string | number
    }>
  }
}

const STORAGE_KEY = 'ipfs_upload_history'

class IPFSHistoryManager {
  /**
   * 获取所有历史记录
   */
  getHistory(): IPFSHistoryItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('获取IPFS历史记录失败:', error)
      return []
    }
  }

  /**
   * 添加历史记录
   */
  addToHistory(item: Omit<IPFSHistoryItem, 'id' | 'timestamp'>): void {
    try {
      const history = this.getHistory()
      const newItem: IPFSHistoryItem = {
        ...item,
        id: this.generateId(),
        timestamp: Date.now()
      }
      
      history.unshift(newItem) // 添加到开头
      
      // 限制历史记录数量（最多100条）
      if (history.length > 100) {
        history.splice(100)
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
      
      // 触发存储事件，让其他组件知道历史记录已更新
      window.dispatchEvent(new CustomEvent('ipfs-history-updated'))
    } catch (error) {
      console.error('添加IPFS历史记录失败:', error)
    }
  }

  /**
   * 删除历史记录
   */
  removeFromHistory(id: string): void {
    try {
      const history = this.getHistory()
      const filtered = history.filter(item => item.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
      
      window.dispatchEvent(new CustomEvent('ipfs-history-updated'))
    } catch (error) {
      console.error('删除IPFS历史记录失败:', error)
    }
  }

  /**
   * 清空历史记录
   */
  clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
      window.dispatchEvent(new CustomEvent('ipfs-history-updated'))
    } catch (error) {
      console.error('清空IPFS历史记录失败:', error)
    }
  }

  /**
   * 搜索历史记录
   */
  searchHistory(query: string): IPFSHistoryItem[] {
    const history = this.getHistory()
    const lowercaseQuery = query.toLowerCase()
    
    return history.filter(item => 
      item.name.toLowerCase().includes(lowercaseQuery) ||
      item.cid.toLowerCase().includes(lowercaseQuery) ||
      item.metadata?.description?.toLowerCase().includes(lowercaseQuery)
    )
  }

  /**
   * 按类型筛选历史记录
   */
  filterByType(type: 'file' | 'metadata'): IPFSHistoryItem[] {
    const history = this.getHistory()
    return history.filter(item => item.type === type)
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    total: number
    files: number
    metadata: number
    totalSize: number
    recentUploads: number // 最近7天的上传数量
  } {
    const history = this.getHistory()
    const now = Date.now()
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000
    
    return {
      total: history.length,
      files: history.filter(item => item.type === 'file').length,
      metadata: history.filter(item => item.type === 'metadata').length,
      totalSize: history.reduce((sum, item) => sum + (item.size || 0), 0),
      recentUploads: history.filter(item => item.timestamp > weekAgo).length
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}

// 导出单例实例
export const ipfsHistory = new IPFSHistoryManager()

/**
 * React Hook for IPFS历史记录
 */
export function useIPFSHistory() {
  const [history, setHistory] = useState<IPFSHistoryItem[]>([])
  const [stats, setStats] = useState(ipfsHistory.getStats())

  // 监听历史记录更新
  useEffect(() => {
    const loadHistory = () => {
      setHistory(ipfsHistory.getHistory())
      setStats(ipfsHistory.getStats())
    }

    // 初始加载
    loadHistory()

    // 监听自定义事件
    const handleUpdate = () => loadHistory()
    window.addEventListener('ipfs-history-updated', handleUpdate)

    // 监听storage事件（跨标签页同步）
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        loadHistory()
      }
    })

    return () => {
      window.removeEventListener('ipfs-history-updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  return {
    history,
    stats,
    addToHistory: ipfsHistory.addToHistory.bind(ipfsHistory),
    removeFromHistory: ipfsHistory.removeFromHistory.bind(ipfsHistory),
    clearHistory: ipfsHistory.clearHistory.bind(ipfsHistory),
    searchHistory: ipfsHistory.searchHistory.bind(ipfsHistory),
    filterByType: ipfsHistory.filterByType.bind(ipfsHistory)
  }
}

// 需要导入React
import { useState, useEffect } from 'react'