'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { RWAMultisigWallet_ADDRESS, RWAMultisigWallet_ABI } from '@/lib/wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

export function MultisigManagement({ address }: { address: string }) {
  const [newTransactionDestination, setNewTransactionDestination] = useState('')
  const [newTransactionValue, setNewTransactionValue] = useState('')
  const [newTransactionData, setNewTransactionData] = useState('')
  const [debugInfo, setDebugInfo] = useState<string>('')

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

  // 读取所需确认数
  const { data: requiredConfirmations, error: thresholdError } = useReadContract({
    address: RWAMultisigWallet_ADDRESS,
    abi: RWAMultisigWallet_ABI,
    functionName: 'signatureThreshold',
    query: {
      enabled: !!RWAMultisigWallet_ADDRESS,
    }
  })

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

  // 检查是否是所有者
  const { data: isOwner } = useReadContract({
    address: RWAMultisigWallet_ADDRESS,
    abi: RWAMultisigWallet_ABI,
    functionName: 'isActiveSigner',
    args: [address as `0x${string}`],
  })

  // 提交交易
  const handleSubmitTransaction = async () => {
    if (!newTransactionDestination) return

    try {
      writeContract({
        address: RWAMultisigWallet_ADDRESS,
        abi: RWAMultisigWallet_ABI,
        functionName: 'createEtherTransaction',
        args: [
          newTransactionDestination as `0x${string}`,
          newTransactionValue ? BigInt(newTransactionValue) : 0n,
          BigInt(Math.floor(Date.now() / 1000) + 86400), // 24小时后过期
        ],
      })
    } catch (error) {
      console.error('提交交易失败:', error)
    }
  }

  // 确认交易
  const handleConfirmTransaction = async (transactionId: bigint) => {
    try {
      writeContract({
        address: RWAMultisigWallet_ADDRESS,
        abi: RWAMultisigWallet_ABI,
        functionName: 'signTransaction',
        args: [transactionId, '0x'], // 签名需要根据实际情况调整
      })
    } catch (error) {
      console.error('确认交易失败:', error)
    }
  }

  // 执行交易
  const handleExecuteTransaction = async (transactionId: bigint) => {
    try {
      writeContract({
        address: RWAMultisigWallet_ADDRESS,
        abi: RWAMultisigWallet_ABI,
        functionName: 'executeTransaction',
        args: [transactionId],
      })
    } catch (error) {
      console.error('执行交易失败:', error)
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
            签名者数据: {owners ? JSON.stringify(owners, null, 2) : '无数据'}
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
              {ownersLoading ? '加载中...' : owners ? owners.length : '0'}/{requiredConfirmations?.toString() || '0'}
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
              0
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
            {owners?.map((owner, index) => (
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
            <p className="text-gray-500 text-center py-8">
              交易功能需要先部署多重签名合约并添加签名者
            </p>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                当前状态: {RWAMultisigWallet_ADDRESS ? '合约已配置' : '合约未配置'}
              </p>
              <p className="text-sm text-gray-600">
                签名者数量: {owners ? owners.length : 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}