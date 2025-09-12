'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { RWAOracle_ADDRESS, RWAOracle_ABI } from '@/lib/wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function OracleManagement({ address }: { address: string }) {
  const [ethPrice, setEthPrice] = useState<string>('0')
  const [randomNumbers, setRandomNumbers] = useState<bigint[]>([])
  const [assetValuation, setAssetValuation] = useState<string>('0')

  const { writeContract, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  // 读取ETH价格
  const { data: currentEthPrice, refetch: refetchEthPrice } = useReadContract({
    address: RWAOracle_ADDRESS,
    abi: RWAOracle_ABI,
    functionName: 'getPrice',
    args: ['ETH'], // ETH 价格标识
    query: {
      enabled: !!RWAOracle_ADDRESS,
    }
  })

  // 读取随机数
  const { data: randomNumberData, refetch: refetchRandomNumbers } = useReadContract({
    address: RWAOracle_ADDRESS,
    abi: RWAOracle_ABI,
    functionName: 'getRandomNumber',
    query: {
      enabled: !!RWAOracle_ADDRESS,
    }
  })

  // 读取资产估值
  const { data: currentAssetValuation, refetch: refetchAssetValuation } = useReadContract({
    address: RWAOracle_ADDRESS,
    abi: RWAOracle_ABI,
    functionName: 'getAssetValuation',
    args: ['RWA20'], // RWA20 资产标识
    query: {
      enabled: !!RWAOracle_ADDRESS,
    }
  })

  // 请求ETH价格数据
  const handleRequestPrice = async () => {
    console.log('💰 开始请求ETH价格数据:')
    console.log('  合约地址:', RWAOracle_ADDRESS)
    console.log('  请求者:', address)
    console.log('  资产标识: ETH')

    try {
      writeContract({
        address: RWAOracle_ADDRESS,
        abi: RWAOracle_ABI,
        functionName: 'requestPriceData',
        args: ['ETH'], // ETH 价格标识
      })
      
      console.log('✅ ETH价格请求交易已发送到区块链，等待确认...')
      
    } catch (error) {
      console.error('❌ 请求ETH价格失败:', error)
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : '无堆栈信息',
        code: (error as any)?.code,
        data: (error as any)?.data
      })
    }
  }

  // 生成随机数
  const handleGenerateRandom = async () => {
    console.log('🎲 开始生成随机数:')
    console.log('  合约地址:', RWAOracle_ADDRESS)
    console.log('  请求者:', address)

    try {
      writeContract({
        address: RWAOracle_ADDRESS,
        abi: RWAOracle_ABI,
        functionName: 'requestRandomNumber',
      })
      
      console.log('✅ 随机数生成请求交易已发送到区块链，等待确认...')
      
    } catch (error) {
      console.error('❌ 生成随机数失败:', error)
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : '无堆栈信息',
        code: (error as any)?.code,
        data: (error as any)?.data
      })
    }
  }

  // 请求资产估值
  const handleRequestValuation = async () => {
    console.log('📊 开始请求资产估值:')
    console.log('  合约地址:', RWAOracle_ADDRESS)
    console.log('  请求者:', address)
    console.log('  资产标识: RWA20')

    try {
      writeContract({
        address: RWAOracle_ADDRESS,
        abi: RWAOracle_ABI,
        functionName: 'requestAssetValuation',
        args: ['RWA20'], // RWA20 资产标识
      })
      
      console.log('✅ 资产估值请求交易已发送到区块链，等待确认...')
      
    } catch (error) {
      console.error('❌ 请求资产估值失败:', error)
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : '无堆栈信息',
        code: (error as any)?.code,
        data: (error as any)?.data
      })
    }
  }

  // 更新状态监听
  useEffect(() => {
    if (currentEthPrice) {
      const price = Number(currentEthPrice) / 1e8 // 假设8位小数
      setEthPrice(price.toFixed(2))
      console.log('💵 ETH价格更新: $', price)
    }
    
    if (randomNumberData && Array.isArray(randomNumberData)) {
      setRandomNumbers(randomNumberData)
      console.log('🎲 随机数更新:', randomNumberData.map(n => n.toString()))
    }
    
    if (currentAssetValuation) {
      const valuation = Number(currentAssetValuation) / 1e18
      setAssetValuation(valuation.toFixed(2))
      console.log('📈 资产估值更新: $', valuation)
    }
  }, [currentEthPrice, randomNumberData, currentAssetValuation])

  // 添加预言机状态监听日志
  useEffect(() => {
    console.log('🔮 预言机合约状态更新:')
    console.log('  ETH价格:', ethPrice, 'USD')
    console.log('  随机数数量:', randomNumbers.length)
    console.log('  资产估值:', assetValuation, 'USD')
    console.log('  合约地址:', RWAOracle_ADDRESS)
    console.log('  当前用户:', address)
  }, [ethPrice, randomNumbers, assetValuation, address])

  // 添加交易状态日志
  useEffect(() => {
    if (isConfirmed) {
      console.log('✅ 预言机交易已确认，交易哈希:', hash)
      console.log('🔄 刷新数据...')
      
      // 延迟刷新数据，等待链上状态更新
      setTimeout(() => {
        refetchEthPrice()
        refetchRandomNumbers()
        refetchAssetValuation()
      }, 2000)
    }
  }, [isConfirmed, hash, refetchEthPrice, refetchRandomNumbers, refetchAssetValuation])

  // 添加加载状态日志
  useEffect(() => {
    console.log('⏳ 预言机合约操作状态:')
    console.log('  请求提交中:', isPending)
    console.log('  请求确认中:', isConfirming)
    console.log('  请求已确认:', isConfirmed)
  }, [isPending, isConfirming, isConfirmed])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">ETH价格</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${ethPrice}
            </div>
            <p className="text-sm text-gray-600">USD</p>
            <Badge variant="outline" className="mt-2">
              Chainlink 预言机
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">随机数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {randomNumbers.length > 0 ? randomNumbers[0].toString() : '0'}
            </div>
            <p className="text-sm text-gray-600">最新随机数</p>
            <Badge variant="outline" className="mt-2">
              VRF 随机数
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">资产估值</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${assetValuation}
            </div>
            <p className="text-sm text-gray-600">RWA20 估值</p>
            <Badge variant="outline" className="mt-2">
              实时估值
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>预言机操作</CardTitle>
          <CardDescription>请求链下数据和生成随机数</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={handleRequestPrice}
                disabled={isPending || isConfirming}
                className="w-full"
              >
                {isPending ? '请求中...' : isConfirming ? '确认中...' : '请求ETH价格'}
              </Button>
              
              <Button 
                onClick={handleGenerateRandom}
                disabled={isPending || isConfirming}
                variant="outline"
                className="w-full"
              >
                {isPending ? '生成中...' : isConfirming ? '确认中...' : '生成随机数'}
              </Button>
              
              <Button 
                onClick={handleRequestValuation}
                disabled={isPending || isConfirming}
                variant="outline"
                className="w-full"
              >
                {isPending ? '请求中...' : isConfirming ? '确认中...' : '请求资产估值'}
              </Button>
            </div>
            
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <p><strong>合约地址:</strong> {RWAOracle_ADDRESS || '未配置'}</p>
              <p><strong>状态:</strong> {RWAOracle_ADDRESS ? '已配置' : '未配置'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {randomNumbers.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>随机数历史</CardTitle>
            <CardDescription>最近生成的随机数列表</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {randomNumbers.slice(0, 8).map((num, index) => (
                <div key={index} className="p-3 bg-red-50 rounded-lg text-center">
                  <div className="text-sm font-medium text-red-900">#{index + 1}</div>
                  <div className="text-lg font-bold text-red-600">{num.toString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}