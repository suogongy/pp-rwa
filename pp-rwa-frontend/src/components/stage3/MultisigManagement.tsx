'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { RWA_MULTISIG_WALLET_ADDRESS, RWAMultisigWallet_ABI } from '@/lib/wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface Transaction {
  id: bigint
  destination: string
  value: bigint
  data: string
  executed: boolean
  confirmations: number
  requiredConfirmations: number
}

export function MultisigManagement({ address }: { address: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [newTransactionDestination, setNewTransactionDestination] = useState('')
  const [newTransactionValue, setNewTransactionValue] = useState('')
  const [newTransactionData, setNewTransactionData] = useState('')

  const { writeContract, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  // 读取所有者列表
  const { data: owners } = useReadContract({
    address: RWA_MULTISIG_WALLET_ADDRESS,
    abi: RWAMultisigWallet_ABI,
    functionName: 'getOwners',
  })

  // 读取所需确认数
  const { data: requiredConfirmations } = useReadContract({
    address: RWA_MULTISIG_WALLET_ADDRESS,
    abi: RWAMultisigWallet_ABI,
    functionName: 'required',
  })

  // 读取交易数量
  const { data: transactionCount } = useReadContract({
    address: RWA_MULTISIG_WALLET_ADDRESS,
    abi: RWAMultisigWallet_ABI,
    functionName: 'transactionCount',
  })

  // 读取合约余额
  const { data: contractBalance } = useReadContract({
    address: RWA_MULTISIG_WALLET_ADDRESS,
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
    address: RWA_MULTISIG_WALLET_ADDRESS,
    abi: RWAMultisigWallet_ABI,
    functionName: 'isOwner',
    args: [address as `0x${string}`],
  })

  // 提交交易
  const handleSubmitTransaction = async () => {
    if (!newTransactionDestination) return

    try {
      writeContract({
        address: RWA_MULTISIG_WALLET_ADDRESS,
        abi: RWAMultisigWallet_ABI,
        functionName: 'submitTransaction',
        args: [
          newTransactionDestination as `0x${string}`,
          newTransactionValue ? BigInt(newTransactionValue) : 0n,
          newTransactionData || '0x',
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
        address: RWA_MULTISIG_WALLET_ADDRESS,
        abi: RWAMultisigWallet_ABI,
        functionName: 'confirmTransaction',
        args: [transactionId],
      })
    } catch (error) {
      console.error('确认交易失败:', error)
    }
  }

  // 执行交易
  const handleExecuteTransaction = async (transactionId: bigint) => {
    try {
      writeContract({
        address: RWA_MULTISIG_WALLET_ADDRESS,
        abi: RWAMultisigWallet_ABI,
        functionName: 'executeTransaction',
        args: [transactionId],
      })
    } catch (error) {
      console.error('执行交易失败:', error)
    }
  }

  // 撤销确认
  const handleRevokeConfirmation = async (transactionId: bigint) => {
    try {
      writeContract({
        address: RWA_MULTISIG_WALLET_ADDRESS,
        abi: RWAMultisigWallet_ABI,
        functionName: 'revokeConfirmation',
        args: [transactionId],
      })
    } catch (error) {
      console.error('撤销确认失败:', error)
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">所有者数量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {owners ? owners.length : '0'}/{requiredConfirmations?.toString() || '0'}
            </div>
            <p className="text-sm text-gray-600">所需/总数</p>
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
              {transactions.filter(t => !t.executed && t.confirmations < t.requiredConfirmations).length}
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
          <CardTitle>所有者列表</CardTitle>
          <CardDescription>当前多重签名钱包的所有者</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {owners?.map((owner, index) => (
              <div key={owner} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium truncate">{owner}</span>
                <Badge variant="outline">所有者 {index + 1}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>交易列表</CardTitle>
          <CardDescription>查看和管理交易</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无交易</p>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id.toString()} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">交易 #{transaction.id.toString()}</h4>
                      <p className="text-sm text-gray-600">目标: {transaction.destination}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={transaction.executed ? 'default' : 'secondary'}>
                        {transaction.executed ? '已执行' : '待确认'}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {transaction.confirmations}/{transaction.requiredConfirmations}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="font-medium">金额: </span>
                      <span>{(Number(transaction.value) / 1e18).toFixed(6)} ETH</span>
                    </div>
                    <div>
                      <span className="font-medium">数据: </span>
                      <span className="font-mono text-xs">
                        {transaction.data === '0x' ? '无' : transaction.data.slice(0, 20) + '...'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {!transaction.executed && isOwner && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleConfirmTransaction(transaction.id)}
                          disabled={transaction.confirmations >= transaction.requiredConfirmations}
                        >
                          确认
                        </Button>
                        {transaction.confirmations >= transaction.requiredConfirmations && (
                          <Button
                            size="sm"
                            onClick={() => handleExecuteTransaction(transaction.id)}
                          >
                            执行
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevokeConfirmation(transaction.id)}
                        >
                          撤销
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}