'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Navigation } from '@/components/Navigation'
import { WalletConnect } from '@/components/WalletConnect'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { NFTManagement } from '@/components/stage2/NFTManagement'
import { StakingManagement } from '@/components/stage2/StakingManagement'
import { IPFSUpload } from '@/components/IPFSUpload'

export default function Stage2Page() {
  const { isConnected, address } = useAccount()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p>正在加载...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            第二阶段：功能扩展
          </h1>
          <p className="text-xl text-gray-600">
            NFT管理 + DeFi质押系统
          </p>
        </header>

        <Navigation />

        <main className="mt-8">
          {!isConnected ? (
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>连接钱包开始使用</CardTitle>
                  <CardDescription>
                    请连接您的Web3钱包以访问第二阶段的NFT和DeFi功能
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
                      <CardDescription>第二阶段特性</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">NFT标准</span>
                        <span className="px-2 py-1 text-xs font-medium text-white bg-green-500 rounded">ERC-721</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">质押功能</span>
                        <span className="px-2 py-1 text-xs font-medium text-white bg-blue-500 rounded">DeFi</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">收益计算</span>
                        <span className="px-2 py-1 text-xs font-medium text-white bg-purple-500 rounded">APY</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">IPFS存储</span>
                        <span className="px-2 py-1 text-xs font-medium text-white bg-orange-500 rounded">去中心化</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="lg:col-span-3">
                  <Tabs defaultValue="nft" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="nft">NFT管理</TabsTrigger>
                      <TabsTrigger value="staking">质押系统</TabsTrigger>
                      <TabsTrigger value="ipfs">IPFS上传</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="nft" className="mt-6">
                      <NFTManagement address={address} />
                    </TabsContent>
                    
                    <TabsContent value="staking" className="mt-6">
                      <StakingManagement address={address} />
                    </TabsContent>
                    
                    <TabsContent value="ipfs" className="mt-6">
                      <IPFSUpload />
                      <div className="mt-6 text-center">
                        <Button 
                          variant="outline"
                          onClick={() => window.open('/ipfs', '_blank')}
                        >
                          📊 打开IPFS管理中心
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}