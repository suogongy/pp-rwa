'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface MarketStats {
  totalMarketCap: number
  totalVolume24h: number
  totalAssets: number
  activeUsers: number
  averageAPY: number
  priceChange24h: number
}

interface AssetPerformance {
  name: string
  symbol: string
  price: number
  change24h: number
  change7d: number
  change30d: number
  volume24h: number
  marketCap: number
  apy: number
}

interface TrendData {
  date: string
  marketCap: number
  volume: number
  users: number
  apy: number
}

export function AnalyticsHub() {
  const [timeRange, setTimeRange] = useState('7d')
  const [marketStats, setMarketStats] = useState<MarketStats>({
    totalMarketCap: 975000000,
    totalVolume24h: 6000000,
    totalAssets: 48,
    activeUsers: 12500,
    averageAPY: 7.1,
    priceChange24h: 2.3
  })

  const [topPerformers, setTopPerformers] = useState<AssetPerformance[]>([
    {
      name: '数字艺术品合集',
      symbol: 'NFTART',
      price: 500.00,
      change24h: 5.2,
      change7d: 12.8,
      change30d: 28.5,
      volume24h: 1500000,
      marketCap: 25000000,
      apy: 12.0
    },
    {
      name: '上海商业地产基金',
      symbol: 'SHRE',
      price: 100.50,
      change24h: 2.3,
      change7d: 5.6,
      change30d: 15.2,
      volume24h: 2500000,
      marketCap: 500000000,
      apy: 8.5
    },
    {
      name: '政府债券组合',
      symbol: 'GOVB',
      price: 99.80,
      change24h: 0.8,
      change7d: 2.1,
      change30d: 6.3,
      volume24h: 1200000,
      marketCap: 300000000,
      apy: 4.2
    }
  ])

  const [trendData, setTrendData] = useState<TrendData[]>([
    { date: '2025-10-07', marketCap: 920000000, volume: 5200000, users: 11800, apy: 6.8 },
    { date: '2025-10-08', marketCap: 935000000, volume: 5800000, users: 12000, apy: 6.9 },
    { date: '2025-10-09', marketCap: 948000000, volume: 6100000, users: 12200, apy: 7.0 },
    { date: '2025-10-10', marketCap: 965000000, volume: 5900000, users: 12350, apy: 7.1 },
    { date: '2025-10-11', marketCap: 975000000, volume: 6000000, users: 12500, apy: 7.1 },
  ])

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const getChangePrefix = (change: number) => {
    return change >= 0 ? '+' : ''
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return `¥${(num / 1000000000).toFixed(2)}B`
    } else if (num >= 1000000) {
      return `¥${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `¥${(num / 1000).toFixed(1)}K`
    }
    return `¥${num.toFixed(0)}`
  }

  return (
    <div className="space-y-6">
      {/* 市场概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">总市值</div>
            <div className="text-xl font-bold text-gray-900">{formatNumber(marketStats.totalMarketCap)}</div>
            <div className={`text-sm mt-1 ${getChangeColor(marketStats.priceChange24h)}`}>
              {getChangePrefix(marketStats.priceChange24h)}{marketStats.priceChange24h}%
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">24h交易量</div>
            <div className="text-xl font-bold text-blue-600">{formatNumber(marketStats.totalVolume24h)}</div>
            <div className="text-sm text-green-600 mt-1">+18.5%</div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">总资产数</div>
            <div className="text-xl font-bold text-purple-600">{marketStats.totalAssets}</div>
            <div className="text-sm text-gray-500 mt-1">7个类别</div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">活跃用户</div>
            <div className="text-xl font-bold text-orange-600">{marketStats.activeUsers.toLocaleString()}</div>
            <div className="text-sm text-green-600 mt-1">+5.8%</div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">平均APY</div>
            <div className="text-xl font-bold text-green-600">{marketStats.averageAPY}%</div>
            <div className="text-sm text-gray-500 mt-1">加权平均</div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">质押总额</div>
            <div className="text-xl font-bold text-indigo-600">¥193M</div>
            <div className="text-sm text-green-600 mt-1">+12.3%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">市场概览</TabsTrigger>
          <TabsTrigger value="performance">资产表现</TabsTrigger>
          <TabsTrigger value="trends">趋势分析</TabsTrigger>
          <TabsTrigger value="insights">市场洞察</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 市场趋势图 */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>市场趋势</CardTitle>
                    <CardDescription>市值和交易量变化</CardDescription>
                  </div>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24小时</SelectItem>
                      <SelectItem value="7d">7天</SelectItem>
                      <SelectItem value="30d">30天</SelectItem>
                      <SelectItem value="90d">90天</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">市场趋势图表</p>
                  {/* 这里应该集成真实的图表组件，如 Chart.js 或 Recharts */}
                </div>
              </CardContent>
            </Card>

            {/* 资产分布 */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>资产类别分布</CardTitle>
                <CardDescription>按类型分类的资产分布</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">房地产</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">债券</span>
                      <span className="font-medium">25%</span>
                    </div>
                    <Progress value={25} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">商品</span>
                      <span className="font-medium">18%</span>
                    </div>
                    <Progress value={18} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">艺术品</span>
                      <span className="font-medium">8%</span>
                    </div>
                    <Progress value={8} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">其他</span>
                      <span className="font-medium">4%</span>
                    </div>
                    <Progress value={4} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 关键指标 */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>关键指标</CardTitle>
              <CardDescription>平台重要运营数据</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900 mb-1">¥2.8B</div>
                  <div className="text-sm text-blue-700">累计交易额</div>
                  <div className="text-xs text-blue-600 mt-1">自平台启动</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-900 mb-1">98.5%</div>
                  <div className="text-sm text-green-700">系统正常运行</div>
                  <div className="text-xs text-green-600 mt-1">过去30天</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-900 mb-1">1.2秒</div>
                  <div className="text-sm text-purple-700">平均交易时间</div>
                  <div className="text-xs text-purple-600 mt-1">包含确认</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-900 mb-1">4.8/5</div>
                  <div className="text-sm text-orange-700">用户满意度</div>
                  <div className="text-xs text-orange-600 mt-1">基于3,521个评价</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>表现排行榜</CardTitle>
              <CardDescription>按不同时间段排序的资产表现</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((asset, index) => (
                  <div key={index} className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{asset.name}</h4>
                        <Badge variant="outline">{asset.symbol}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">¥{asset.price}</div>
                        <div className={`text-sm ${getChangeColor(asset.change24h)}`}>
                          {getChangePrefix(asset.change24h)}{asset.change24h}%
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">24h:</span>
                        <span className={`ml-1 font-medium ${getChangeColor(asset.change24h)}`}>
                          {getChangePrefix(asset.change24h)}{asset.change24h}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">7天:</span>
                        <span className={`ml-1 font-medium ${getChangeColor(asset.change7d)}`}>
                          {getChangePrefix(asset.change7d)}{asset.change7d}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">30天:</span>
                        <span className={`ml-1 font-medium ${getChangeColor(asset.change30d)}`}>
                          {getChangePrefix(asset.change30d)}{asset.change30d}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">APY:</span>
                        <span className="ml-1 font-medium text-green-600">{asset.apy}%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                      <div>
                        <span className="text-gray-600">交易量:</span>
                        <span className="ml-1 font-medium">{formatNumber(asset.volume24h)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">市值:</span>
                        <span className="ml-1 font-medium">{formatNumber(asset.marketCap)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>用户增长趋势</CardTitle>
                <CardDescription>平台用户数量变化</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">用户增长图表</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>收益趋势</CardTitle>
                <CardDescription>平均APY变化趋势</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">收益趋势图表</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>市场洞察</CardTitle>
              <CardDescription>基于数据分析的市场趋势和建议</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">市场增长强劲</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    过去30天市值增长28%，交易量增加45%，显示市场对RWA资产的强烈需求。
                  </p>
                  <div className="text-sm text-blue-600">
                    <strong>建议:</strong> 考虑增加房地产和债券类资产供应
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">质押需求旺盛</h4>
                  <p className="text-sm text-green-700 mb-3">
                    质押总额月增长32%，特别是高APY质押池受到用户青睐。
                  </p>
                  <div className="text-sm text-green-600">
                    <strong>建议:</strong> 推出更多差异化质押产品
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">用户活跃度提升</h4>
                  <p className="text-sm text-purple-700 mb-3">
                    日活跃用户数增长22%，平均持仓时间从15天延长到28天。
                  </p>
                  <div className="text-sm text-purple-600">
                    <strong>建议:</strong> 加强用户教育和产品引导
                  </div>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">跨链需求显现</h4>
                  <p className="text-sm text-orange-700 mb-3">
                    用户对Layer2网络的需求增加，Gas费用成为关注焦点。
                  </p>
                  <div className="text-sm text-orange-600">
                    <strong>建议:</strong> 加速Polygon网络集成进度
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>风险提示</CardTitle>
              <CardDescription>基于数据分析的风险提醒</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-red-50 rounded-lg">
                  <h5 className="font-medium text-red-900 mb-1">市场集中度风险</h5>
                  <p className="text-sm text-red-700">
                    前十大资产占总市值的72%，建议关注资产组合的多样化。
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <h5 className="font-medium text-yellow-900 mb-1">流动性风险</h5>
                  <p className="text-sm text-yellow-700">
                    部分小众资产交易深度不足，可能影响大额交易的执行。
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-1">监管风险</h5>
                  <p className="text-sm text-blue-700">
                    密切关注RWA相关法规变化，确保合规运营。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}