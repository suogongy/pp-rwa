'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Navigation } from '@/components/Navigation'
import { WalletConnect } from '@/components/WalletConnect'
import { GovernanceManagement } from '@/components/stage3/GovernanceManagement'
import { MultisigManagement } from '@/components/stage3/MultisigManagement'
import { OracleManagement } from '@/components/stage3/OracleManagement'
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
                    </TabsContent>
                    
                    <TabsContent value="multisig" className="mt-6">
                      <MultisigManagement address={address || ''} />
                    </TabsContent>
                    
                    <TabsContent value="oracle" className="mt-6">
                      <OracleManagement address={address || ''} />
                    </TabsContent>
                    
                    <TabsContent value="erc1155" className="mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>ERC-1155多代币</CardTitle>
                          <CardDescription>同质化和非同质化代币统一管理</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-indigo-50 rounded-lg">
                                <h4 className="font-semibold text-indigo-900">代币类型</h4>
                                <p className="text-2xl font-bold text-indigo-600">0</p>
                                <p className="text-sm text-indigo-600">已创建类型</p>
                              </div>
                              <div className="p-4 bg-pink-50 rounded-lg">
                                <h4 className="font-semibold text-pink-900">总余额</h4>
                                <p className="text-2xl font-bold text-pink-600">0</p>
                                <p className="text-sm text-pink-600">所有代币</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Button className="w-full">创建新代币类型</Button>
                              <Button variant="outline" className="w-full">批量转账</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="proxy" className="mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>可升级代理</CardTitle>
                          <CardDescription>合约升级管理系统</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-teal-50 rounded-lg">
                                <h4 className="font-semibold text-teal-900">当前版本</h4>
                                <p className="text-2xl font-bold text-teal-600">v1.0.0</p>
                                <p className="text-sm text-teal-600">合约版本</p>
                              </div>
                              <div className="p-4 bg-cyan-50 rounded-lg">
                                <h4 className="font-semibold text-cyan-900">升级权限</h4>
                                <p className="text-sm font-medium text-cyan-600">管理员</p>
                                <p className="text-sm text-cyan-600">当前状态</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Button className="w-full">升级合约</Button>
                              <Button variant="outline" className="w-full">查看升级历史</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
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