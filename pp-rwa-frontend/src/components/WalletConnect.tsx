'use client'

import { useConnect, useDisconnect, useAccount } from 'wagmi'
import { useBalance, useReadContract } from 'wagmi'
import { RWA20_ABI, RWA20_ADDRESS } from '@/lib/wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'

export function WalletConnect() {
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { address, isConnected } = useAccount()
  
  // 避免hydration错误的状态管理
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const { data: balance } = useBalance({
    address: address,
  })
  
  const { data: tokenBalance } = useReadContract({
    address: RWA20_ADDRESS as `0x${string}`,
    abi: RWA20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  })

  const { data: tokenInfo } = useReadContract({
    address: RWA20_ADDRESS as `0x${string}`,
    abi: RWA20_ABI,
    functionName: 'symbol',
  })
  
  // 避免服务端渲染和客户端不匹配
  if (!mounted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>连接钱包</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            正在加载钱包连接组件...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>连接钱包</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            请连接您的钱包以开始使用RWA代币功能
          </p>
          <div className="space-y-2">
            {connectors.map((connector) => (
              <Button
                key={connector.uid}
                onClick={() => connect({ connector })}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? '连接中...' : `连接 ${connector.name}`}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>钱包信息</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">地址:</span>
            <span className="text-sm text-gray-600">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">ETH余额:</span>
            <span className="text-sm text-gray-600">
              {balance?.formatted} {balance?.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">RWA余额:</span>
            <span className="text-sm text-gray-600">
              {tokenBalance ? Number(tokenBalance) / 1e18 : 0} {tokenInfo || 'RWA'}
            </span>
          </div>
        </div>
        <Button 
          onClick={() => disconnect()} 
          variant="outline" 
          className="w-full"
        >
          断开连接
        </Button>
      </CardContent>
    </Card>
  )
}