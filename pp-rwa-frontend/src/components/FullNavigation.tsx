'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function FullNavigation() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // 避免hydration错误
  if (!mounted) {
    return (
      <div className="w-full">
        <div className="py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">RWA项目开发路线</h1>
            <p className="text-gray-600">现实世界资产代币化系统 - 分阶段开发计划</p>
          </div>
          <div className="text-center">正在加载导航...</div>
        </div>
      </div>
    )
  }
  
  const stages = [
    {
      id: 1,
      title: '第一阶段',
      subtitle: '核心基础',
      description: 'ERC-20代币功能',
      href: '/stage1',
      status: 'completed',
      features: ['代币转账', '铸造销毁', '余额查询', '基础管理']
    },
    {
      id: 2,
      title: '第二阶段',
      subtitle: '功能扩展',
      description: 'NFT + DeFi功能',
      href: '/stage2',
      status: 'completed',
      features: ['NFT管理', '质押系统', '收益计算', 'IPFS存储']
    },
    {
      id: 3,
      title: '第三阶段',
      subtitle: '高级功能',
      description: '治理系统',
      href: '/stage3',
      status: 'active',
      features: ['DAO治理', '多签钱包', '预言机', '可升级合约']
    },
    {
      id: 4,
      title: '第四阶段',
      subtitle: '项目完善',
      description: '数据分析',
      href: '/stage4',
      status: 'planned',
      features: ['数据索引', '监控分析', '文档完善', '项目展示']
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">已完成</Badge>
      case 'active':
        return <Badge className="bg-blue-500">进行中</Badge>
      case 'planned':
        return <Badge className="bg-gray-500">计划中</Badge>
      default:
        return <Badge>未知</Badge>
    }
  }

  return (
    <div className="w-full">
      {/* 阶段导航 */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-8">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-900">RWA项目开发路线</CardTitle>
          <CardDescription className="text-gray-600">现实世界资产代币化系统 - 分阶段开发计划</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stages.map((stage) => (
              <Card key={stage.id} className={`transition-all hover:shadow-lg border ${
                pathname === stage.href ? 'ring-2 ring-blue-500' : ''
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg">{stage.title}</CardTitle>
                    {getStatusBadge(stage.status)}
                  </div>
                  <CardDescription className="text-sm">
                    {stage.subtitle} - {stage.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">核心功能:</h4>
                    <ul className="space-y-1">
                      {stage.features.map((feature, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-center">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button 
                    asChild
                    className="w-full"
                    variant={pathname === stage.href ? "default" : "outline"}
                    disabled={stage.status === 'planned'}
                  >
                    <Link href={stage.href}>
                      {stage.status === 'completed' ? '查看详情' : 
                       stage.status === 'active' ? '进入开发' : '敬请期待'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* 开发进度 */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-900">开发进度</CardTitle>
          <CardDescription className="text-gray-600">项目整体开发进度跟踪</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-4 text-lg">当前开发进度</h3>
            <div className="w-full bg-blue-200 rounded-full h-3 mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-blue-700 font-medium">第三阶段开发中</p>
              <p className="text-blue-600 font-bold">75% 完成</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}