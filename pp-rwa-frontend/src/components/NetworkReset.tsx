'use client'

import { useDisconnect, useSwitchChain } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw } from 'lucide-react'

export function NetworkReset() {
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()

  const handleReset = async () => {
    try {
      // 1. 断开当前钱包连接
      await disconnect()

      // 2. 清理localStorage中的wagmi相关数据
      if (typeof window !== 'undefined') {
        // 清理所有wagmi相关的localStorage
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes('wagmi') || key.includes('wallet') || key.includes('connected'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))

        // 清理sessionStorage
        sessionStorage.clear()
      }

      // 3. 重新加载页面以应用新的配置
      window.location.reload()
    } catch (error) {
      console.error('重置网络配置失败:', error)
    }
  }

  const handleSwitchToAnvil = async () => {
    try {
      await switchChain({ chainId: 31337 }) // Anvil chain ID
    } catch (error) {
      console.error('切换到Anvil网络失败:', error)
    }
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <AlertCircle className="h-5 w-5" />
          网络配置问题
        </CardTitle>
        <CardDescription className="text-yellow-700">
          检测到网络配置问题，可能需要重置连接以确保使用本地Anvil节点
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-yellow-800">
            <strong>当前问题:</strong> 浏览器可能仍在尝试连接到Sepolia测试网络
          </p>
          <p className="text-sm text-yellow-800">
            <strong>解决方案:</strong> 断开钱包连接并清理缓存，然后重新连接
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSwitchToAnvil}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            切换到Anvil
          </Button>

          <Button
            onClick={handleReset}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            重置网络配置
          </Button>
        </div>

        <div className="text-xs text-yellow-700">
          <p><strong>预期网络:</strong> Anvil (Localhost: 8545, Chain ID: 31337)</p>
          <p><strong>如果问题持续:</strong> 请在MetaMask中手动添加Anvil网络配置</p>
        </div>
      </CardContent>
    </Card>
  )
}