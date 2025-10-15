'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface MultiSigWallet {
  id: string
  name: string
  owners: string[]
  requiredSignatures: number
  balance: number
  transactionCount: number
  createdAt: number
  isActive: boolean
}

interface Transaction {
  id: string
  walletId: string
  type: 'send' | 'contract-call' | 'owner-change'
  to: string
  amount?: number
  data?: string
  confirmations: string[]
  requiredConfirmations: number
  status: 'pending' | 'executed' | 'failed'
  createdAt: number
  executedAt?: number
  description: string
}

export function MultiSigVault({ isConnected }: { isConnected: boolean }) {
  const [wallets, setWallets] = useState<MultiSigWallet[]>([
    {
      id: '1',
      name: '主基金金库',
      owners: ['0x1234...5678', '0x8765...4321', '0x9876...1234', '0x5432...8765', '0x1111...2222'],
      requiredSignatures: 3,
      balance: 8500000,
      transactionCount: 47,
      createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
      isActive: true
    },
    {
      id: '2',
      name: '运营资金库',
      owners: ['0x1234...5678', '0x8765...4321', '0x9876...1234'],
      requiredSignatures: 2,
      balance: 1200000,
      transactionCount: 23,
      createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
      isActive: true
    },
    {
      id: '3',
      name: '紧急储备库',
      owners: ['0x1234...5678', '0x8765...4321', '0x5432...8765'],
      requiredSignatures: 3,
      balance: 3000000,
      transactionCount: 8,
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      isActive: true
    }
  ])

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      walletId: '1',
      type: 'send',
      to: '0xaaaa...bbbb',
      amount: 500000,
      confirmations: ['0x1234...5678', '0x8765...4321'],
      requiredConfirmations: 3,
      status: 'pending',
      createdAt: Date.now() - 2 * 60 * 60 * 1000,
      description: '支付房地产项目收购款'
    },
    {
      id: '2',
      walletId: '2',
      type: 'contract-call',
      to: '0xcccc...dddd',
      data: '0xabcdef...',
      confirmations: ['0x1234...5678', '0x8765...4321', '0x9876...1234'],
      requiredConfirmations: 2,
      status: 'executed',
      createdAt: Date.now() - 4 * 60 * 60 * 1000,
      executedAt: Date.now() - 1 * 60 * 60 * 1000,
      description: '调用RWA20合约进行代币分发'
    },
    {
      id: '3',
      walletId: '1',
      type: 'send',
      to: '0xeeee...ffff',
      amount: 100000,
      confirmations: ['0x1234...5678'],
      requiredConfirmations: 3,
      status: 'pending',
      createdAt: Date.now() - 6 * 60 * 60 * 1000,
      description: '支付季度运营费用'
    }
  ])

  const [selectedWallet, setSelectedWallet] = useState<MultiSigWallet | null>(wallets[0])
  const [newTx, setNewTx] = useState({
    type: 'send',
    to: '',
    amount: '',
    description: ''
  })
  const [isCreatingTx, setIsCreatingTx] = useState(false)

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'send': '转账',
      'contract-call': '合约调用',
      'owner-change': '管理员变更'
    }
    return labels[type] || type
  }

  const getTransactionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'send': 'bg-blue-100 text-blue-800',
      'contract-call': 'bg-purple-100 text-purple-800',
      'owner-change': 'bg-orange-100 text-orange-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'executed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const handleCreateTransaction = () => {
    if (!selectedWallet || !newTx.to || (newTx.type === 'send' && !newTx.amount)) {
      alert('请填写完整的交易信息')
      return
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      walletId: selectedWallet.id,
      type: newTx.type as any,
      to: newTx.to,
      amount: newTx.type === 'send' ? Number(newTx.amount) : undefined,
      confirmations: [],
      requiredConfirmations: selectedWallet.requiredSignatures,
      status: 'pending',
      createdAt: Date.now(),
      description: newTx.description
    }

    setTransactions(prev => [transaction, ...prev])
    setNewTx({ type: 'send', to: '', amount: '', description: '' })
    setIsCreatingTx(false)
    alert('交易创建成功，等待其他管理员确认')
  }

  const handleConfirmTransaction = (txId: string) => {
    // 这里应该调用智能合约确认交易
    setTransactions(prev => prev.map(tx =>
      tx.id === txId
        ? { ...tx, confirmations: [...tx.confirmations, '0x1234...5678'] }
        : tx
    ))
    alert('交易确认成功')
  }

  const handleExecuteTransaction = (txId: string) => {
    // 这里应该调用智能合约执行交易
    setTransactions(prev => prev.map(tx =>
      tx.id === txId
        ? { ...tx, status: 'executed' as const, executedAt: Date.now() }
        : tx
    ))
    alert('交易执行成功')
  }

  const walletTransactions = selectedWallet
    ? transactions.filter(tx => tx.walletId === selectedWallet.id)
    : []

  if (!isConnected) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">请连接钱包</h3>
          <p className="text-gray-600">连接钱包以访问多重签名金库</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 金库统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">总资产</div>
            <div className="text-2xl font-bold text-gray-900">¥{wallets.reduce((sum, wallet) => sum + wallet.balance, 0).toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1">{wallets.length} 个金库</div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">待处理交易</div>
            <div className="text-2xl font-bold text-yellow-600">{transactions.filter(tx => tx.status === 'pending').length}</div>
            <div className="text-sm text-gray-500 mt-1">需要确认</div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">总交易数</div>
            <div className="text-2xl font-bold text-blue-600">{wallets.reduce((sum, wallet) => sum + wallet.transactionCount, 0)}</div>
            <div className="text-sm text-gray-500 mt-1">历史累计</div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">安全等级</div>
            <div className="text-2xl font-bold text-green-600">最高</div>
            <div className="text-sm text-gray-500 mt-1">多重签名保护</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 金库列表和交易 */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>多重签名金库</CardTitle>
              <CardDescription>管理组织的数字资产，确保资金安全</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {wallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedWallet?.id === wallet.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedWallet(wallet)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{wallet.name}</h4>
                      <Badge className={wallet.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {wallet.isActive ? '活跃' : '停用'}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">余额:</span>
                        <span className="font-medium">¥{wallet.balance.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">签名要求:</span>
                        <span className="font-medium">{wallet.requiredSignatures}/{wallet.owners.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">交易数:</span>
                        <span className="font-medium">{wallet.transactionCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedWallet && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-blue-900 mb-2">管理员列表</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedWallet.owners.map((owner, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-blue-700">{owner}</span>
                        {index === 0 && <Badge className="bg-blue-100 text-blue-800 text-xs">创建者</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>交易记录</CardTitle>
                  <CardDescription>{selectedWallet?.name} - 交易历史</CardDescription>
                </div>
                <Button onClick={() => setIsCreatingTx(true)}>
                  创建交易
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {walletTransactions.map((transaction) => (
                  <div key={transaction.id} className="p-4 bg-white rounded-lg border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getTransactionTypeColor(transaction.type)}>
                            {getTransactionTypeLabel(transaction.type)}
                          </Badge>
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status === 'pending' ? '等待确认' :
                             transaction.status === 'executed' ? '已执行' : '失败'}
                          </Badge>
                        </div>
                        <h5 className="font-medium text-gray-900 mb-1">{transaction.description}</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">接收方:</span>
                            <span className="ml-1 font-medium">{transaction.to}</span>
                          </div>
                          {transaction.amount && (
                            <div>
                              <span className="text-gray-600">金额:</span>
                              <span className="ml-1 font-medium">¥{transaction.amount.toLocaleString()}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-600">创建时间:</span>
                            <span className="ml-1 font-medium">{new Date(transaction.createdAt).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">确认进度:</span>
                            <span className="ml-1 font-medium">
                              {transaction.confirmations.length}/{transaction.requiredConfirmations}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 确认进度 */}
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">签名确认</span>
                        <span className="font-medium">
                          {transaction.confirmations.length} / {transaction.requiredConfirmations}
                        </span>
                      </div>
                      <Progress value={(transaction.confirmations.length / transaction.requiredConfirmations) * 100} className="h-2" />
                      <div className="flex flex-wrap gap-1">
                        {transaction.confirmations.map((confirmer, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {confirmer}
                          </Badge>
                        ))}
                        {Array.from({ length: transaction.requiredConfirmations - transaction.confirmations.length }).map((_, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-gray-100">
                            待签名
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      {transaction.status === 'pending' && (
                        <>
                          {!transaction.confirmations.includes('0x1234...5678') && (
                            <Button
                              size="sm"
                              onClick={() => handleConfirmTransaction(transaction.id)}
                              disabled={transaction.confirmations.length >= transaction.requiredConfirmations}
                            >
                              确认交易
                            </Button>
                          )}
                          {transaction.confirmations.length >= transaction.requiredConfirmations && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleExecuteTransaction(transaction.id)}
                            >
                              执行交易
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 创建交易面板 */}
        <div className="space-y-6">
          {isCreatingTx && selectedWallet && (
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>创建新交易</CardTitle>
                <CardDescription>{selectedWallet.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    交易类型
                  </label>
                  <Select value={newTx.type} onValueChange={(value) => setNewTx(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send">转账</SelectItem>
                      <SelectItem value="contract-call">合约调用</SelectItem>
                      <SelectItem value="owner-change">管理员变更</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    接收地址
                  </label>
                  <Input
                    value={newTx.to}
                    onChange={(e) => setNewTx(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="0x..."
                  />
                </div>

                {newTx.type === 'send' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      金额 (CNY)
                    </label>
                    <Input
                      type="number"
                      value={newTx.amount}
                      onChange={(e) => setNewTx(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="输入金额"
                    />
                    <div className="text-sm text-gray-600 mt-1">
                      可用余额: ¥{selectedWallet.balance.toLocaleString()}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    交易描述
                  </label>
                  <Textarea
                    value={newTx.description}
                    onChange={(e) => setNewTx(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="请描述此交易的目的和用途"
                    rows={3}
                  />
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="text-sm text-yellow-900 font-medium mb-1">安全提醒</div>
                  <div className="text-sm text-yellow-700">
                    此交易需要 {selectedWallet.requiredSignatures} 个管理员确认才能执行。
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateTransaction} className="flex-1">
                    创建交易
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreatingTx(false)}>
                    取消
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>安全设置</CardTitle>
              <CardDescription>多重签名金库的安全配置</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedWallet && (
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-2">当前安全配置</h5>
                    <div className="text-sm text-green-700 space-y-1">
                      <div>• 管理员数量: {selectedWallet.owners.length}</div>
                      <div>• 所需签名数: {selectedWallet.requiredSignatures}</div>
                      <div>• 安全阈值: {((selectedWallet.requiredSignatures / selectedWallet.owners.length) * 100).toFixed(0)}%</div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">安全特性</h5>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div>✅ 多重签名保护</div>
                      <div>✅ 交易审计追踪</div>
                      <div>✅ 时间锁限制</div>
                      <div>✅ 权限分离管理</div>
                    </div>
                  </div>

                  <div className="p-3 bg-orange-50 rounded-lg">
                    <h5 className="font-medium text-orange-900 mb-2">风险提醒</h5>
                    <div className="text-sm text-orange-700">
                      管理员私钥安全至关重要，请确保使用硬件钱包等安全设备存储私钥。
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}