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
  const [initializationStep, setInitializationStep] = useState<number>(0) // 0: 未开始, 1: 添加喂送中, 2: 设置价格中, 3: 完成

  const { writeContract, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  // 读取合约所有者
  const { data: contractOwner } = useReadContract({
    address: RWAOracle_ADDRESS,
    abi: RWAOracle_ABI,
    functionName: 'owner',
    query: {
      enabled: !!RWAOracle_ADDRESS,
    }
  })

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

  // 读取随机数 - 使用最新的请求ID
  const { data: randomRequestCount, refetch: refetchRandomRequestCount } = useReadContract({
    address: RWAOracle_ADDRESS,
    abi: RWAOracle_ABI,
    functionName: 'randomRequestCount',
    query: {
      enabled: !!RWAOracle_ADDRESS,
    }
  })

  // 读取最新的随机数
  const { data: randomNumberData, refetch: refetchRandomNumbers } = useReadContract({
    address: RWAOracle_ADDRESS,
    abi: RWAOracle_ABI,
    functionName: 'getRandomNumber',
    args: randomRequestCount ? [BigInt(randomRequestCount)] : undefined,
    query: {
      enabled: !!RWAOracle_ADDRESS && !!randomRequestCount && randomRequestCount > 0n,
    }
  })

  // 读取资产估值
  const { data: currentAssetValuation, refetch: refetchAssetValuation } = useReadContract({
    address: RWAOracle_ADDRESS,
    abi: RWAOracle_ABI,
    functionName: 'getAssetValuation',
    args: [BigInt(1)], // 资产ID 1
    query: {
      enabled: !!RWAOracle_ADDRESS,
    }
  })

  // 监听randomRequestCount变化，自动刷新随机数数据
  useEffect(() => {
    console.log('🔍 randomRequestCount状态变化:', randomRequestCount, '(类型:', typeof randomRequestCount, ')')
    if (randomRequestCount && randomRequestCount > 0n) {
      console.log('🔄 检测到randomRequestCount更新，自动刷新随机数数据...')
      setTimeout(() => {
        refetchRandomNumbers()
      }, 1000)
    }
  }, [randomRequestCount])

  // 调试：添加数据读取日志
  useEffect(() => {
    console.log('🔍 详细调试信息:')
    console.log('  randomRequestCount:', randomRequestCount, '(类型:', typeof randomRequestCount, ')')
    console.log('  randomNumberData:', randomNumberData, '(类型:', typeof randomNumberData, ')')
    console.log('  randomNumbers状态:', randomNumbers.length, '个元素')
    if (randomNumbers.length > 0) {
      console.log('  最新随机数:', randomNumbers[0]?.toString())
    }
    console.log('  currentAssetValuation:', currentAssetValuation)
    console.log('  getRandomNumber查询启用状态:', !!RWAOracle_ADDRESS && !!randomRequestCount && randomRequestCount > 0n)
  }, [randomRequestCount, randomNumberData, currentAssetValuation, randomNumbers])

  // 更新ETH价格数据
  const handleUpdatePrice = async () => {
    console.log('💰 开始更新ETH价格数据:')
    console.log('  合约地址:', RWAOracle_ADDRESS)
    console.log('  操作者:', address)
    console.log('  资产标识: ETH')

    try {
      // 生成模拟价格（基于当前时间戳的伪随机价格）
      const basePrice = 3500; // 基础价格 $3500
      const variation = Math.floor(Math.random() * 200) - 100; // ±$100 变化
      const newPrice = (basePrice + variation) * 100000000; // 转换为8位小数
      
      writeContract({
        address: RWAOracle_ADDRESS as `0x${string}`,
        abi: RWAOracle_ABI,
        functionName: 'updatePrice',
        args: ['ETH', BigInt(newPrice)],
      })
      
      console.log('✅ ETH价格更新交易已发送到区块链，等待确认...')
      console.log('  新价格: $', (newPrice / 100000000).toFixed(2))
      
    } catch (error) {
      console.error('❌ 更新ETH价格失败:', error)
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
    console.log('  当前randomRequestCount:', randomRequestCount)

    try {
      // 使用时间戳作为种子
      const seed = BigInt(Math.floor(Date.now() / 1000))
      
      writeContract({
        address: RWAOracle_ADDRESS as `0x${string}`,
        abi: RWAOracle_ABI,
        functionName: 'requestRandomNumber',
        args: [seed],
      })
      
      console.log('✅ 随机数生成请求交易已发送到区块链，等待确认...')
      console.log('  种子值:', seed.toString())
      console.log('  当前randomRequestCount:', randomRequestCount, '(类型:', typeof randomRequestCount, ')')
      console.log('  预期新的requestId将是:', Number(randomRequestCount || 0n) + 1)
      
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

  // 步骤1：添加价格喂送
  const handleAddPriceFeed = async () => {
    console.log('🔧 开始添加价格喂送:')
    console.log('  合约地址:', RWAOracle_ADDRESS)
    console.log('  操作者:', address)
    console.log('  合约所有者:', contractOwner)

    // 检查权限
    if (contractOwner && String(contractOwner).toLowerCase() !== address.toLowerCase()) {
      console.error('❌ 权限不足: 当前用户不是合约所有者')
      alert('只有合约所有者才能添加价格喂送！')
      return
    }

    try {
      setInitializationStep(1)
      
      writeContract({
        address: RWAOracle_ADDRESS as `0x${string}`,
        abi: RWAOracle_ABI,
        functionName: 'addPriceFeed',
        args: ['ETH', '0x0000000000000000000000000000000000000000' as `0x${string}`, 8], // 8位小数
      })
      
      console.log('✅ ETH价格喂送添加交易已发送')
      alert('价格喂送添加请求已发送，请等待确认')
      
    } catch (error) {
      console.error('❌ 添加价格喂送失败:', error)
      setInitializationStep(0)
      alert('添加价格喂送失败，请检查控制台日志')
    }
  }

  // 步骤2：设置初始价格
  const handleSetInitialPrice = async () => {
    console.log('💰 开始设置初始价格:')
    console.log('  合约地址:', RWAOracle_ADDRESS)

    try {
      setInitializationStep(2)
      
      const initialPrice = BigInt(350000000000) // $3500.00, 8位小数
      writeContract({
        address: RWAOracle_ADDRESS as `0x${string}`,
        abi: RWAOracle_ABI,
        functionName: 'updatePrice',
        args: ['ETH', initialPrice],
      })
      
      console.log('✅ 初始价格设置交易已发送')
      
    } catch (error) {
      console.error('❌ 设置初始价格失败:', error)
      setInitializationStep(1)
      alert('设置初始价格失败，请检查控制台日志')
    }
  }

  // 请求资产估值
  const handleRequestValuation = async () => {
    console.log('📊 开始请求资产估值:')
    console.log('  合约地址:', RWAOracle_ADDRESS)
    console.log('  请求者:', address)
    console.log('  资产ID: 1')
    console.log('  价格标识: ETH')

    try {
      const assetId = BigInt(1) // 资产ID
      
      writeContract({
        address: RWAOracle_ADDRESS as `0x${string}`,
        abi: RWAOracle_ABI,
        functionName: 'requestAssetValuation',
        args: [assetId, 'ETH'], // 资产ID和价格标识
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
    
    if (randomNumberData && Array.isArray(randomNumberData) && randomNumberData.length > 0) {
      setRandomNumbers(randomNumberData)
      console.log('🎲 随机数更新:', randomNumberData.map(n => n.toString()))
    }
    
    if (currentAssetValuation) {
      const valuation = Number(currentAssetValuation) / 1e8 // 与ETH价格保持一致的单位转换
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
    if (isConfirmed && hash) {
      console.log('✅ 预言机交易已确认，交易哈希:', hash)
      console.log('🔄 刷新数据...')
      
      // 延迟刷新数据，等待链上状态更新
      setTimeout(async () => {
        console.log('🔄 开始刷新数据...')
        refetchEthPrice()
        
        // 重要：先刷新randomRequestCount，再刷新随机数
        await refetchRandomRequestCount()
        setTimeout(() => {
          refetchRandomNumbers()
          console.log('🎲 随机数请求计数已更新，重新读取中...')
        }, 500)
        
        refetchAssetValuation()
        console.log('✅ 所有数据刷新完成')
      }, 2000)

      // 处理初始化步骤确认
      if (initializationStep === 1) {
        console.log('✅ 价格喂送添加完成，自动设置初始价格')
        // 自动调用设置初始价格
        setTimeout(() => {
          handleSetInitialPrice()
        }, 1000)
      } else if (initializationStep === 2) {
        console.log('✅ 初始价格设置完成，初始化流程结束')
        setInitializationStep(3)
        
        // 3秒后重置初始化状态
        setTimeout(() => {
          setInitializationStep(0)
        }, 3000)
      }
    }
  }, [isConfirmed, hash, refetchEthPrice, refetchRandomNumbers, refetchAssetValuation, initializationStep])

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
              {randomNumbers.length > 0 ? randomNumbers[0].toString().slice(0, 10) : '0'}
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
            {/* 初始化区域 */}
            {(!currentEthPrice || currentEthPrice === BigInt(0)) ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">预言机需要初始化</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  请按步骤初始化预言机，添加价格喂送和设置初始价格数据
                </p>
                
                <div className="mb-3 text-xs text-gray-600">
                  合约所有者: {contractOwner ? String(contractOwner).slice(0, 6) + '...' + String(contractOwner).slice(-4) : '加载中...'}
                </div>
                
                {contractOwner && String(contractOwner).toLowerCase() !== address.toLowerCase() ? (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 mb-3">
                    ⚠️ 当前用户不是合约所有者，无法初始化预言机
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* 步骤1：添加价格喂送 */}
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">步骤 1: 添加ETH价格喂送</span>
                        {initializationStep >= 1 ? (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✅ 已完成</span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">待执行</span>
                        )}
                      </div>
                      <Button 
                        onClick={handleAddPriceFeed}
                        disabled={isPending || isConfirming || initializationStep >= 1}
                        size="sm"
                        className="w-full"
                      >
                        {initializationStep >= 1 ? '已添加价格喂送' : '添加价格喂送'}
                      </Button>
                    </div>
                    
                    {/* 步骤2：设置初始价格 */}
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">步骤 2: 设置初始价格</span>
                        {initializationStep >= 2 ? (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✅ 已完成</span>
                        ) : initializationStep === 1 ? (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">可执行</span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">需先完成步骤1</span>
                        )}
                      </div>
                      <Button 
                        onClick={handleSetInitialPrice}
                        disabled={isPending || isConfirming || initializationStep !== 1}
                        size="sm"
                        className="w-full"
                      >
                        {initializationStep >= 2 ? '已设置价格' : '设置初始价格'}
                      </Button>
                    </div>
                  </div>
                )}
                
                {isConfirming && (
                  <div className="mt-3 text-sm text-blue-600">
                    ⏳ 交易确认中，请稍候...
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={handleUpdatePrice}
                  disabled={isPending || isConfirming}
                  className="w-full"
                >
                  {isPending ? '更新中...' : isConfirming ? '确认中...' : '更新ETH价格'}
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
            )}
            
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