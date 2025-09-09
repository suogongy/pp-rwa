'use client'

import { useState, useEffect } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { rwa20Contract } from '@/lib/wagmi'

interface TokenActionsProps {
  address: string
}

export function TokenActions({ address }: TokenActionsProps) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [mintAmount, setMintAmount] = useState('')
  const [queryAddress, setQueryAddress] = useState('')
  
  // 错误状态
  const [errors, setErrors] = useState<{
    transfer?: string
    mint?: string
    burn?: string
    query?: string
  }>({})

  // 读取代币信息
  const { data: tokenName, isError: nameError, refetch: refetchTokenName } = useReadContract({
    ...rwa20Contract,
    functionName: 'name',
  })

  const { data: tokenSymbol, isError: symbolError, refetch: refetchTokenSymbol } = useReadContract({
    ...rwa20Contract,
    functionName: 'symbol',
  })

  const { data: decimals, isError: decimalsError, refetch: refetchDecimals } = useReadContract({
    ...rwa20Contract,
    functionName: 'decimals',
  })

  const { data: balance, isError: balanceError, refetch: refetchBalance } = useReadContract({
    ...rwa20Contract,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  })

  const { data: owner, isError: ownerError, refetch: refetchOwner } = useReadContract({
    ...rwa20Contract,
    functionName: 'owner',
  })

  // 查询指定地址的余额
  const { 
    data: queriedBalance, 
    isError: queryError, 
    isLoading: isQueryLoading,
    refetch: refetchQueriedBalance 
  } = useReadContract({
    ...rwa20Contract,
    functionName: 'balanceOf',
    args: [queryAddress as `0x${string}`],
    query: {
      enabled: false, // 手动触发查询
    }
  })

  // 刷新所有相关数据的函数
  const refreshAllData = () => {
    console.log('🔄 刷新所有代币数据')
    refetchTokenName()
    refetchTokenSymbol()
    refetchDecimals()
    refetchBalance()
    refetchOwner()
    // 如果当前有查询地址，也刷新查询结果
    if (queryAddress) {
      refetchQueriedBalance()
    }
  }

  // 合约连接状态监控
  useEffect(() => {
    console.log('🔗 合约连接状态:', {
      contractAddress: rwa20Contract.address,
      tokenName,
      tokenSymbol,
      decimals,
      balance: balance?.toString(),
      owner,
      errors: {
        nameError,
        symbolError,
        decimalsError,
        balanceError,
        ownerError
      }
    })
  }, [tokenName, tokenSymbol, decimals, balance, owner, nameError, symbolError, decimalsError, balanceError, ownerError])

  // 合约写入操作
  const { writeContract, isPending: isTransferPending, data: transferData, error: transferError } = useWriteContract()
  const { writeContract: writeMint, isPending: isMintPending, data: mintData, error: mintError } = useWriteContract()
  const { writeContract: writeBurn, isPending: isBurnPending, data: burnData, error: burnError } = useWriteContract()

  // 等待交易确认
  const { isLoading: isTransferConfirming, isSuccess: isTransferSuccess } = useWaitForTransactionReceipt({
    hash: transferData,
  })

  const { isLoading: isMintConfirming, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({
    hash: mintData,
  })

  const { isLoading: isBurnConfirming, isSuccess: isBurnSuccess } = useWaitForTransactionReceipt({
    hash: burnData,
  })

  const handleTransfer = () => {
    console.log('🔄 开始转账操作')
    console.log('📋 转账参数:', { recipient, amount, decimals })
    
    if (!recipient || !amount || !decimals) {
      console.error('❌ 转账参数缺失:', { recipient: !!recipient, amount: !!amount, decimals: !!decimals })
      return
    }
    
    // 验证地址格式
    if (!recipient.startsWith('0x') || recipient.length !== 42) {
      console.error('❌ 无效的接收地址格式:', recipient)
      return
    }
    
    // 验证金额
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      console.error('❌ 无效的转账金额:', amount)
      return
    }
    
    const transferAmount = parseEther(amount)
    console.log('💰 转账金额 (wei):', transferAmount.toString())
    
    try {
      writeContract({
        ...rwa20Contract,
        functionName: 'transfer',
        args: [recipient as `0x${string}`, transferAmount],
      })
      console.log('✅ 转账交易已提交')
    } catch (error) {
      console.error('❌ 转账交易提交失败:', error)
    }
  }

  const handleMint = () => {
    console.log('🔄 开始铸造操作')
    console.log('📋 铸造参数:', { mintAmount, address, decimals })
    
    if (!mintAmount || !address || !decimals) {
      console.error('❌ 铸造参数缺失:', { mintAmount: !!mintAmount, address: !!address, decimals: !!decimals })
      return
    }
    
    const mintAmountNum = parseFloat(mintAmount)
    if (isNaN(mintAmountNum) || mintAmountNum <= 0) {
      console.error('❌ 无效的铸造金额:', mintAmount)
      return
    }
    
    const mintValue = parseEther(mintAmount)
    console.log('💰 铸造金额 (wei):', mintValue.toString())
    
    try {
      writeMint({
        ...rwa20Contract,
        functionName: 'mint',
        args: [address as `0x${string}`, mintValue],
      })
      console.log('✅ 铸造交易已提交')
    } catch (error) {
      console.error('❌ 铸造交易提交失败:', error)
    }
  }

  const handleBurn = () => {
    console.log('🔄 开始销毁操作')
    console.log('📋 销毁参数:', { amount, address, decimals })
    
    if (!amount || !address || !decimals) {
      console.error('❌ 销毁参数缺失:', { amount: !!amount, address: !!address, decimals: !!decimals })
      return
    }
    
    const burnAmountNum = parseFloat(amount)
    if (isNaN(burnAmountNum) || burnAmountNum <= 0) {
      console.error('❌ 无效的销毁金额:', amount)
      return
    }
    
    const burnValue = parseEther(amount)
    console.log('💰 销毁金额 (wei):', burnValue.toString())
    
    try {
      writeBurn({
        ...rwa20Contract,
        functionName: 'burn',
        args: [burnValue],
      })
      console.log('✅ 销毁交易已提交')
    } catch (error) {
      console.error('❌ 销毁交易提交失败:', error)
    }
  }

  const handleQueryBalance = () => {
    console.log('🔍 开始查询余额')
    console.log('📋 查询地址:', queryAddress)
    
    if (!queryAddress) {
      console.error('❌ 查询地址为空')
      setErrors(prev => ({ ...prev, query: '请输入要查询的地址' }))
      return
    }
    
    // 验证地址格式
    if (!queryAddress.startsWith('0x') || queryAddress.length !== 42) {
      console.error('❌ 无效的地址格式:', queryAddress)
      setErrors(prev => ({ ...prev, query: '无效的地址格式' }))
      return
    }
    
    // 清除之前的错误
    setErrors(prev => ({ ...prev, query: undefined }))
    
    // 执行查询
    refetchQueriedBalance()
    console.log('✅ 余额查询已发起')
  }

  const isOwner = owner === address

  // 监控交易状态变化
  useEffect(() => {
    console.log('📊 交易状态更新:', {
      isTransferPending,
      isTransferConfirming,
      isTransferSuccess,
      transferData,
      transferError: transferError?.message
    })
    
    // 转账成功后自动刷新数据
    if (isTransferSuccess) {
      console.log('✅ 转账成功，自动刷新数据')
      refreshAllData()
    }
  }, [isTransferPending, isTransferConfirming, isTransferSuccess, transferData, transferError])

  useEffect(() => {
    console.log('📊 铸造状态更新:', {
      isMintPending,
      isMintConfirming,
      isMintSuccess,
      mintData,
      mintError: mintError?.message
    })
    
    // 铸造成功后自动刷新数据
    if (isMintSuccess) {
      console.log('✅ 铸造成功，自动刷新数据')
      refreshAllData()
    }
  }, [isMintPending, isMintConfirming, isMintSuccess, mintData, mintError])

  useEffect(() => {
    console.log('📊 销毁状态更新:', {
      isBurnPending,
      isBurnConfirming,
      isBurnSuccess,
      burnData,
      burnError: burnError?.message
    })
    
    // 销毁成功后自动刷新数据
    if (isBurnSuccess) {
      console.log('✅ 销毁成功，自动刷新数据')
      refreshAllData()
    }
  }, [isBurnPending, isBurnConfirming, isBurnSuccess, burnData, burnError])

  // 更新错误状态
  useEffect(() => {
    if (transferError) {
      console.error('❌ 转账错误:', transferError)
      setErrors(prev => ({ ...prev, transfer: transferError.message }))
    }
  }, [transferError])

  useEffect(() => {
    if (mintError) {
      console.error('❌ 铸造错误:', mintError)
      setErrors(prev => ({ ...prev, mint: mintError.message }))
    }
  }, [mintError])

  useEffect(() => {
    if (burnError) {
      console.error('❌ 销毁错误:', burnError)
      setErrors(prev => ({ ...prev, burn: burnError.message }))
    }
  }, [burnError])

  // 监控查询状态
  useEffect(() => {
    console.log('🔍 查询状态更新:', {
      isQueryLoading,
      queriedBalance: queriedBalance?.toString(),
      queryError: queryError?.message
    })
  }, [isQueryLoading, queriedBalance, queryError])

  // 清除错误
  const clearErrors = () => {
    setErrors({})
  }

  return (
    <div className="space-y-6">
      {/* 代币信息 */}
      <Card>
        <CardHeader>
          <CardTitle>代币信息</CardTitle>
          <CardDescription>当前代币的基本信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">代币名称</Label>
              <div className="text-lg font-semibold">{tokenName || '加载中...'}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">代币符号</Label>
              <div className="text-lg font-semibold">{tokenSymbol || '加载中...'}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">精度</Label>
              <div className="text-lg font-semibold">{decimals?.toString() || '加载中...'}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">您的余额</Label>
              <div className="text-lg font-semibold">
                {balance && decimals ? formatEther(balance) : '0'} {tokenSymbol}
              </div>
            </div>
          </div>
          {isOwner && (
            <Alert>
              <AlertDescription>
                您是代币合约的所有者，可以进行铸造和销毁操作。
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 地址余额查询 */}
      <Card>
        <CardHeader>
          <CardTitle>地址余额查询</CardTitle>
          <CardDescription>查询指定地址的RWA代币余额</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="queryAddress">查询地址</Label>
            <Input
              id="queryAddress"
              placeholder="0x..."
              value={queryAddress}
              onChange={(e) => setQueryAddress(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => {
              clearErrors()
              handleQueryBalance()
            }}
            disabled={!queryAddress || isQueryLoading}
            className="w-full"
            variant="outline"
          >
            {isQueryLoading ? '查询中...' : '查询余额'}
          </Button>
          
          {/* 错误显示 */}
          {errors.query && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                查询失败: {errors.query}
              </AlertDescription>
            </Alert>
          )}
          
          {/* 查询结果 */}
          {queriedBalance !== undefined && !queryError && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-700">
                <div className="space-y-2">
                  <div className="font-medium">查询结果:</div>
                  <div>地址: {queryAddress.slice(0, 6)}...{queryAddress.slice(-4)}</div>
                  <div>余额: {formatEther(queriedBalance)} {tokenSymbol}</div>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {/* 调试信息 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 space-y-1">
              <div>调试信息:</div>
              <div>• 查询地址: {queryAddress ? `${queryAddress.slice(0, 6)}...${queryAddress.slice(-4)}` : '未设置'}</div>
              <div>• 查询状态: {isQueryLoading ? '查询中' : queriedBalance !== undefined ? '成功' : '待查询'}</div>
              <div>• 查询余额: {queriedBalance ? formatEther(queriedBalance) : '无'}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 转账操作 */}
      <Card>
        <CardHeader>
          <CardTitle>代币转账</CardTitle>
          <CardDescription>向其他地址转账代币</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">接收地址</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">转账数量</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => {
              clearErrors()
              handleTransfer()
            }}
            disabled={!recipient || !amount || isTransferPending || isTransferConfirming}
            className="w-full"
          >
            {isTransferPending ? '确认中...' : isTransferConfirming ? '转账中...' : '转账'}
          </Button>
          
          {/* 错误显示 */}
          {errors.transfer && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                转账失败: {errors.transfer}
              </AlertDescription>
            </Alert>
          )}
          
          {/* 成功显示 */}
          {isTransferSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">
                ✅ 转账成功！交易哈希: {transferData?.slice(0, 10)}...
              </AlertDescription>
            </Alert>
          )}
          
          {/* 调试信息 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 space-y-1">
              <div>调试信息:</div>
              <div>• 接收地址: {recipient ? `${recipient.slice(0, 6)}...${recipient.slice(-4)}` : '未设置'}</div>
              <div>• 转账金额: {amount || '未设置'}</div>
              <div>• 交易状态: {isTransferPending ? '待确认' : isTransferConfirming ? '确认中' : isTransferSuccess ? '成功' : '待操作'}</div>
              <div>• 交易哈希: {transferData ? `${transferData.slice(0, 10)}...` : '无'}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 铸造操作 (仅所有者) */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>铸造代币</CardTitle>
            <CardDescription>铸造新的代币到指定地址</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mintAmount">铸造数量</Label>
              <Input
                id="mintAmount"
                type="number"
                placeholder="0.0"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
              />
            </div>
            <Button 
              onClick={() => {
                clearErrors()
                handleMint()
              }}
              disabled={!mintAmount || isMintPending || isMintConfirming}
              className="w-full"
            >
              {isMintPending ? '确认中...' : isMintConfirming ? '铸造中...' : '铸造'}
            </Button>
            
            {/* 错误显示 */}
            {errors.mint && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  铸造失败: {errors.mint}
                </AlertDescription>
              </Alert>
            )}
            
            {/* 成功显示 */}
            {isMintSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">
                  ✅ 铸造成功！交易哈希: {mintData?.slice(0, 10)}...
                </AlertDescription>
              </Alert>
            )}
            
            {/* 调试信息 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-500 space-y-1">
                <div>调试信息:</div>
                <div>• 铸造金额: {mintAmount || '未设置'}</div>
                <div>• 交易状态: {isMintPending ? '待确认' : isMintConfirming ? '确认中' : isMintSuccess ? '成功' : '待操作'}</div>
                <div>• 交易哈希: {mintData ? `${mintData.slice(0, 10)}...` : '无'}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 销毁操作 */}
      <Card>
        <CardHeader>
          <CardTitle>销毁代币</CardTitle>
          <CardDescription>销毁您持有的代币</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="burnAmount">销毁数量</Label>
            <Input
              id="burnAmount"
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => {
              clearErrors()
              handleBurn()
            }}
            disabled={!amount || isBurnPending || isBurnConfirming}
            className="w-full"
            variant="destructive"
          >
            {isBurnPending ? '确认中...' : isBurnConfirming ? '销毁中...' : '销毁'}
          </Button>
          
          {/* 错误显示 */}
          {errors.burn && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                销毁失败: {errors.burn}
              </AlertDescription>
            </Alert>
          )}
          
          {/* 成功显示 */}
          {isBurnSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">
                ✅ 销毁成功！交易哈希: {burnData?.slice(0, 10)}...
              </AlertDescription>
            </Alert>
          )}
          
          {/* 调试信息 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 space-y-1">
              <div>调试信息:</div>
              <div>• 销毁金额: {amount || '未设置'}</div>
              <div>• 交易状态: {isBurnPending ? '待确认' : isBurnConfirming ? '确认中' : isBurnSuccess ? '成功' : '待操作'}</div>
              <div>• 交易哈希: {burnData ? `${burnData.slice(0, 10)}...` : '无'}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}