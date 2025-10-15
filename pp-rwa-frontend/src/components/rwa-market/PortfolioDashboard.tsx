'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Asset {
  id: string
  name: string
  type: 'real-estate' | 'bond' | 'commodity' | 'art'
  value: number
  amount: number
  apy: number
  change24h: number
}

interface Position {
  id: string
  assetName: string
  amount: number
  value: number
  pnl: number
  pnlPercent: number
}

export function PortfolioDashboard({ isConnected }: { isConnected: boolean }) {
  const [totalValue, setTotalValue] = useState(2580000)
  const [totalPnl, setTotalPnl] = useState(125000)
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: '1',
      name: '上海商业地产基金',
      type: 'real-estate',
      value: 1200000,
      amount: 12000,
      apy: 8.5,
      change24h: 2.3
    },
    {
      id: '2',
      name: '政府债券组合',
      type: 'bond',
      value: 800000,
      amount: 8000,
      apy: 4.2,
      change24h: 0.8
    },
    {
      id: '3',
      name: '黄金ETF代币',
      type: 'commodity',
      value: 380000,
      amount: 3800,
      apy: 3.5,
      change24h: -0.5
    },
    {
      id: '4',
      name: '数字艺术品NFT',
      type: 'art',
      value: 200000,
      amount: 5,
      apy: 12.0,
      change24h: 5.2
    }
  ])

  const [positions, setPositions] = useState<Position[]>([
    {
      id: '1',
      assetName: 'RWA20 - 上海地产',
      amount: 12000,
      value: 1200000,
      pnl: 28000,
      pnlPercent: 2.4
    },
    {
      id: '2',
      assetName: 'RWA721 - 数字艺术#001',
      amount: 1,
      value: 45000,
      pnl: 2200,
      pnlPercent: 5.1
    },
    {
      id: '3',
      assetName: '质押奖励',
      amount: 2500,
      value: 250000,
      pnl: 15600,
      pnlPercent: 6.7
    }
  ])

  const getAssetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'real-estate': '房地产',
      'bond': '债券',
      'commodity': '商品',
      'art': '艺术品'
    }
    return labels[type] || type
  }

  const getAssetTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'real-estate': 'bg-blue-100 text-blue-800',
      'bond': 'bg-green-100 text-green-800',
      'commodity': 'bg-yellow-100 text-yellow-800',
      'art': 'bg-purple-100 text-purple-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (!isConnected) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">请连接钱包</h3>
          <p className="text-gray-600">连接钱包以查看您的资产组合详情</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 资产概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">总资产价值</div>
            <div className="text-2xl font-bold text-gray-900">¥{totalValue.toLocaleString()}</div>
            <div className="text-sm text-green-600 mt-1">+{((totalPnl / totalValue) * 100).toFixed(2)}%</div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">总收益</div>
            <div className="text-2xl font-bold text-green-600">¥{totalPnl.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1">今日收益: ¥18,500</div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">平均年化收益</div>
            <div className="text-2xl font-bold text-blue-600">7.8%</div>
            <div className="text-sm text-gray-500 mt-1">加权平均APY</div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">风险评级</div>
            <div className="text-2xl font-bold text-orange-600">中等</div>
            <div className="text-sm text-gray-500 mt-1">多样化投资组合</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assets" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assets">资产配置</TabsTrigger>
          <TabsTrigger value="positions">持仓详情</TabsTrigger>
          <TabsTrigger value="performance">收益分析</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>资产配置</CardTitle>
              <CardDescription>您的RWA资产投资组合分布</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getAssetTypeColor(asset.type)}>
                          {getAssetTypeLabel(asset.type)}
                        </Badge>
                        <h4 className="font-semibold text-gray-900">{asset.name}</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">持有数量:</span>
                          <span className="ml-1 font-medium">{asset.amount.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">当前价值:</span>
                          <span className="ml-1 font-medium">¥{asset.value.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">年化收益:</span>
                          <span className="ml-1 font-medium text-green-600">{asset.apy}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">24h变化:</span>
                          <span className={`ml-1 font-medium ${asset.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-right mb-2">
                        <div className="text-sm text-gray-600">占比</div>
                        <div className="font-semibold">{((asset.value / totalValue) * 100).toFixed(1)}%</div>
                      </div>
                      <Progress
                        value={(asset.value / totalValue) * 100}
                        className="w-20 h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>持仓详情</CardTitle>
              <CardDescription>当前持仓和收益情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {positions.map((position) => (
                  <div key={position.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{position.assetName}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">数量:</span>
                          <span className="ml-1 font-medium">{position.amount.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">价值:</span>
                          <span className="ml-1 font-medium">¥{position.value.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">收益率:</span>
                          <span className={`ml-1 font-medium ${position.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm text-gray-600">盈亏</div>
                      <div className={`font-bold ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {position.pnl >= 0 ? '+' : ''}¥{position.pnl.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>收益分析</CardTitle>
              <CardDescription>历史收益表现和趋势分析</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">本月收益</h4>
                  <div className="text-2xl font-bold text-blue-600 mb-1">¥35,800</div>
                  <div className="text-sm text-blue-700">较上月 +12.5%</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">累计收益</h4>
                  <div className="text-2xl font-bold text-green-600 mb-1">¥125,000</div>
                  <div className="text-sm text-green-700">年化收益率 7.8%</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">最佳表现资产</h4>
                  <div className="text-lg font-bold text-purple-600 mb-1">数字艺术品NFT</div>
                  <div className="text-sm text-purple-700">收益率 +15.2%</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">风险指标</h4>
                  <div className="text-lg font-bold text-orange-600 mb-1">夏普比率 1.85</div>
                  <div className="text-sm text-orange-700">中等风险水平</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}