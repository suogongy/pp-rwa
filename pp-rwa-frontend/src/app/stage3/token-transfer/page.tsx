'use client'

import { useState, useEffect, useCallback } from 'react'
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
  
  // 获取代币总供应量
  const { data: totalSupply } = useReadContract({
    address: RWA20_ADDRESS as `0x${string}`,
    abi: RWA20_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!RWA20_ADDRESS
    }
  })
  
  // 治理相关状态
  const [governanceAccounts, setGovernanceAccounts] = useState<string[]>([])
  const [isDiscoveringAccounts, setIsDiscoveringAccounts] = useState(false)
  const [discoveryStatus, setDiscoveryStatus] = useState<string>('')
  const [newAccount, setNewAccount] = useState('')
  const [accountBalances, setAccountBalances] = useState<{address: string, balance: bigint}[]>([])
  
  // 动态发现治理账户
  const discoverGovernanceAccounts = useCallback(async () => {
    if (!RWA20_ADDRESS) return
    
    setIsDiscoveringAccounts(true)
    setDiscoveryStatus('正在发现治理账户...')
    
    try {
      const RPC_URL = 'http://127.0.0.1:8545'
      
      // 1. 获取合约所有者
      setDiscoveryStatus('获取合约所有者...')
      const ownerResponse = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{
            to: RWA20_ADDRESS,
            data: '0x8da5cb5b' // owner() function signature
          }, 'latest']
        })
      })
      
      const ownerData = await ownerResponse.json()
      const owner = ownerData.result ? '0x' + ownerData.result.slice(26) : null
      
      if (!owner) {
        throw new Error('无法获取合约所有者')
      }
      
      console.log('Contract owner:', owner)
      
      // 2. 获取最新的Transfer事件来发现相关地址
      setDiscoveryStatus('分析转账事件...')
      const eventsResponse = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'eth_getLogs',
          params: [{
            address: RWA20_ADDRESS,
            topics: [
              '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' // Transfer event signature
            ],
            fromBlock: '0x0',
            toBlock: 'latest'
          }]
        })
      })
      
      const eventsData = await eventsResponse.json()
      const transferEvents = eventsData.result || []
      
      console.log('Found transfer events:', transferEvents.length)
      
      // 3. 从事件中提取所有唯一地址
      const addressSet = new Set<string>()
      addressSet.add(owner.toLowerCase()) // 添加所有者
      
      transferEvents.forEach((event: any) => {
        const topics = event.topics
        if (topics.length >= 3) {
          const from = '0x' + topics[1].slice(26)
          const to = '0x' + topics[2].slice(26)
          
          // 只添加非零地址
          if (from !== '0x0000000000000000000000000000000000000000') {
            addressSet.add(from.toLowerCase())
          }
          if (to !== '0x0000000000000000000000000000000000000000') {
            addressSet.add(to.toLowerCase())
          }
        }
      })
      
      const allAddresses = Array.from(addressSet)
      console.log('Discovered addresses:', allAddresses)
      
      // 4. 检查每个地址的余额，过滤出有代币的地址
      setDiscoveryStatus('检查账户余额...')
      const accountsWithBalance: string[] = []
      
      for (const address of allAddresses) {
        try {
          const balanceResponse = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 3,
              method: 'eth_call',
              params: [{
                to: RWA20_ADDRESS,
                data: '0x70a08231' + address.slice(2).padStart(64, '0')
              }, 'latest']
            })
          })
          
          const balanceData = await balanceResponse.json()
          const balance = balanceData.result ? BigInt(balanceData.result) : 0n
          
          if (balance > 0n) {
            accountsWithBalance.push(address)
            console.log(`Account ${address} has balance: ${balance.toString()}`)
          }
        } catch (error) {
          console.error('Error checking balance for', address, error)
        }
      }
      
      // 5. 按余额排序，取前10个作为治理账户
      setDiscoveryStatus('排序账户...')
      const accountsWithBalances = await Promise.all(
        accountsWithBalance.map(async (address) => {
          try {
            const balanceResponse = await fetch(RPC_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 4,
                method: 'eth_call',
                params: [{
                  to: RWA20_ADDRESS,
                  data: '0x70a08231' + address.slice(2).padStart(64, '0')
                }, 'latest']
              })
            })
            
            const balanceData = await balanceResponse.json()
            const balance = balanceData.result ? BigInt(balanceData.result) : 0n
            
            return { address, balance }
          } catch (error) {
            return { address, balance: 0n }
          }
        })
      )
      
      // 按余额降序排序
      accountsWithBalances.sort((a, b) => 
        b.balance > a.balance ? 1 : b.balance < a.balance ? -1 : 0
      )
      
      const topAccounts = accountsWithBalances.slice(0, 10).map(item => item.address)
      
      setGovernanceAccounts(topAccounts)
      setDiscoveryStatus(`发现 ${topAccounts.length} 个治理账户`)
      console.log('Top governance accounts:', topAccounts)
      
      // 6. 获取这些账户的余额
      await getGovernanceBalancesForAccounts(topAccounts)
      
    } catch (error) {
      console.error('Error discovering governance accounts:', error)
      setDiscoveryStatus('发现失败，使用默认账户')
      
      // 如果发现失败，使用一些默认的已知地址
      const fallbackAccounts = [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      ]
      setGovernanceAccounts(fallbackAccounts)
      await getGovernanceBalancesForAccounts(fallbackAccounts)
    } finally {
      setIsDiscoveringAccounts(false)
    }
  }, [RWA20_ADDRESS])
  
  // 获取指定账户列表的余额
  const getGovernanceBalancesForAccounts = useCallback(async (accounts: string[]) => {
    if (!RWA20_ADDRESS || accounts.length === 0) return
    
    try {
      const RPC_URL = 'http://127.0.0.1:8545'
      
      const balances = await Promise.all(
        accounts.map(async (account) => {
          try {
            const response = await fetch(RPC_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_call',
                params: [{
                  to: RWA20_ADDRESS,
                  data: '0x70a08231' + account.slice(2).padStart(64, '0') // balanceOf function signature + address
                }, 'latest']
              })
            })
            
            const data = await response.json()
            if (data.result) {
              const balance = BigInt(data.result)
              console.log(`Balance for ${account}: ${balance.toString()}`)
              return {
                address: account,
                balance: balance
              }
            }
          } catch (error) {
            console.error('Error fetching balance for', account, error)
          }
          
          return {
            address: account,
            balance: 0n
          }
        })
      )
      
      console.log('Final balances:', balances)
      setAccountBalances(balances)
    } catch (error) {
      console.error('Error fetching governance balances:', error)
      const defaultBalances = accounts.map(account => ({
        address: account,
        balance: 0n
      }))
      setAccountBalances(defaultBalances)
    }
  }, [RWA20_ADDRESS])
  
  // 获取所有治理账户的余额 - 使用新的函数
  const getGovernanceBalances = useCallback(async () => {
    await getGovernanceBalancesForAccounts(governanceAccounts)
  }, [governanceAccounts, getGovernanceBalancesForAccounts])
  
  useEffect(() => {
    getGovernanceBalances()
  }, [governanceAccounts, totalSupply, getGovernanceBalances])
  
  // 组件加载时自动发现治理账户
  useEffect(() => {
    if (RWA20_ADDRESS && governanceAccounts.length === 0) {
      discoverGovernanceAccounts()
    }
  }, [RWA20_ADDRESS, discoverGovernanceAccounts])
  
  // 添加新账户
  const addAccount = () => {
    if (newAccount && /^0x[a-fA-F0-9]{40}$/.test(newAccount)) {
      setGovernanceAccounts([...governanceAccounts, newAccount])
      setNewAccount('')
    } else {
      alert('请输入有效的以太坊地址')
    }
  }
  
  // 计算治理权益占比
  const calculateGovernanceShare = (balance: bigint) => {
    if (!totalSupply || totalSupply === 0n) return 0
    return Number((balance * 10000n) / totalSupply) / 100
  }
  
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
                        {RWA20_ADDRESS && (
                          <p className="text-xs text-blue-600 mt-1">
                            已配置RWA20合约
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>代币总供应量</CardTitle>
                      <CardDescription>RWA20代币总供应量</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600">
                          {totalSupply ? formatEther(totalSupply) : '0'}
                        </p>
                        <p className="text-sm text-gray-600">{tokenSymbol || 'RWA'}</p>
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
                        {totalSupply && userBalance && (
                          <p className="text-xs text-gray-500 mt-1">
                            占比: {calculateGovernanceShare(userBalance).toFixed(2)}%
                          </p>
                        )}
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
                      <CardTitle>治理权益分布</CardTitle>
                      <CardDescription>各账户代币持有量及治理权益占比</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm font-medium">治理账户</Label>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={getGovernanceBalances}
                              disabled={isDiscoveringAccounts}
                            >
                              刷新余额
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={discoverGovernanceAccounts}
                              disabled={isDiscoveringAccounts}
                            >
                              重新发现
                            </Button>
                          </div>
                        </div>
                        
                        {discoveryStatus && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <span className="flex items-center">
                              {isDiscoveringAccounts && (
                                <span className="animate-spin mr-2">⏳</span>
                              )}
                              {discoveryStatus}
                            </span>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          {accountBalances.map((account, index) => (
                            <div key={account.address} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {index + 1}
                                  </Badge>
                                  <span className="text-xs font-mono text-gray-600">
                                    {account.address.slice(0, 6)}...{account.address.slice(-4)}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-4 mt-1">
                                  <span className="text-sm font-medium text-blue-600">
                                    {formatEther(account.balance)} {tokenSymbol || 'RWA'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    权益: {calculateGovernanceShare(account.balance).toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                              
                              {/* 权益占比进度条 */}
                              <div className="w-24">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(calculateGovernanceShare(account.balance), 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="pt-4 border-t">
                          <Label htmlFor="newAccount" className="text-sm font-medium">
                            添加治理账户
                          </Label>
                          <div className="flex space-x-2 mt-2">
                            <Input
                              id="newAccount"
                              placeholder="0x..."
                              value={newAccount}
                              onChange={(e) => setNewAccount(e.target.value)}
                              className="flex-1"
                            />
                            <Button 
                              size="sm"
                              onClick={addAccount}
                              disabled={!newAccount}
                            >
                              添加
                            </Button>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t">
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="text-xs text-blue-800">
                              <strong>智能发现:</strong> 系统自动从区块链中分析转账事件，
                              发现持有代币的真实账户。点击"重新发现"可更新最新数据。
                            </p>
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>总持有量:</span>
                            <span>
                              {formatEther(accountBalances.reduce((sum, account) => sum + account.balance, 0n))} {tokenSymbol || 'RWA'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>总占比:</span>
                            <span>
                              {calculateGovernanceShare(accountBalances.reduce((sum, account) => sum + account.balance, 0n)).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
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
                      <div className="flex items-start space-x-2">
                        <Badge variant="outline" className="mt-1">4</Badge>
                        <div>
                          <p className="font-medium">权益分布</p>
                          <p className="text-sm text-gray-600">查看各账户代币持有量和治理权益占比</p>
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