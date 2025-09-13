'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { Navigation } from '@/components/Navigation'
import { WalletConnect } from '@/components/WalletConnect'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RWA20_ADDRESS } from '@/lib/wagmi'

// RWA20代币合约ABI
const RWA20_ABI = [
  {
    "inputs": [],
    "name": "name",
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "from", "type": "address" },
      { "name": "to", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "transferFrom",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "recipients", "type": "address[]" },
      { "name": "amounts", "type": "uint256[]" }
    ],
    "name": "batchTransfer",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

export default function TokenTransferPage() {
  const { isConnected, address } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [transferType, setTransferType] = useState<'single' | 'batch'>('single')
  
  // 单笔转账状态
  const [singleRecipient, setSingleRecipient] = useState('')
  const [singleAmount, setSingleAmount] = useState('')
  
  // 批量转账状态
  const [batchRecipients, setBatchRecipients] = useState('')
  const [batchAmounts, setBatchAmounts] = useState('')
  
  // 合约读取
  const { data: tokenName } = useReadContract({
    address: RWA20_ADDRESS as `0x${string}`,
    abi: RWA20_ABI,
    functionName: 'name',
    query: {
      enabled: !!RWA20_ADDRESS
    }
  })
  
  const { data: tokenSymbol } = useReadContract({
    address: RWA20_ADDRESS as `0x${string}`,
    abi: RWA20_ABI,
    functionName: 'symbol',
    query: {
      enabled: !!RWA20_ADDRESS
    }
  })
  
  const { data: tokenDecimals } = useReadContract({
    address: RWA20_ADDRESS as `0x${string}`,
    abi: RWA20_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!RWA20_ADDRESS
    }
  })
  
  const { data: userBalance } = useReadContract({
    address: RWA20_ADDRESS as `0x${string}`,
    abi: RWA20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && !!RWA20_ADDRESS
    }
  })
  
  // 合约写入
  const { writeContract, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p>正在加载...</p>
          </div>
        </div>
      </div>
    )
  }
  
  const handleSingleTransfer = async () => {
    if (!singleRecipient || !singleAmount) {
      alert('请填写接收地址和转账金额')
      return
    }
    
    if (!userBalance) {
      alert('无法查询余额')
      return
    }
    
    const amount = parseEther(singleAmount)
    if (amount > userBalance) {
      alert('余额不足')
      return
    }
    
    try {
      writeContract({
        address: RWA20_ADDRESS as `0x${string}`,
        abi: RWA20_ABI,
        functionName: 'transfer',
        args: [singleRecipient as `0x${string}`, amount],
      })
    } catch (error) {
      console.error('转账失败:', error)
      alert('转账失败')
    }
  }
  
  const handleBatchTransfer = async () => {
    const recipients = batchRecipients.split('\n').filter(addr => addr.trim())
    const amounts = batchAmounts.split('\n').filter(amount => amount.trim())
    
    if (recipients.length !== amounts.length) {
      alert('接收地址和转账数量不匹配')
      return
    }
    
    if (recipients.length === 0) {
      alert('请填写接收地址和转账金额')
      return
    }
    
    if (!userBalance) {
      alert('无法查询余额')
      return
    }
    
    // 验证地址格式和计算总金额
    const validRecipients: `0x${string}`[] = []
    const parsedAmounts: bigint[] = []
    let totalAmount = 0n
    
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i].trim()
      const amount = amounts[i].trim()
      
      if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
        alert(`地址格式错误: ${recipient}`)
        return
      }
      
      try {
        const parsedAmount = parseEther(amount)
        validRecipients.push(recipient as `0x${string}`)
        parsedAmounts.push(parsedAmount)
        totalAmount += parsedAmount
      } catch (error) {
        alert(`金额格式错误: ${amount}`)
        return
      }
    }
    
    if (totalAmount > userBalance) {
      alert(`余额不足。需要: ${formatEther(totalAmount)} ${tokenSymbol}，可用: ${formatEther(userBalance)} ${tokenSymbol}`)
      return
    }
    
    try {
      writeContract({
        address: RWA20_ADDRESS as `0x${string}`,
        abi: RWA20_ABI,
        functionName: 'batchTransfer',
        args: [validRecipients, parsedAmounts],
      })
    } catch (error) {
      console.error('批量转账失败:', error)
      alert('批量转账失败')
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            RWA20代币转账
          </h1>
          <p className="text-xl text-gray-600">
            向不同账户分配代币，实现多账号治理
          </p>
        </header>

        <Navigation />

        <div className="container mx-auto px-4 mt-8">
          {!isConnected ? (
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>连接钱包开始使用</CardTitle>
                  <CardDescription>
                    请连接您的Web3钱包以访问代币转账功能
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <WalletConnect />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                  <WalletConnect />
                  
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>代币信息</CardTitle>
                      <CardDescription>RWA20代币详情</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm text-gray-600">代币名称</Label>
                        <p className="font-medium">{tokenName || 'RWA20'}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">代币符号</Label>
                        <p className="font-medium">{tokenSymbol || 'RWA'}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">精度</Label>
                        <p className="font-medium">{tokenDecimals?.toString() || '18'}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">合约地址</Label>
                        <p className="text-xs font-mono text-gray-600 break-all">
                          {RWA20_ADDRESS || '未配置'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>用户余额</CardTitle>
                      <CardDescription>您的代币余额</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">
                          {userBalance ? formatEther(userBalance) : '0'}
                        </p>
                        <p className="text-sm text-gray-600">{tokenSymbol || 'RWA'}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="lg:col-span-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>代币转账</CardTitle>
                      <CardDescription>
                        将RWA20代币转账到不同账户，为治理系统分配投票权
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {isPending || isConfirming ? (
                        <Alert>
                          <AlertDescription>
                            {isPending ? '交易发送中...' : '交易确认中...'}
                            {hash && (
                              <div className="text-xs mt-2">
                                交易哈希: {hash}
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      ) : isConfirmed ? (
                        <Alert>
                          <AlertDescription className="text-green-600">
                            交易已成功确认！
                          </AlertDescription>
                        </Alert>
                      ) : null}
                      
                      <div className="flex space-x-4">
                        <Button
                          variant={transferType === 'single' ? 'default' : 'outline'}
                          onClick={() => setTransferType('single')}
                          className="flex-1"
                        >
                          单笔转账
                        </Button>
                        <Button
                          variant={transferType === 'batch' ? 'default' : 'outline'}
                          onClick={() => setTransferType('batch')}
                          className="flex-1"
                        >
                          批量转账
                        </Button>
                      </div>
                      
                      {transferType === 'single' ? (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="recipient">接收地址</Label>
                            <Input
                              id="recipient"
                              placeholder="0x..."
                              value={singleRecipient}
                              onChange={(e) => setSingleRecipient(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="amount">转账金额 ({tokenSymbol || 'RWA'})</Label>
                            <Input
                              id="amount"
                              type="number"
                              step="0.000001"
                              placeholder="0.0"
                              value={singleAmount}
                              onChange={(e) => setSingleAmount(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <Button 
                            onClick={handleSingleTransfer}
                            disabled={isPending || isConfirming}
                            className="w-full"
                          >
                            {isPending || isConfirming ? '处理中...' : '发送转账'}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="recipients">接收地址 (每行一个)</Label>
                              <textarea
                                id="recipients"
                                placeholder="0x123...\n0x456...\n0x789..."
                                value={batchRecipients}
                                onChange={(e) => setBatchRecipients(e.target.value)}
                                className="mt-1 w-full p-2 border rounded-md"
                                rows={6}
                              />
                            </div>
                            <div>
                              <Label htmlFor="amounts">转账金额 (每行一个)</Label>
                              <textarea
                                id="amounts"
                                placeholder="100\n200\n300"
                                value={batchAmounts}
                                onChange={(e) => setBatchAmounts(e.target.value)}
                                className="mt-1 w-full p-2 border rounded-md"
                                rows={6}
                              />
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>注意：地址和金额数量必须一致，每行一个</p>
                            <p>示例：3个地址对应3个金额</p>
                          </div>
                          <Button 
                            onClick={handleBatchTransfer}
                            disabled={isPending || isConfirming}
                            className="w-full"
                          >
                            {isPending || isConfirming ? '处理中...' : '发送批量转账'}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>使用说明</CardTitle>
                      <CardDescription>如何使用代币转账功能</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <Badge variant="outline" className="mt-1">1</Badge>
                        <div>
                          <p className="font-medium">单笔转账</p>
                          <p className="text-sm text-gray-600">向单个地址转账代币</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Badge variant="outline" className="mt-1">2</Badge>
                        <div>
                          <p className="font-medium">批量转账</p>
                          <p className="text-sm text-gray-600">一次性向多个地址转账不同金额的代币</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Badge variant="outline" className="mt-1">3</Badge>
                        <div>
                          <p className="font-medium">治理系统</p>
                          <p className="text-sm text-gray-600">代币持有者可以参与DAO治理投票</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}