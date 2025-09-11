'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export function Navigation() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // 避免hydration错误
  if (!mounted) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4">
        <div className="text-center">正在加载导航...</div>
      </div>
    )
  }

  // 只在stage页面显示简化导航
  if (pathname === '/') {
    return null
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-gray-900">
            {pathname === '/stage1' && '第一阶段：核心基础'}
            {pathname === '/stage2' && '第二阶段：功能扩展'}
            {pathname === '/stage3' && '第三阶段：高级功能'}
            {pathname === '/stage4' && '第四阶段：项目完善'}
          </h1>
          <p className="text-gray-600 mt-1">
            {pathname === '/stage1' && 'ERC-20代币系统'}
            {pathname === '/stage2' && 'NFT管理 + DeFi质押系统'}
            {pathname === '/stage3' && '治理系统 + 多重签名 + 预言机'}
            {pathname === '/stage4' && '数据分析 + 项目展示'}
          </p>
        </div>
        
        <Button asChild variant="outline">
          <Link href="/" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            返回首页
          </Link>
        </Button>
      </div>
      
      <div className="mt-4 h-px bg-gray-200"></div>
    </div>
  )
}