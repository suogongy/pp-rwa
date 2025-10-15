'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AssetData {
  name: string
  type: string
  description: string
  location: string
  totalValue: string
  expectedReturn: string
  documents: File[]
  legalInfo: string
  riskLevel: string
}

export function AssetRegistration({ isConnected }: { isConnected: boolean }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [totalSteps] = useState(4)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<AssetData>({
    name: '',
    type: '',
    description: '',
    location: '',
    totalValue: '',
    expectedReturn: '',
    documents: [],
    legalInfo: '',
    riskLevel: ''
  })

  const assetTypes = [
    { value: 'real-estate', label: '房地产', description: '商业地产、住宅地产等' },
    { value: 'bond', label: '债券', description: '政府债券、企业债券等' },
    { value: 'commodity', label: '商品', description: '贵金属、能源、农产品等' },
    { value: 'art', label: '艺术品', description: '画作、雕塑、古董等' },
    { value: 'infrastructure', label: '基础设施', description: '交通、能源、通信设施等' }
  ]

  const riskLevels = [
    { value: 'low', label: '低风险', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: '中等风险', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: '高风险', color: 'bg-red-100 text-red-800' }
  ]

  const handleInputChange = (field: keyof AssetData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setFormData(prev => ({ ...prev, documents: [...prev.documents, ...files] }))
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // 模拟提交过程
    await new Promise(resolve => setTimeout(resolve, 3000))
    setIsSubmitting(false)
    // 这里应该调用智能合约进行资产代币化
    alert('资产登记申请已提交，等待审核')
  }

  if (!isConnected) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">请连接钱包</h3>
          <p className="text-gray-600">连接钱包以进行资产登记</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 进度指示器 */}
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">资产登记流程</h3>
            <Badge variant="outline">步骤 {currentStep} / {totalSteps}</Badge>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          <div className="grid grid-cols-4 gap-2 mt-4">
            {['基本信息', '资产详情', '法律文件', '审核确认'].map((step, index) => (
              <div
                key={index}
                className={`text-center p-2 rounded-lg text-sm ${
                  index + 1 === currentStep
                    ? 'bg-blue-100 text-blue-800 font-semibold'
                    : index + 1 < currentStep
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {step}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>登记新资产</CardTitle>
          <CardDescription>将您的现实世界资产代币化，提高流动性和可交易性</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  资产名称 *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="例如：上海商业广场A座"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  资产类型 *
                </label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择资产类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-gray-500">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  资产描述 *
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="详细描述您的资产特征、状况、位置等信息"
                  rows={4}
                  className="w-full"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNext} disabled={!formData.name || !formData.type || !formData.description}>
                  下一步
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    资产位置
                  </label>
                  <Input
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="例如：上海市浦东新区陆家嘴"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    总估值 (CNY) *
                  </label>
                  <Input
                    type="number"
                    value={formData.totalValue}
                    onChange={(e) => handleInputChange('totalValue', e.target.value)}
                    placeholder="例如：100000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    预期年化收益率 (%) *
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.expectedReturn}
                    onChange={(e) => handleInputChange('expectedReturn', e.target.value)}
                    placeholder="例如：8.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    风险等级 *
                  </label>
                  <Select value={formData.riskLevel} onValueChange={(value) => handleInputChange('riskLevel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择风险等级" />
                    </SelectTrigger>
                    <SelectContent>
                      {riskLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <Badge className={level.color}>{level.label}</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">估值说明</h4>
                <p className="text-sm text-blue-700">
                  请提供专业的第三方评估报告作为估值依据。估值将影响代币发行价格和投资者收益预期。
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handlePrevious}>
                  上一步
                </Button>
                <Button onClick={handleNext} disabled={!formData.totalValue || !formData.expectedReturn || !formData.riskLevel}>
                  下一步
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  上传相关文件
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="text-gray-600">
                      <p>点击上传文件或拖拽文件到此处</p>
                      <p className="text-sm mt-1">支持PDF、DOC、DOCX、JPG、PNG格式</p>
                    </div>
                  </label>
                </div>

                {formData.documents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-gray-900">已上传文件：</h4>
                    {formData.documents.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Badge variant="outline">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  法律信息
                </label>
                <Textarea
                  value={formData.legalInfo}
                  onChange={(e) => handleInputChange('legalInfo', e.target.value)}
                  placeholder="请提供资产的法律状态、所有权证明、相关许可等信息"
                  rows={4}
                  className="w-full"
                />
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">文件要求</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 资产所有权证明文件</li>
                  <li>• 第三方评估报告</li>
                  <li>• 法律合规文件</li>
                  <li>• 保险证明（如有）</li>
                </ul>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handlePrevious}>
                  上一步
                </Button>
                <Button onClick={handleNext}>
                  下一步
                </Button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">确认信息</h4>
                <p className="text-sm text-green-700">
                  请仔细核对以下信息，确认无误后提交审核。提交后将无法修改。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h5 className="font-medium text-gray-900">基本信息</h5>
                  <div className="text-sm space-y-1">
                    <div><span className="text-gray-600">资产名称:</span> {formData.name}</div>
                    <div><span className="text-gray-600">资产类型:</span> {assetTypes.find(t => t.value === formData.type)?.label}</div>
                    <div><span className="text-gray-600">位置:</span> {formData.location}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium text-gray-900">财务信息</h5>
                  <div className="text-sm space-y-1">
                    <div><span className="text-gray-600">总估值:</span> ¥{Number(formData.totalValue).toLocaleString()}</div>
                    <div><span className="text-gray-600">预期收益:</span> {formData.expectedReturn}%</div>
                    <div><span className="text-gray-600">风险等级:</span> {riskLevels.find(r => r.value === formData.riskLevel)?.label}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-medium text-gray-900">资产描述</h5>
                <p className="text-sm text-gray-700">{formData.description}</p>
              </div>

              <div className="space-y-2">
                <h5 className="font-medium text-gray-900">法律信息</h5>
                <p className="text-sm text-gray-700">{formData.legalInfo || '未填写'}</p>
              </div>

              <div className="space-y-2">
                <h5 className="font-medium text-gray-900">上传文件 ({formData.documents.length}个)</h5>
                <div className="text-sm text-gray-700">
                  {formData.documents.map((file, index) => (
                    <div key={index}>• {file.name}</div>
                  ))}
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-900 mb-2">注意事项</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• 提交后需要等待平台审核</li>
                  <li>• 审核时间通常为3-5个工作日</li>
                  <li>• 审核通过后将自动进行代币化</li>
                  <li>• 请确保所有信息真实有效</li>
                </ul>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handlePrevious}>
                  上一步
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? '提交中...' : '提交审核'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}