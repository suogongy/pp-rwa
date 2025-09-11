'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent } from 'wagmi'
import { RWAMultisigWallet_ADDRESS, RWAMultisigWallet_ABI } from '@/lib/wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface Transaction {
  id: bigint
  transactionType: bigint
  destination: string
  value: bigint
  data: string
  timestamp: bigint
  expiration: bigint
  executed: boolean
  cancelled: boolean
  signatures: bigint
  requiredSignatures: bigint
}

export function MultisigManagement({ address }: { address: string }) {
  const [newTransactionDestination, setNewTransactionDestination] = useState('')
  const [newTransactionValue, setNewTransactionValue] = useState('')
  const [newTransactionData, setNewTransactionData] = useState('')
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transactionCounter, setTransactionCounter] = useState<bigint>(0n)
  const isLoadingRef = useRef(false)
  const lastLoadTime = useRef(0)
  const transactionsRef = useRef(transactions)
  const eventLoadTimeout = useRef<NodeJS.Timeout | null>(null)
  
  // 更新transactions ref
  useEffect(() => {
    transactionsRef.current = transactions
  }, [transactions])
  
  
  const { writeContract, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  // 读取所有者列表
  const { data: owners, error: ownersError, isLoading: ownersLoading } = useReadContract({
    address: RWAMultisigWallet_ADDRESS,
    abi: RWAMultisigWallet_ABI,
    functionName: 'getActiveSigners',
    query: {
      enabled: !!RWAMultisigWallet_ADDRESS,
    }
  })
  
  const ownersList = owners || []

  // 读取所需确认数
  const { data: requiredConfirmations, error: thresholdError } = useReadContract({
    address: RWAMultisigWallet_ADDRESS,
    abi: RWAMultisigWallet_ABI,
    functionName: 'signatureThreshold',
    query: {
      enabled: !!RWAMultisigWallet_ADDRESS,
    }
  })
  
  const requiredConfirmationsValue = requiredConfirmations || 1n

  // 交易计数器通过 loadTransactions 函数动态获取

  // 添加调试信息和网络切换提示
  useEffect(() => {
    const chainId = window.ethereum?.chainId || '未知'
    const networkName = chainId === '0x7a69' ? 'Local (31337)' : chainId === '0xaa36a7' ? 'Sepolia (11155111)' : `${chainId} (未知网络)`
    const expectedChainId = '0x7a69' // 31337 in hex
    
    let debugMsg = `合约地址: ${RWAMultisigWallet_ADDRESS || '未配置'}\n当前用户: ${address || '未连接'}\n当前网络: ${networkName}\n期望网络: Local (31337)\n签名者加载中: ${ownersLoading}\n签名者错误: ${ownersError?.message || '无'}\n阈值错误: ${thresholdError?.message || '无'}`
    
    if (chainId !== expectedChainId && chainId !== '未知') {
      debugMsg += '\n\n⚠️ 警告: 当前网络不正确！'
      debugMsg += '\n请切换到 Localhost:8545 网络 (Chain ID: 31337)'
    }
    
    setDebugInfo(debugMsg)
  }, [address, ownersLoading, ownersError, thresholdError])

  // 监听交易创建事件
  useWatchContractEvent({
    address: RWAMultisigWallet_ADDRESS,
    abi: RWAMultisigWallet_ABI,
    eventName: 'TransactionCreated',
    onLogs(logs) {
      console.log('监听到交易创建事件 TransactionCreated:')
      console.log('  事件详情:', logs)
      console.log('  事件数量:', logs.length)
      logs.forEach((log, index) => {
        console.log(`  事件 ${index + 1}:`, {
          transactionId: log.args.transactionId?.toString(),
          destination: log.args.destination,
          amount: log.args.amount?.toString(),
          transactionType: log.args.transactionType?.toString(),
        })
      })
      debouncedLoadFromEvent() // 防抖加载
    },
  })

  // 监听交易签名事件
  useWatchContractEvent({
    address: RWAMultisigWallet_ADDRESS,
    abi: RWAMultisigWallet_ABI,
    eventName: 'TransactionSigned',
    onLogs(logs) {
      console.log('监听到交易签名事件 TransactionSigned:')
      console.log('  事件详情:', logs)
      console.log('  事件数量:', logs.length)
      logs.forEach((log, index) => {
        console.log(`  事件 ${index + 1}:`, {
          transactionId: log.args.transactionId?.toString(),
          signer: log.args.signer,
        })
      })
      debouncedLoadFromEvent() // 防抖加载
    },
  })

  // 监听交易执行事件
  useWatchContractEvent({
    address: RWAMultisigWallet_ADDRESS,
    abi: RWAMultisigWallet_ABI,
    eventName: 'TransactionExecuted',
    onLogs(logs) {
      console.log('监听到交易执行事件 TransactionExecuted:')
      console.log('  事件详情:', logs)
      console.log('  事件数量:', logs.length)
      logs.forEach((log, index) => {
        console.log(`  事件 ${index + 1}:`, {
          transactionId: log.args.transactionId?.toString(),
          executor: log.args.executor,
          value: log.args.value?.toString(),
        })
      })
      debouncedLoadFromEvent() // 防抖加载
    },
  })

  // 监听交易取消事件
  useWatchContractEvent({
    address: RWAMultisigWallet_ADDRESS,
    abi: RWAMultisigWallet_ABI,
    eventName: 'TransactionCancelled',
    onLogs(logs) {
      console.log('监听到交易取消事件 TransactionCancelled:')
      console.log('  事件详情:', logs)
      console.log('  事件数量:', logs.length)
      logs.forEach((log, index) => {
        console.log(`  事件 ${index + 1}:`, {
          transactionId: log.args.transactionId?.toString(),
        })
      })
      debouncedLoadFromEvent() // 防抖加载
    },
  })

  // 加载交易列表
  const loadTransactions = useCallback(async (force = false) => {
    // 防抖：避免频繁调用
    const now = Date.now()
    if (!force && isLoadingRef.current || (now - lastLoadTime.current < 3000)) {
      console.log('跳过交易加载，防抖中...')
      return
    }
    
    try {
      isLoadingRef.current = true
      lastLoadTime.current = now
      console.log('开始加载交易列表...')
      
      // 由于合约没有公开交易计数器，我们使用本地状态中的交易ID
      // 在实际应用中，你可能需要添加一个公开的交易计数器函数
      const loadedTransactions: Transaction[] = []
      
      let startId: bigint
      let maxTransactionId: bigint
      
      if (force || transactionsRef.current.length === 0) {
        // 强制加载或初始加载：从1开始检查，但限制范围
        startId = 1n
        maxTransactionId = 20n // 初始检查前20个交易
        console.log('强制/初始加载模式')
      } else {
        // 增量加载：从当前最大交易ID开始
        startId = BigInt(Math.max(...transactionsRef.current.map(tx => Number(tx.id)))) + 1n
        maxTransactionId = startId + 5n // 每次最多检查5个新交易
        console.log('增量加载模式')
      }
      
      console.log(`检查交易ID范围: ${startId.toString()} 到 ${maxTransactionId.toString()}`)
      
      for (let i = startId; i <= maxTransactionId; i++) {
        try {
          const txData = await getTransactionDetails(i)
          if (txData && txData.timestamp > 0n) { // 只添加有实际时间戳的交易
            loadedTransactions.push(txData)
            console.log(`加载交易 ${i.toString()}:`, txData)
          } else {
            // 如果交易时间戳为0，说明是空交易，停止检查
            console.log(`交易 ${i.toString()} 为空，停止检查`)
            break
          }
        } catch (error) {
          // 如果交易不存在，继续检查下一个
          console.log(`交易 ${i.toString()} 不存在，继续检查下一个`)
          continue
        }
      }
      
      if (force) {
        // 强制加载：完全替换现有交易
        const sortedTransactions = loadedTransactions
          .sort((a, b) => b.timestamp > a.timestamp ? 1 : -1)
        
        setTransactions(sortedTransactions)
        console.log(`强制加载完成，共 ${sortedTransactions.length} 笔交易`)
      } else if (loadedTransactions.length > 0) {
        // 增量加载：合并新旧交易
        const allTransactions = [...transactionsRef.current, ...loadedTransactions]
          .sort((a, b) => b.timestamp > a.timestamp ? 1 : -1)
          // 去重
          .filter((tx, index, self) => self.findIndex(t => t.id === tx.id) === index)
        
        setTransactions(allTransactions)
        console.log(`增量加载完成，共 ${allTransactions.length} 笔交易 (新增 ${loadedTransactions.length} 笔)`)
      } else {
        console.log('没有发现新交易')
      }
      
    } catch (error) {
      console.error('❌ 加载交易列表失败:', error)
    } finally {
      isLoadingRef.current = false
    }
  }, [RWAMultisigWallet_ADDRESS, requiredConfirmationsValue])

  // 防抖的事件加载函数
  const debouncedLoadFromEvent = useCallback(() => {
    if (eventLoadTimeout.current) {
      clearTimeout(eventLoadTimeout.current)
    }
    eventLoadTimeout.current = setTimeout(() => {
      loadTransactions(true)
    }, 1000) // 1秒防抖
  }, [loadTransactions])

  // 获取交易详情 - 简化版本
  const getTransactionDetails = async (transactionId: bigint): Promise<Transaction | null> => {
    try {
      console.log(`🔍 获取交易 ${transactionId.toString()} 详情...`)
      
      // 使用 fetch 调用合约（简化实现）
      // 在实际应用中，你应该使用 wagmi 的 useReadContract 或者创建一个 API 路由
      const response = await fetch(`/api/contract-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: RWAMultisigWallet_ADDRESS,
          abi: RWAMultisigWallet_ABI,
          functionName: 'getTransaction',
          args: [transactionId.toString()]
        })
      })
      
      if (!response.ok) {
        console.log(`⏭️ 交易 ${transactionId.toString()} 不存在`)
        return null
      }
      
      const txData = await response.json()
      
      if (!txData.data) {
        console.log(`⏭️ 交易 ${transactionId.toString()} 不存在`)
        return null
      }
      
      // 获取签名数量
      const signatureResponse = await fetch(`/api/contract-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: RWAMultisigWallet_ADDRESS,
          abi: RWAMultisigWallet_ABI,
          functionName: 'signatureCount',
          args: [transactionId.toString()]
        })
      })
      
      const signatureData = await signatureResponse.json()
      const signatureCount = signatureData.data || 0
      
      console.log(`✅ 成功获取交易 ${transactionId.toString()} 详情:`, txData.data)
      console.log(`✅ 交易 ${transactionId.toString()} 签名数量:`, signatureCount)
      
      // 解析合约返回的交易数据
      return {
        id: transactionId,
        transactionType: BigInt(txData.data.transactionType),
        destination: txData.data.destination,
        value: BigInt(txData.data.value),
        data: txData.data.data,
        timestamp: BigInt(txData.data.timestamp),
        expiration: BigInt(txData.data.deadline),
        executed: txData.data.status === 2n, // TransactionStatus.EXECUTED = 2
        cancelled: txData.data.status === 3n, // TransactionStatus.CANCELLED = 3
        signatures: BigInt(signatureCount),
        requiredSignatures: requiredConfirmationsValue,
      }
      
    } catch (error) {
      console.error(`❌ 获取交易 ${transactionId.toString()} 详情失败:`, error)
      return null
    }
  }

  // 当交易确认后清空表单
  useEffect(() => {
    if (isConfirmed) {
      console.log('✅ 交易已确认，交易哈希:', hash)
      console.log('🧹 清空表单数据')
      setNewTransactionDestination('')
      setNewTransactionValue('')
      setNewTransactionData('')
    }
  }, [isConfirmed, hash])

  // 添加加载状态日志
  useEffect(() => {
    console.log('⏳ 合约数据加载状态:')
    console.log('  签名者加载中:', ownersLoading)
    console.log('  交易提交中:', isPending)
    console.log('  交易确认中:', isConfirming)
    console.log('  交易已确认:', isConfirmed)
    
    if (ownersError) {
      console.error('❌ 签名者加载错误:', ownersError)
    }
    if (thresholdError) {
      console.error('❌ 阈值获取错误:', thresholdError)
    }
  }, [ownersLoading, isPending, isConfirming, isConfirmed, ownersError, thresholdError])

  // 组件加载时初始化交易列表
  useEffect(() => {
    if (RWAMultisigWallet_ADDRESS) {
      console.log('🚀 组件初始化，开始加载交易列表...')
      debouncedLoadFromEvent() // 防抖加载
    }
  }, [RWAMultisigWallet_ADDRESS])

  // 自动切换网络功能
  const switchToCorrectNetwork = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x7a69' }], // 31337 in hex
        })
      } catch (error) {
        console.error('切换网络失败:', error)
      }
    }
  }

  // 读取合约余额
  const { data: contractBalance } = useReadContract({
    address: RWAMultisigWallet_ADDRESS,
    abi: [
      {
        inputs: [],
        name: 'getBalance',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'getBalance',
  })

  // 检查是否是所有者 - 提供默认值
  const { data: isOwnerData } = useReadContract({
    address: RWAMultisigWallet_ADDRESS,
    abi: RWAMultisigWallet_ABI,
    functionName: 'isActiveSigner',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && !!RWAMultisigWallet_ADDRESS,
    }
  })
  
  const isOwner = isOwnerData || false

  // 添加交易状态监听日志
  useEffect(() => {
    console.log('📊 多重签名合约状态更新:')
    console.log('  交易列表数量:', transactions.length)
    console.log('  当前用户地址:', address)
    console.log('  是否为所有者:', isOwner)
    console.log('  合约地址:', RWAMultisigWallet_ADDRESS)
    console.log('  签名者列表:', ownersList)
    console.log('  所需确认数:', requiredConfirmationsValue.toString())
    console.log('  合约余额:', contractBalance?.toString() || '0')
  }, [transactions, address, ownersList, requiredConfirmationsValue, contractBalance, isOwner])

  // 提交交易
  const handleSubmitTransaction = async () => {
    if (!newTransactionDestination) {
      console.warn('🚫 提交交易失败: 目标地址为空')
      return
    }

    console.log('🚀 开始提交多重签名交易:')
    console.log('  目标地址:', newTransactionDestination)
    console.log('  金额:', newTransactionValue || '0', 'ETH')
    console.log('  数据:', newTransactionData || '0x')
    console.log('  合约地址:', RWAMultisigWallet_ADDRESS)
    console.log('  当前用户:', address)
    console.log('  当前时间戳:', Math.floor(Date.now() / 1000))

    try {
      const txArgs = [
        newTransactionDestination as `0x${string}`,
        newTransactionValue ? BigInt(newTransactionValue) : 0n,
        BigInt(Math.floor(Date.now() / 1000) + 86400), // 24小时后过期
      ]
      
      console.log('📝 交易参数:', txArgs)
      
      writeContract({
        address: RWAMultisigWallet_ADDRESS,
        abi: RWAMultisigWallet_ABI,
        functionName: 'createEtherTransaction',
        args: txArgs,
      })
      
      console.log('✅ 交易已发送到区块链，等待确认...')
      
      // 添加交易到本地状态（临时解决方案）
      const newTx: Transaction = {
        id: BigInt(transactions.length + 1),
        transactionType: 1n, // ETH 转账
        destination: newTransactionDestination,
        value: newTransactionValue ? BigInt(newTransactionValue) : 0n,
        data: newTransactionData || '0x',
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        expiration: BigInt(Math.floor(Date.now() / 1000) + 86400),
        executed: false,
        cancelled: false,
        signatures: 0n,
        requiredSignatures: requiredConfirmationsValue,
      }
      
      setTransactions([newTx, ...transactions])
      console.log('📋 交易已添加到本地状态:', newTx)
      
    } catch (error) {
      console.error('❌ 提交交易失败:', error)
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : '无堆栈信息',
        code: (error as Error & { code?: string })?.code,
        data: (error as Error & { data?: unknown })?.data
      })
    }
  }

  // 确认交易
  const handleConfirmTransaction = async (transactionId: bigint) => {
    console.log('✍️ 开始确认多重签名交易:')
    console.log('  交易ID:', transactionId.toString())
    console.log('  签名者:', address)
    console.log('  合约地址:', RWAMultisigWallet_ADDRESS)

    try {
      const txArgs = [transactionId, '0x'] // 签名需要根据实际情况调整
      console.log('📝 签名参数:', txArgs)
      
      writeContract({
        address: RWAMultisigWallet_ADDRESS,
        abi: RWAMultisigWallet_ABI,
        functionName: 'signTransaction',
        args: txArgs,
      })
      
      console.log('✅ 签名交易已发送到区块链，等待确认...')
      
      // 更新本地状态（临时解决方案）
      const updatedTransactions = transactions.map(tx => 
        tx.id === transactionId 
          ? { ...tx, signatures: tx.signatures + 1n }
          : tx
      )
      setTransactions(updatedTransactions)
      console.log('📋 本地状态已更新 - 交易签名数:', 
        updatedTransactions.find(tx => tx.id === transactionId)?.signatures.toString()
      )
      
    } catch (error) {
      console.error('❌ 确认交易失败:', error)
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : '无堆栈信息',
        code: (error as Error & { code?: string })?.code,
        data: (error as Error & { data?: unknown })?.data
      })
    }
  }

  // 执行交易
  const handleExecuteTransaction = async (transactionId: bigint) => {
    console.log('🚀 开始执行多重签名交易:')
    console.log('  交易ID:', transactionId.toString())
    console.log('  执行者:', address)
    console.log('  合约地址:', RWAMultisigWallet_ADDRESS)

    try {
      const txArgs = [transactionId]
      console.log('📝 执行参数:', txArgs)
      
      writeContract({
        address: RWAMultisigWallet_ADDRESS,
        abi: RWAMultisigWallet_ABI,
        functionName: 'executeTransaction',
        args: txArgs,
      })
      
      console.log('✅ 执行交易已发送到区块链，等待确认...')
      
      // 更新本地状态（临时解决方案）
      const updatedTransactions = transactions.map(tx => 
        tx.id === transactionId 
          ? { ...tx, executed: true }
          : tx
      )
      setTransactions(updatedTransactions)
      console.log('📋 本地状态已更新 - 交易已标记为已执行')
      
    } catch (error) {
      console.error('❌ 执行交易失败:', error)
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : '无堆栈信息',
        code: (error as Error & { code?: string })?.code,
        data: (error as Error & { data?: unknown })?.data
      })
    }
  }

  // 取消交易
  const handleCancelTransaction = async (transactionId: bigint) => {
    console.log('🚫 开始取消多重签名交易:')
    console.log('  交易ID:', transactionId.toString())
    console.log('  取消者:', address)
    console.log('  合约地址:', RWAMultisigWallet_ADDRESS)

    try {
      const txArgs = [transactionId]
      console.log('📝 取消参数:', txArgs)
      
      writeContract({
        address: RWAMultisigWallet_ADDRESS,
        abi: RWAMultisigWallet_ABI,
        functionName: 'cancelTransaction',
        args: txArgs,
      })
      
      console.log('✅ 取消交易已发送到区块链，等待确认...')
      
      // 更新本地状态（临时解决方案）
      const updatedTransactions = transactions.map(tx => 
        tx.id === transactionId 
          ? { ...tx, cancelled: true }
          : tx
      )
      setTransactions(updatedTransactions)
      console.log('📋 本地状态已更新 - 交易已标记为已取消')
      
    } catch (error) {
      console.error('❌ 取消交易失败:', error)
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : '无堆栈信息',
        code: (error as Error & { code?: string })?.code,
        data: (error as Error & { data?: unknown })?.data
      })
    }
  }

  
  useEffect(() => {
    if (isConfirmed) {
      setNewTransactionDestination('')
      setNewTransactionValue('')
      setNewTransactionData('')
    }
  }, [isConfirmed])

  return (
    <div className="space-y-6">
      {/* 调试信息 */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm">调试信息</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-white p-2 rounded border overflow-auto">
            {debugInfo}
          </pre>
          <div className="mt-2 text-xs text-gray-600">
            签名者数据: {JSON.stringify(ownersList, null, 2)}
          </div>
          {(window.ethereum?.chainId !== '0x7a69') && (
            <Button 
              onClick={switchToCorrectNetwork} 
              size="sm" 
              className="mt-2 w-full"
            >
              切换到本地网络 (31337)
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">签名者数量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {ownersLoading ? '加载中...' : ownersList.length}/{requiredConfirmationsValue.toString()}
            </div>
            <p className="text-sm text-gray-600">当前/阈值</p>
            {ownersError && (
              <p className="text-xs text-red-600 mt-1">错误: {ownersError.message}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">合约余额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {contractBalance ? (Number(contractBalance) / 1e18).toFixed(4) : '0'}
            </div>
            <p className="text-sm text-gray-600">ETH</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">待确认交易</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {transactions.filter(tx => !tx.executed && !tx.cancelled).length}
            </div>
            <p className="text-sm text-gray-600">待处理</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">权限状态</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={isOwner ? 'bg-green-500' : 'bg-red-500'}>
              {isOwner ? '所有者' : '非所有者'}
            </Badge>
            <p className="text-sm text-gray-600 mt-1">
              {isOwner ? '可以操作' : '只读权限'}
            </p>
          </CardContent>
        </Card>
      </div>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>提交新交易</CardTitle>
            <CardDescription>创建新的多重签名交易</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="destination">目标地址</Label>
                <Input
                  id="destination"
                  placeholder="0x..."
                  value={newTransactionDestination}
                  onChange={(e) => setNewTransactionDestination(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="value">发送ETH数量</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="0"
                  value={newTransactionValue}
                  onChange={(e) => setNewTransactionValue(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="data">调用数据</Label>
              <Textarea
                id="data"
                placeholder="0x..."
                value={newTransactionData}
                onChange={(e) => setNewTransactionData(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={handleSubmitTransaction}
              disabled={isPending || isConfirming || !newTransactionDestination}
              className="w-full"
            >
              {isPending ? '提交中...' : isConfirming ? '确认中...' : '提交交易'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>签名者列表</CardTitle>
          <CardDescription>当前多重签名钱包的签名者</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ownersList.map((owner, index) => (
              <div key={owner} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium truncate">{owner}</span>
                <Badge variant="outline">签名者 {index + 1}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>交易管理</CardTitle>
          <CardDescription>创建和管理多重签名交易</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  {RWAMultisigWallet_ADDRESS ? '暂无交易记录' : '交易功能需要先部署多重签名合约'}
                </p>
                {RWAMultisigWallet_ADDRESS && (
                  <p className="text-sm text-gray-600">
                    签名者数量: {ownersList.length}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id.toString()} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant={tx.executed ? 'default' : tx.cancelled ? 'destructive' : 'secondary'}>
                          交易 #{tx.id.toString()}
                        </Badge>
                        <Badge variant="outline">
                          {tx.transactionType === 1n ? 'ETH 转账' : '合约调用'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        {tx.executed && <Badge className="bg-green-500">已执行</Badge>}
                        {tx.cancelled && <Badge variant="destructive">已取消</Badge>}
                        {!tx.executed && !tx.cancelled && (
                          <Badge variant="outline">
                            {tx.signatures.toString()}/{tx.requiredSignatures.toString()} 签名
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>目标地址:</strong> {tx.destination}</p>
                      <p><strong>金额:</strong> {Number(tx.value) / 1e18} ETH</p>
                      <p><strong>创建时间:</strong> {new Date(Number(tx.timestamp) * 1000).toLocaleString()}</p>
                      <p><strong>过期时间:</strong> {new Date(Number(tx.expiration) * 1000).toLocaleString()}</p>
                    </div>
                    
                    {tx.data && tx.data !== '0x' && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600"><strong>调用数据:</strong></p>
                        <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                          {tx.data}
                        </p>
                      </div>
                    )}
                    
                    {!tx.executed && !tx.cancelled && isOwner && (
                      <div className="flex space-x-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConfirmTransaction(tx.id)}
                          disabled={isPending || isConfirming}
                        >
                          签名
                        </Button>
                        {tx.signatures >= tx.requiredSignatures && (
                          <Button
                            size="sm"
                            onClick={() => handleExecuteTransaction(tx.id)}
                            disabled={isPending || isConfirming}
                          >
                            执行
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancelTransaction(tx.id)}
                          disabled={isPending || isConfirming}
                        >
                          取消
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}