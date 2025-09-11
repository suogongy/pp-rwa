'use client'

import { Navigation } from '@/components/Navigation'
import { FullNavigation } from '@/components/FullNavigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            PP-RWA 现实世界资产代币化系统
          </h1>
          <p className="text-xl text-gray-600">
            一个基于区块链技术的综合性现实世界资产代币化平台
          </p>
        </header>

        <div className="container mx-auto px-4 mt-12 space-y-8">
          <FullNavigation />
          
          {/* 项目概览 */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">项目简介</CardTitle>
                <CardDescription className="text-gray-600">什么是现实世界资产代币化？</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800 mb-6 leading-relaxed">
                  现实世界资产（RWA）代币化是将传统资产（如房地产、债券、商品、艺术品等）
                  转换为区块链上的数字代币的过程。这提高了资产流动性、透明度，并降低了交易成本。
                </p>
                <div className="space-y-3">
                  <div className="flex items-center bg-blue-50 p-3 rounded-lg">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                    <span className="text-gray-900 font-medium">提高资产流动性</span>
                  </div>
                  <div className="flex items-center bg-green-50 p-3 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                    <span className="text-gray-900 font-medium">降低交易门槛</span>
                  </div>
                  <div className="flex items-center bg-purple-50 p-3 rounded-lg">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-3 flex-shrink-0"></div>
                    <span className="text-gray-900 font-medium">增强交易透明度</span>
                  </div>
                  <div className="flex items-center bg-orange-50 p-3 rounded-lg">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-3 flex-shrink-0"></div>
                    <span className="text-gray-900 font-medium">24/7全球交易</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* 技术架构展示 */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">技术架构</CardTitle>
              <CardDescription className="text-gray-600">现代化区块链技术栈</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="text-lg font-bold text-blue-900 mb-2">智能合约</div>
                  <div className="text-blue-700">Foundry + Solidity</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                  <div className="text-lg font-bold text-green-900 mb-2">前端</div>
                  <div className="text-green-700">Next.js + TypeScript</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <div className="text-lg font-bold text-purple-900 mb-2">Web3集成</div>
                  <div className="text-purple-700">wagmi + viem</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                  <div className="text-lg font-bold text-orange-900 mb-2">数据索引</div>
                  <div className="text-orange-700">The Graph Protocol</div>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">核心特性</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="flex items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                    <span className="text-gray-900 font-medium">多阶段开发计划</span>
                  </div>
                  <div className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                    <span className="text-gray-900 font-medium">完整的测试覆盖</span>
                  </div>
                  <div className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-3 flex-shrink-0"></div>
                    <span className="text-gray-900 font-medium">多链部署支持</span>
                  </div>
                  <div className="flex items-center p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-3 flex-shrink-0"></div>
                    <span className="text-gray-900 font-medium">现代化UI界面</span>
                  </div>
                  <div className="flex items-center p-3 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full mr-3 flex-shrink-0"></div>
                    <span className="text-gray-900 font-medium">去中心化治理</span>
                  </div>
                  <div className="flex items-center p-3 bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg border border-pink-200">
                    <div className="w-3 h-3 bg-pink-500 rounded-full mr-3 flex-shrink-0"></div>
                    <span className="text-gray-900 font-medium">安全多重签名</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <footer className="text-center mt-16 text-gray-600">
          <p>© 2025 PP-RWA代币系统</p>
        </footer>
      </div>
    </div>
  )
}
