'use client'

import { Navigation } from '@/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            PP-RWA 现实世界资产代币化系统
          </h1>
          <p className="text-xl text-gray-600">
            一个基于区块链技术的综合性现实世界资产代币化平台
          </p>
        </header>

        <main className="max-w-6xl mx-auto">
          {/* 项目概览 */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle>项目简介</CardTitle>
                <CardDescription>什么是现实世界资产代币化？</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  现实世界资产（RWA）代币化是将传统资产（如房地产、债券、商品、艺术品等）
                  转换为区块链上的数字代币的过程。这提高了资产流动性、透明度，并降低了交易成本。
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    提高资产流动性
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    降低交易门槛
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    增强交易透明度
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    24/7全球交易
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>技术架构</CardTitle>
                <CardDescription>现代化区块链技术栈</CardDescription>
              </CardHeader>
              <CardContent>
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
                    <div className="font-semibold text-gray-900">数据索引</div>
                    <div className="text-gray-600">The Graph Protocol</div>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">核心特性</h4>
                  <ul className="space-y-1 text-xs text-gray-600">
                    <li>• 多阶段开发计划</li>
                    <li>• 完整的测试覆盖</li>
                    <li>• 多链部署支持</li>
                    <li>• 现代化UI界面</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 开发阶段导航 */}
          <Card>
            <CardHeader>
              <CardTitle>开发阶段</CardTitle>
              <CardDescription>选择要查看的项目开发阶段</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="transition-all hover:shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">第一阶段</CardTitle>
                    <CardDescription>核心基础</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <strong>ERC-20代币系统</strong>
                      <ul className="mt-2 space-y-1 text-xs">
                        <li>• 代币转账</li>
                        <li>• 铸造销毁</li>
                        <li>• 余额查询</li>
                        <li>• 基础管理</li>
                      </ul>
                    </div>
                    <Button asChild className="w-full">
                      <Link href="/stage1">
                        进入第一阶段
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="transition-all hover:shadow-lg border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">第二阶段</CardTitle>
                    <CardDescription>功能扩展</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <strong>NFT + DeFi功能</strong>
                      <ul className="mt-2 space-y-1 text-xs">
                        <li>• NFT管理</li>
                        <li>• 质押系统</li>
                        <li>• 收益计算</li>
                        <li>• IPFS存储</li>
                      </ul>
                    </div>
                    <Button asChild className="w-full" variant="default">
                      <Link href="/stage2">
                        进入第二阶段
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="transition-all hover:shadow-lg opacity-75">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">第三阶段</CardTitle>
                    <CardDescription>高级功能</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <strong>治理系统</strong>
                      <ul className="mt-2 space-y-1 text-xs">
                        <li>• DAO治理</li>
                        <li>• 多签钱包</li>
                        <li>• 预言机</li>
                        <li>• 可升级合约</li>
                      </ul>
                    </div>
                    <Button asChild className="w-full" variant="outline" disabled>
                      <Link href="/stage3">
                        敬请期待
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="transition-all hover:shadow-lg opacity-75">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">第四阶段</CardTitle>
                    <CardDescription>项目完善</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <strong>数据分析</strong>
                      <ul className="mt-2 space-y-1 text-xs">
                        <li>• 数据索引</li>
                        <li>• 监控分析</li>
                        <li>• 文档完善</li>
                        <li>• 项目展示</li>
                      </ul>
                    </div>
                    <Button asChild className="w-full" variant="outline" disabled>
                      <Link href="/stage4">
                        敬请期待
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* 项目状态 */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-4">项目开发状态</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-blue-700">总体进度</span>
                  <span className="text-blue-700">50%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-600 font-medium">✅ 第一阶段：</span>
                  <span className="text-gray-600">已完成</span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">🔄 第二阶段：</span>
                  <span className="text-gray-600">开发中</span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">📋 第三阶段：</span>
                  <span className="text-gray-600">计划中</span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">📋 第四阶段：</span>
                  <span className="text-gray-600">计划中</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="text-center mt-16 text-gray-600">
          <p>© 2025 PP-RWA代币系统</p>
        </footer>
      </div>
    </div>
  )
}
