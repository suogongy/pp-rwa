import { useState } from 'react'
import { useIPFSHistory, IPFSHistoryItem } from '@/lib/ipfs-history'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Trash2, 
  Download, 
  ExternalLink, 
  Image as ImageIcon, 
  FileText,
  Calendar,
  HardDrive,
  Package
} from 'lucide-react'

export function IPFSHistoryViewer() {
  const { history, stats, removeFromHistory, clearHistory, searchHistory, filterByType } = useIPFSHistory()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'file' | 'metadata'>('all')
  const [selectedItem, setSelectedItem] = useState<IPFSHistoryItem | null>(null)

  // 筛选和搜索历史记录
  const filteredHistory = history.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cid.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filter === 'all' || item.type === filter
    
    return matchesSearch && matchesFilter
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总上传数</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              最近7天: {stats.recentUploads}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">文件数量</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.files}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">元数据数量</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.metadata}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总大小</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>上传历史记录</span>
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
              disabled={history.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              清空历史
            </Button>
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索文件名或CID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                全部 ({history.length})
              </Button>
              <Button
                variant={filter === 'file' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('file')}
              >
                文件 ({stats.files})
              </Button>
              <Button
                variant={filter === 'metadata' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('metadata')}
              >
                元数据 ({stats.metadata})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {history.length === 0 ? '还没有上传记录' : '没有找到匹配的记录'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{item.name}</h3>
                        <Badge variant={item.type === 'file' ? 'default' : 'secondary'}>
                          {item.type === 'file' ? '文件' : '元数据'}
                        </Badge>
                        <Badge variant="outline">
                          {formatDate(item.timestamp)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="font-mono bg-gray-100 px-2 py-1 rounded">
                          CID: {item.cid}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-6 w-6 p-0"
                            onClick={() => copyToClipboard(item.cid)}
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </Button>
                        </div>
                        
                        {item.size && (
                          <div>大小: {formatFileSize(item.size)}</div>
                        )}
                        
                        {item.metadata?.description && (
                          <div>描述: {item.metadata.description}</div>
                        )}
                        
                        {item.gatewayUrls && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.gatewayUrls.map((gateway, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(gateway.url, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                {gateway.name}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedItem(item)}
                      >
                        详情
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromHistory(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 详情对话框 */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedItem.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedItem(null)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">类型:</span>
                  <Badge className="ml-2">{selectedItem.type === 'file' ? '文件' : '元数据'}</Badge>
                </div>
                <div>
                  <span className="font-medium">上传时间:</span>
                  <span className="ml-2">{formatDate(selectedItem.timestamp)}</span>
                </div>
                {selectedItem.size && (
                  <div>
                    <span className="font-medium">大小:</span>
                    <span className="ml-2">{formatFileSize(selectedItem.size)}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium">CID:</span>
                  <div className="font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                    {selectedItem.cid}
                  </div>
                </div>
              </div>
              
              {selectedItem.metadata?.description && (
                <div>
                  <span className="font-medium">描述:</span>
                  <p className="mt-1">{selectedItem.metadata.description}</p>
                </div>
              )}
              
              {selectedItem.metadata?.attributes && (
                <div>
                  <span className="font-medium">属性:</span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {selectedItem.metadata.attributes.map((attr, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded">
                        <div className="font-medium text-sm">{attr.trait_type}</div>
                        <div className="text-sm text-muted-foreground">{attr.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedItem.gatewayUrls && (
                <div>
                  <span className="font-medium">访问链接:</span>
                  <div className="space-y-2 mt-2">
                    {selectedItem.gatewayUrls.map((gateway, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="outline">{gateway.name}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(gateway.url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          打开
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}