'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ipfsClient, NFTTemplates, type NFTMetadata } from '@/lib/ipfs'

interface IPFSUploadProps {
  onUploadComplete?: (metadataUrl: string) => void
}

export function IPFSUpload({ onUploadComplete }: IPFSUploadProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('realEstate')
  const [customMetadata, setCustomMetadata] = useState<NFTMetadata>({
    name: '',
    description: '',
    image: '',
    attributes: []
  })
  const [templateData, setTemplateData] = useState({
    address: '',
    value: '',
    title: '',
    artist: '',
    year: '',
    type: '',
    weight: '',
    purity: ''
  })
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    imageResult?: UploadResult
    metadataResult?: UploadResult
    error?: string
  }>({})
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setUploadResult({ error: '请选择JPEG、PNG、GIF或WebP格式的图片' })
        return
      }
      
      // 验证文件大小 (10MB限制)
      if (file.size > 10 * 1024 * 1024) {
        setUploadResult({ error: '文件大小不能超过10MB' })
        return
      }
      
      setSelectedFile(file)
      setUploadResult({})
    }
  }

  const generateMetadataFromTemplate = (): NFTMetadata => {
    switch (selectedTemplate) {
      case 'realEstate':
        return NFTTemplates.realEstate(
          templateData.address || '未知地址',
          parseInt(templateData.value) || 0
        )
      case 'artwork':
        return NFTTemplates.artwork(
          templateData.title || '未命名作品',
          templateData.artist || '未知艺术家',
          parseInt(templateData.year) || new Date().getFullYear()
        )
      case 'commodity':
        return NFTTemplates.commodity(
          templateData.type || '未知商品',
          parseFloat(templateData.weight) || 0,
          parseFloat(templateData.purity) || 0
        )
      default:
        return customMetadata
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadResult({ error: '请选择图片文件' })
      return
    }

    const metadata = generateMetadataFromTemplate()
    
    if (!metadata.name || !metadata.description) {
      setUploadResult({ error: '请填写完整的元数据信息' })
      return
    }

    setIsUploading(true)
    setUploadResult({})

    try {
      const result = await ipfsClient.createAndUploadNFTMetadata(
        metadata.name,
        metadata.description,
        selectedFile,
        metadata.attributes
      )

      setUploadResult(result)

      if (result.metadataResult.success) {
        onUploadComplete?.(result.metadataResult.url!)
      }
    } catch (error) {
      setUploadResult({ 
        error: error instanceof Error ? error.message : '上传失败' 
      })
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setUploadResult({})
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>IPFS NFT元数据上传</CardTitle>
          <CardDescription>
            上传NFT图片和元数据到IPFS网络，生成去中心化的NFT资源
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="template" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="template">使用模板</TabsTrigger>
              <TabsTrigger value="custom">自定义</TabsTrigger>
            </TabsList>
            
            <TabsContent value="template" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>选择模板类型</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                    {[
                      { id: 'realEstate', name: '房地产', icon: '🏠' },
                      { id: 'artwork', name: '艺术品', icon: '🎨' },
                      { id: 'commodity', name: '大宗商品', icon: '💎' }
                    ].map((template) => (
                      <div
                        key={template.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedTemplate === template.id
                            ? 'ring-2 ring-blue-500 bg-blue-50'
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedTemplate(template.id)}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">{template.icon}</div>
                          <div className="text-sm font-medium">{template.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 模板特定字段 */}
                {selectedTemplate === 'realEstate' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">房产地址</Label>
                      <Input
                        id="address"
                        placeholder="例如：北京市朝阳区xxx街道"
                        value={templateData.address}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="value">估值 (美元)</Label>
                      <Input
                        id="value"
                        type="number"
                        placeholder="1000000"
                        value={templateData.value}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, value: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {selectedTemplate === 'artwork' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">作品标题</Label>
                      <Input
                        id="title"
                        placeholder="星空"
                        value={templateData.title}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="artist">艺术家</Label>
                      <Input
                        id="artist"
                        placeholder="梵高"
                        value={templateData.artist}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, artist: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">创作年份</Label>
                      <Input
                        id="year"
                        type="number"
                        placeholder="1889"
                        value={templateData.year}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, year: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {selectedTemplate === 'commodity' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">商品类型</Label>
                      <Input
                        id="type"
                        placeholder="黄金"
                        value={templateData.type}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, type: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">重量 (克)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        placeholder="100"
                        value={templateData.weight}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, weight: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purity">纯度 (%)</Label>
                      <Input
                        id="purity"
                        type="number"
                        placeholder="99.9"
                        value={templateData.purity}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, purity: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customName">NFT名称</Label>
                  <Input
                    id="customName"
                    placeholder="我的NFT"
                    value={customMetadata.name}
                    onChange={(e) => setCustomMetadata(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customDescription">描述</Label>
                  <Input
                    id="customDescription"
                    placeholder="这是一个独特的NFT"
                    value={customMetadata.description}
                    onChange={(e) => setCustomMetadata(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>自定义属性 (可选)</Label>
                <div className="text-sm text-gray-600 mb-2">
                  添加自定义属性来增强NFT的价值和独特性
                </div>
                {/* 这里可以添加动态属性添加功能 */}
              </div>
            </TabsContent>
          </Tabs>

          {/* 文件上传 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="imageFile">选择图片文件</Label>
              <Input
                id="imageFile"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                支持 JPEG、PNG、GIF、WebP 格式，最大10MB
              </p>
            </div>

            {selectedFile && (
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🖼️</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium">{selectedFile.name}</div>
                  <div className="text-sm text-gray-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={resetForm}>
                  重新选择
                </Button>
              </div>
            )}
          </div>

          {/* 上传按钮 */}
          <div className="flex space-x-4">
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex-1"
            >
              {isUploading ? '上传中...' : '上传到IPFS'}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              重置
            </Button>
          </div>

          {/* 上传结果 */}
          {uploadResult.error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                ❌ 上传失败: {uploadResult.error}
              </AlertDescription>
            </Alert>
          )}

          {uploadResult.metadataResult?.success && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">
                  ✅ 上传成功！元数据已保存到IPFS
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">图片信息</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-xs">
                      <div className="font-medium">CID:</div>
                      <div className="text-gray-600 break-all">
                        {uploadResult.imageResult?.cid}
                      </div>
                    </div>
                    <div className="text-xs">
                      <div className="font-medium">URL:</div>
                      <div className="text-gray-600 break-all">
                        {uploadResult.imageResult?.url}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">元数据信息</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-xs">
                      <div className="font-medium">CID:</div>
                      <div className="text-gray-600 break-all">
                        {uploadResult.metadataResult?.cid}
                      </div>
                    </div>
                    <div className="text-xs">
                      <div className="font-medium">URL:</div>
                      <div className="text-gray-600 break-all">
                        {uploadResult.metadataResult?.url}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">使用此元数据URL铸造NFT</h4>
                <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded break-all">
                  {uploadResult.metadataResult?.url}
                </div>
                <Button 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    navigator.clipboard.writeText(uploadResult.metadataResult?.url || '')
                  }}
                >
                  复制URL
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">环境变量配置</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• NEXT_PUBLIC_IPFS_API_URL: Pinata API URL</div>
                <div>• NEXT_PUBLIC_IPFS_API_KEY: Pinata API Key</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">最佳实践</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• 使用高质量的图片文件</div>
                <div>• 确保元数据信息准确完整</div>
                <div>• 保存好生成的CID和URL</div>
              </div>
            </div>
          </div>
          
          <Alert>
            <AlertDescription>
              <strong>注意：</strong>上传到IPFS的数据是永久性的，请确保您有权利分享这些内容。
              当前使用Pinata服务进行IPFS托管，请确保已配置正确的API密钥。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}