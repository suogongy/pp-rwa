'use client'

import { useAccount } from 'wagmi'
import { WalletConnect } from '@/components/WalletConnect'
import { TokenActions } from '@/components/TokenActions'
import { Navigation } from '@/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useEffect } from 'react'

export default function Home() {
  const { isConnected, address } = useAccount()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p>正在加载...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            第一阶段：核心基础
          </h1>
          <p className="text-xl text-gray-600">
            ERC-20代币系统
          </p>
        </header>

        <Navigation />

        <main className="max-w-6xl mx-auto">
          {!isConnected ? (
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <WalletConnect />
                </div>
                
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                      项目特色
                    </h2>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        完整的ERC-20代币实现
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        Gas优化和安全最佳实践
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        现代化Web3前端界面
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        95%+测试覆盖率
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        支持多链部署
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                      技术栈
                    </h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">智能合约</div>
                        <div className="text-gray-600">Foundry + Solidity</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">前端</div>
                        <div className="text-gray-600">Next.js + TypeScript</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">Web3集成</div>
                        <div className="text-gray-600">wagmi + viem</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">钱包连接</div>
                        <div className="text-gray-600">RainbowKit</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <WalletConnect />
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>连接信息</CardTitle>
                      <CardDescription>当前钱包状态</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <span className="text-sm font-medium">连接状态:</span>
                        <span className="ml-2 text-green-600">已连接</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">钱包地址:</span>
                        <div className="text-xs text-gray-600 mt-1 break-all">
                          {address}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="lg:col-span-2">
                  {address && <TokenActions address={address} />}
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="text-center mt-16 text-gray-600">
          <p>© 2024 RWA代币系统 - 个人技术实践项目</p>
        </footer>
      </div>
    </div>
  )
}
