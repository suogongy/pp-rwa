'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface MarketAsset {
  id: string
  name: string
  type: string
  symbol: string
  price: number
  marketCap: number
  supply: number
  apy: number
  change24h: number
  volume24h: number
  rating: string
  description: string
  isFavorite: boolean
}

interface OrderBook {
  price: number
  amount: number
  total: number
  type: 'buy' | 'sell'
}

export function Marketplace({ isConnected }: { isConnected: boolean }) {
  const [assets, setAssets] = useState<MarketAsset[]>([
    {
      id: '1',
      name: '上海商业地产基金',
      type: 'real-estate',
      symbol: 'SHRE',
      price: 100.50,
      marketCap: 500000000,
      supply: 4975124,
      apy: 8.5,
      change24h: 2.3,
      volume24h: 2500000,
      rating: 'AA',
      description: '位于上海陆家嘴的核心商业地产项目',
      isFavorite: true
    },
    {
      id: '2',
      name: '政府债券组合',
      type: 'bond',
      symbol: 'GOVB',
      price: 99.80,
      marketCap: 300000000,
      supply: 3006012,
      apy: 4.2,
      change24h: 0.8,
      volume24h: 1200000,
      rating: 'AAA',
      description: '高信用等级政府债券投资组合',
      isFavorite: false
    },
    {
      id: '3',
      name: '黄金ETF代币',
      type: 'commodity',
      symbol: 'GLDT',
      price: 198.50,
      marketCap: 150000000,
      supply: 755670,
      apy: 3.5,
      change24h: -0.5,
      volume24h: 800000,
      rating: 'A',
      description: '基于实物黄金的ETF代币',
      isFavorite: false
    },
    {
      id: '4',
      name: '数字艺术品合集',
      type: 'art',
      symbol: 'NFTART',
      price: 500.00,
      marketCap: 25000000,
      supply: 50000,
      apy: 12.0,
      change24h: 5.2,
      volume24h: 1500000,
      rating: 'BBB',
      description: '限量版数字艺术品合集',
      isFavorite: true
    }
  ])

  const [orderBook, setOrderBook] = useState<OrderBook[]>([
    { price: 101.00, amount: 1000, total: 101000, type: 'buy' },
    { price: 100.80, amount: 1500, total: 151200, type: 'buy' },
    { price: 100.50, amount: 2000, total: 201000, type: 'buy' },
    { price: 100.60, amount: 1200, total: 120720, type: 'sell' },
    { price: 100.80, amount: 800, total: 80640, type: 'sell' },
    { price: 101.20, amount: 600, total: 60720, type: 'sell' }
  ])

  const [selectedAsset, setSelectedAsset] = useState<MarketAsset | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('marketCap')
  const [buyAmount, setBuyAmount] = useState('')
  const [sellAmount, setSellAmount] = useState('')

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

  const getRatingColor = (rating: string) => {
    const colors: Record<string, string> = {
      'AAA': 'bg-green-100 text-green-800',
      'AA': 'bg-blue-100 text-blue-800',
      'A': 'bg-yellow-100 text-yellow-800',
      'BBB': 'bg-orange-100 text-orange-800'
    }
    return colors[rating] || 'bg-gray-100 text-gray-800'
  }

  const filteredAssets = assets
    .filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'all' || asset.type === filterType
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      if (sortBy === 'marketCap') return b.marketCap - a.marketCap
      if (sortBy === 'price') return b.price - a.price
      if (sortBy === 'change24h') return b.change24h - a.change24h
      if (sortBy === 'apy') return b.apy - a.apy
      return 0
    })

  const handleBuy = () => {
    if (!selectedAsset || !buyAmount) return
    // 这里应该调用智能合约进行购买
    alert(`购买 ${buyAmount} ${selectedAsset.symbol} 的请求已提交`)
    setBuyAmount('')
  }

  const handleSell = () => {
    if (!selectedAsset || !sellAmount) return
    // 这里应该调用智能合约进行出售
    alert(`出售 ${sellAmount} ${selectedAsset.symbol} 的请求已提交`)
    setSellAmount('')
  }

  const toggleFavorite = (assetId: string) => {
    setAssets(prev => prev.map(asset =>
      asset.id === assetId ? { ...asset, isFavorite: !asset.isFavorite } : asset
    ))
  }

  if (!isConnected) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">请连接钱包</h3>
          <p className="text-gray-600">连接钱包以访问RWA市场</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 市场统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">总市值</div>
            <div className="text-2xl font-bold text-gray-900">¥975M</div>
            <div className="text-sm text-green-600 mt-1">+3.2%</div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">24h交易量</div>
            <div className="text-2xl font-bold text-blue-600">¥6.0M</div>
            <div className="text-sm text-green-600 mt-1">+18.5%</div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">活跃资产</div>
            <div className="text-2xl font-bold text-purple-600">48</div>
            <div className="text-sm text-gray-500 mt-1">7个类别</div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">平均APY</div>
            <div className="text-2xl font-bold text-orange-600">7.1%</div>
            <div className="text-sm text-gray-500 mt-1">加权平均</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 资产列表 */}
        <div className="lg:col-span-2">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>市场资产</CardTitle>
              <CardDescription>浏览和交易各种RWA代币</CardDescription>

              {/* 搜索和筛选 */}
              <div className="flex flex-col md:flex-row gap-4 mt-4">
                <Input
                  placeholder="搜索资产名称或代码..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="资产类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="real-estate">房地产</SelectItem>
                    <SelectItem value="bond">债券</SelectItem>
                    <SelectItem value="commodity">商品</SelectItem>
                    <SelectItem value="art">艺术品</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="排序方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketCap">市值</SelectItem>
                    <SelectItem value="price">价格</SelectItem>
                    <SelectItem value="change24h">24h涨跌</SelectItem>
                    <SelectItem value="apy">收益率</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedAsset?.id === asset.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{asset.name}</h4>
                          <Badge variant="outline">{asset.symbol}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(asset.id)
                            }}
                            className="h-6 w-6 p-0"
                          >
                            {asset.isFavorite ? '❤️' : '🤍'}
                          </Button>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getAssetTypeColor(asset.type)}>
                            {getAssetTypeLabel(asset.type)}
                          </Badge>
                          <Badge className={getRatingColor(asset.rating)}>
                            {asset.rating}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">{asset.description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">价格:</span>
                            <span className="ml-1 font-medium">¥{asset.price}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">市值:</span>
                            <span className="ml-1 font-medium">¥{(asset.marketCap / 1000000).toFixed(1)}M</span>
                          </div>
                          <div>
                            <span className="text-gray-600">APY:</span>
                            <span className="ml-1 font-medium text-green-600">{asset.apy}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">24h:</span>
                            <span className={`ml-1 font-medium ${asset.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">交易量:</span>
                            <span className="ml-1 font-medium">¥{(asset.volume24h / 1000000).toFixed(1)}M</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 交易面板 */}
        <div className="space-y-6">
          {selectedAsset ? (
            <>
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>{selectedAsset.name}</CardTitle>
                  <CardDescription>{selectedAsset.symbol} - {selectedAsset.symbol}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="buy" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="buy">买入</TabsTrigger>
                      <TabsTrigger value="sell">卖出</TabsTrigger>
                    </TabsList>

                    <TabsContent value="buy" className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          购买数量
                        </label>
                        <Input
                          type="number"
                          value={buyAmount}
                          onChange={(e) => setBuyAmount(e.target.value)}
                          placeholder="输入购买数量"
                        />
                      </div>
                      <div className="text-sm text-gray-600">
                        预计成本: ¥{buyAmount ? (Number(buyAmount) * selectedAsset.price).toFixed(2) : '0.00'}
                      </div>
                      <Button onClick={handleBuy} className="w-full" disabled={!buyAmount}>
                        买入 {selectedAsset.symbol}
                      </Button>
                    </TabsContent>

                    <TabsContent value="sell" className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          出售数量
                        </label>
                        <Input
                          type="number"
                          value={sellAmount}
                          onChange={(e) => setSellAmount(e.target.value)}
                          placeholder="输入出售数量"
                        />
                      </div>
                      <div className="text-sm text-gray-600">
                        预计收入: ¥{sellAmount ? (Number(sellAmount) * selectedAsset.price).toFixed(2) : '0.00'}
                      </div>
                      <Button onClick={handleSell} className="w-full" disabled={!sellAmount}>
                        卖出 {selectedAsset.symbol}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>订单簿</CardTitle>
                  <CardDescription>{selectedAsset.symbol} 买卖订单</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium text-green-600 mb-2">买单</h5>
                      <div className="space-y-1">
                        {orderBook.filter(order => order.type === 'buy').map((order, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-green-600">¥{order.price}</span>
                            <span>{order.amount}</span>
                            <span>¥{order.total.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h5 className="font-medium text-red-600 mb-2">卖单</h5>
                      <div className="space-y-1">
                        {orderBook.filter(order => order.type === 'sell').map((order, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-red-600">¥{order.price}</span>
                            <span>{order.amount}</span>
                            <span>¥{order.total.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">选择资产</h3>
                <p className="text-gray-600">从左侧列表选择一个资产进行交易</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}