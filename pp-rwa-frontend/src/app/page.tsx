'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WalletConnect } from '@/components/WalletConnect'
import { NetworkReset } from '@/components/NetworkReset'
import { AssetRegistration } from '@/components/rwa-market/AssetRegistration'
import { Marketplace } from '@/components/rwa-market/Marketplace'
import { StakingPlatform } from '@/components/rwa-market/StakingPlatform'
import { GovernancePortal } from '@/components/rwa-market/GovernancePortal'
import { MultiSigVault } from '@/components/rwa-market/MultiSigVault'
import { PortfolioDashboard } from '@/components/rwa-market/PortfolioDashboard'
import { AnalyticsHub } from '@/components/rwa-market/AnalyticsHub'

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* 头部导航 */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              PP-RWA 数字资产市场
            </h1>
            <p className="text-lg text-gray-600">
              现实世界资产代币化与交易平台
            </p>
          </div>
          <div className="flex items-center gap-4">
            <WalletConnect onConnectionChange={setIsConnected} />
          </div>
        </header>

        {/* 网络配置提醒 */}
        <div className="mb-6">
          <NetworkReset />
        </div>

        {/* 主要统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">¥1.2B</div>
              <div className="text-sm text-gray-600">总资产价值</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">3,847</div>
              <div className="text-sm text-gray-600">已登记资产</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">¥45.6M</div>
              <div className="text-sm text-gray-600">日交易量</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">12.5%</div>
              <div className="text-sm text-gray-600">平均年化收益</div>
            </CardContent>
          </Card>
        </div>

        {/* 主要功能标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-8">
            <TabsTrigger value="dashboard">资产组合</TabsTrigger>
            <TabsTrigger value="register">资产登记</TabsTrigger>
            <TabsTrigger value="marketplace">市场交易</TabsTrigger>
            <TabsTrigger value="staking">质押挖矿</TabsTrigger>
            <TabsTrigger value="governance">社区治理</TabsTrigger>
            <TabsTrigger value="multisig">多签金库</TabsTrigger>
            <TabsTrigger value="analytics">数据分析</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <PortfolioDashboard isConnected={isConnected} />
          </TabsContent>

          <TabsContent value="register" className="space-y-6">
            <AssetRegistration isConnected={isConnected} />
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-6">
            <Marketplace isConnected={isConnected} />
          </TabsContent>

          <TabsContent value="staking" className="space-y-6">
            <StakingPlatform isConnected={isConnected} />
          </TabsContent>

          <TabsContent value="governance" className="space-y-6">
            <GovernancePortal isConnected={isConnected} />
          </TabsContent>

          <TabsContent value="multisig" className="space-y-6">
            <MultiSigVault isConnected={isConnected} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsHub />
          </TabsContent>
        </Tabs>

        {/* 市场动态 */}
        <Card className="mt-8 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>市场动态</CardTitle>
            <CardDescription>最新RWA市场趋势和重要公告</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Badge variant="secondary" className="mb-2">新资产上市</Badge>
                <h4 className="font-semibold text-blue-900">上海商业地产组合</h4>
                <p className="text-sm text-blue-700 mt-1">价值2.3亿的商业地产项目已完成代币化，预计年化收益8.5%</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <Badge variant="secondary" className="mb-2">质押奖励提升</Badge>
                <h4 className="font-semibold text-green-900">RWA20质押APR提升至15%</h4>
                <p className="text-sm text-green-700 mt-1">为庆祝用户突破10万，质押奖励限时提升，活动持续至月底</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <Badge variant="secondary" className="mb-2">治理提案</Badge>
                <h4 className="font-semibold text-purple-900">降低平台手续费提案</h4>
                <p className="text-sm text-purple-700 mt-1">社区发起提案，建议将交易手续费从0.3%降低至0.2%，投票进行中</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <Badge variant="secondary" className="mb-2">技术升级</Badge>
                <h4 className="font-semibold text-orange-900">Layer2集成已完成</h4>
                <p className="text-sm text-orange-700 mt-1">Polygon网络集成完成，用户现在可以享受更低Gas费和更快交易</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 页脚 */}
        <footer className="text-center mt-16 text-gray-600">
          <p>© 2025 PP-RWA 数字资产市场 - 安全、透明、高效的RWA交易平台</p>
        </footer>
      </div>
    </div>
  )
}