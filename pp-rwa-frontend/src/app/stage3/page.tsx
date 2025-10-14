'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Navigation } from '@/components/Navigation'
import { WalletConnect } from '@/components/WalletConnect'
import { GovernanceManagement } from '@/components/stage3/GovernanceManagement'
import { MultisigManagement } from '@/components/stage3/MultisigManagement'
import { OracleManagement } from '@/components/stage3/OracleManagement'
import { ProxyManagement } from '@/components/stage3/ProxyManagement'
import { ERC1155Management } from '@/components/stage3/ERC1155Management'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  RWA20_ADDRESS, 
  RWA721_ADDRESS, 
  RWAStaking_ADDRESS,
  RWA1155_ADDRESS,
  RWAGovernor_ADDRESS,
  RWAMultisigWallet_ADDRESS,
  RWAOracle_ADDRESS,
  RWAUpgradeableProxy_ADDRESS
} from '@/lib/wagmi'

export default function Stage3Page() {
  const { isConnected, address } = useAccount()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p>正在加载...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            第三阶段：高级功能
          </h1>
          <p className="text-xl text-gray-600">
            治理系统 + 多重签名 + 预言机
          </p>
        </header>

        <Navigation />

        <div className="container mx-auto px-4 mt-8">
          {!isConnected ? (
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>连接钱包开始使用</CardTitle>
                  <CardDescription>
                    请连接您的Web3钱包以访问第三阶段的高级功能
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <WalletConnect />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                  <WalletConnect />
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>功能概览</CardTitle>
                      <CardDescription>第三阶段特性</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">多代币标准</span>
                        <span className="px-2 py-1 text-xs font-medium text-white bg-indigo-500 rounded">ERC-1155</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">DAO治理</span>
                        <span className="px-2 py-1 text-xs font-medium text-white bg-purple-500 rounded">Governance</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">多重签名</span>
                        <span className="px-2 py-1 text-xs font-medium text-white bg-blue-500 rounded">Multi-sig</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">预言机</span>
                        <span className="px-2 py-1 text-xs font-medium text-white bg-orange-500 rounded">Oracle</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">可升级合约</span>
                        <span className="px-2 py-1 text-xs font-medium text-white bg-green-500 rounded">Upgradeable</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>合约地址</CardTitle>
                      <CardDescription>已部署的智能合约地址</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">RWA20</span>
                          <Badge variant="outline">ERC-20</Badge>
                        </div>
                        <div className="text-xs text-gray-600 font-mono break-all">
                          {RWA20_ADDRESS || '未配置'}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">RWA721</span>
                          <Badge variant="outline">ERC-721</Badge>
                        </div>
                        <div className="text-xs text-gray-600 font-mono break-all">
                          {RWA721_ADDRESS || '未配置'}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">RWAStaking</span>
                          <Badge variant="outline">质押</Badge>
                        </div>
                        <div className="text-xs text-gray-600 font-mono break-all">
                          {RWAStaking_ADDRESS || '未配置'}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">RWA1155</span>
                          <Badge variant="outline">多代币</Badge>
                        </div>
                        <div className="text-xs text-gray-600 font-mono break-all">
                          {RWA1155_ADDRESS || '未配置'}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">RWAGovernor</span>
                          <Badge variant="outline">治理</Badge>
                        </div>
                        <div className="text-xs text-gray-600 font-mono break-all">
                          {RWAGovernor_ADDRESS || '未配置'}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">RWAMultisigWallet</span>
                          <Badge variant="outline">多重签名</Badge>
                        </div>
                        <div className="text-xs text-gray-600 font-mono break-all">
                          {RWAMultisigWallet_ADDRESS || '未配置'}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">RWAOracle</span>
                          <Badge variant="outline">预言机</Badge>
                        </div>
                        <div className="text-xs text-gray-600 font-mono break-all">
                          {RWAOracle_ADDRESS || '未配置'}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">RWAUpgradeableProxy</span>
                          <Badge variant="outline">代理</Badge>
                        </div>
                        <div className="text-xs text-gray-600 font-mono break-all">
                          {RWAUpgradeableProxy_ADDRESS || '未配置'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="lg:col-span-3">
                  <Tabs defaultValue="governance" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="governance">治理系统</TabsTrigger>
                      <TabsTrigger value="multisig">多重签名</TabsTrigger>
                      <TabsTrigger value="oracle">预言机</TabsTrigger>
                      <TabsTrigger value="erc1155">ERC-1155</TabsTrigger>
                      <TabsTrigger value="proxy">可升级代理</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="governance" className="mt-6">
                      <GovernanceManagement address={address || ''} />
                      
                      <Card className="mt-6">
                        <CardHeader>
                          <CardTitle>代币分配</CardTitle>
                          <CardDescription>
                            向不同账户分配RWA20代币，实现多账号治理
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Link 
                            href="/stage3/token-transfer" 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Button className="w-full">
                              打开代币转账页面
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="multisig" className="mt-6">
                      <MultisigManagement address={address || ''} />
                    </TabsContent>
                    
                    <TabsContent value="oracle" className="mt-6">
                      <OracleManagement address={address || ''} />
                    </TabsContent>
                    
                    <TabsContent value="erc1155" className="mt-6">
                      <ERC1155Management />
                    </TabsContent>
                    
                    <TabsContent value="proxy" className="mt-6">
                      <ProxyManagement address={address || ''} />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}