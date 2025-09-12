'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { RWAGovernor_ADDRESS, RWAGovernor_ABI } from '@/lib/wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { formatEther, parseEther } from 'viem'

interface Proposal {
  id: bigint
  proposer: string
  description: string
  voteStart: bigint
  voteEnd: bigint
  executed: boolean
  canceled: boolean
  forVotes: bigint
  againstVotes: bigint
  abstainVotes: bigint
  state: string
}

export function GovernanceManagement({ address }: { address: string }) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [newProposalDescription, setNewProposalDescription] = useState('')
  const [newProposalTarget, setNewProposalTarget] = useState('')
  const [newProposalValue, setNewProposalValue] = useState('')
  const [newProposalCalldata, setNewProposalCalldata] = useState('')
  const [voteReason, setVoteReason] = useState('')

  const { writeContract, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  // 读取提案总数
  const { data: proposalCount } = useReadContract({
    address: RWAGovernor_ADDRESS,
    abi: RWAGovernor_ABI,
    functionName: 'getProposalCount',
  })

  // 读取代币余额（投票权重）
  const { data: tokenBalance } = useReadContract({
    address: process.env.NEXT_PUBLIC_RWA20_ADDRESS as `0x${string}`,
    abi: [
      {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  })

  // 读取法定人数
  const { data: quorumNumerator } = useReadContract({
    address: RWAGovernor_ADDRESS,
    abi: RWAGovernor_ABI,
    functionName: 'quorumNumerator',
  })

  // 获取提案详情
  const getProposalDetails = async (proposalId: bigint) => {
    try {
      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/governance/proposal/${proposalId}`)
      if (!result.ok) return null
      return await result.json()
    } catch (error) {
      console.error('获取提案详情失败:', error)
      return null
    }
  }

  // 刷新提案列表
  const refreshProposals = async () => {
    if (!proposalCount) return
    
    const proposalList: Proposal[] = []
    const count = Number(proposalCount)
    
    for (let i = 1; i <= count && i <= 10; i++) { // 限制最多显示10个提案
      const details = await getProposalDetails(BigInt(i))
      if (details) {
        proposalList.push(details as Proposal)
      }
    }
    
    setProposals(proposalList)
  }

  // 监听提案数量变化
  useEffect(() => {
    refreshProposals()
  }, [proposalCount])

  // 创建提案
  const handleCreateProposal = async () => {
    if (!newProposalDescription || !newProposalTarget) {
      console.warn('创建提案失败: 描述或目标地址为空')
      return
    }

    console.log('开始创建治理提案:')
    console.log('  提案描述:', newProposalDescription)
    console.log('  目标地址:', newProposalTarget)
    console.log('  价值:', newProposalValue || '0', 'ETH')
    console.log('  调用数据:', newProposalCalldata || '0x')
    console.log('  合约地址:', RWAGovernor_ADDRESS)
    console.log('  提案者:', address)

    try {
      const proposalArgs = [
        [newProposalTarget as `0x${string}`],
        [newProposalValue ? parseEther(newProposalValue) : 0n],
        [newProposalCalldata || '0x'],
        newProposalDescription,
      ]
      
      console.log('提案参数:', proposalArgs)
      
      writeContract({
        address: RWAGovernor_ADDRESS,
        abi: RWAGovernor_ABI,
        functionName: 'propose',
        args: proposalArgs,
      })
      
      console.log('提案创建交易已发送到区块链，等待确认...')
      
    } catch (error) {
      console.error('创建提案失败:', error)
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : '无堆栈信息',
        code: (error as any)?.code,
        data: (error as any)?.data
      })
    }
  }

  // 投票
  const handleVote = async (proposalId: bigint, support: number) => {
    console.log('开始为提案投票:')
    console.log('  提案ID:', proposalId.toString())
    console.log('  投票类型:', support === 0 ? '反对' : support === 1 ? '赞成' : support === 2 ? '弃权' : '未知')
    console.log('  投票者:', address)
    console.log('  投票理由:', voteReason || '无')
    console.log('  合约地址:', RWAGovernor_ADDRESS)

    try {
      if (voteReason) {
        // 带理由的投票
        writeContract({
          address: RWAGovernor_ADDRESS,
          abi: RWAGovernor_ABI,
          functionName: 'castVoteWithReason',
          args: [proposalId, support, voteReason],
        })
      } else {
        // 普通投票
        writeContract({
          address: RWAGovernor_ADDRESS,
          abi: RWAGovernor_ABI,
          functionName: 'castVote',
          args: [proposalId, support],
        })
      }
      
      console.log('投票交易已发送到区块链，等待确认...')
      
    } catch (error) {
      console.error('投票失败:', error)
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : '无堆栈信息',
        code: (error as any)?.code,
        data: (error as any)?.data
      })
    }
  }

  // 执行提案
  const handleExecute = async (proposalId: bigint) => {
    console.log('开始执行治理提案:')
    console.log('  提案ID:', proposalId.toString())
    console.log('  执行者:', address)
    console.log('  合约地址:', RWAGovernor_ADDRESS)

    try {
      // 获取提案详情来执行
      const proposal = proposals.find(p => p.id === proposalId)
      if (!proposal) {
        console.error('找不到提案详情')
        return
      }

      const descriptionHash = await useReadContract({
        address: RWAGovernor_ADDRESS,
        abi: RWAGovernor_ABI,
        functionName: 'hashProposal',
        args: [
          [newProposalTarget as `0x${string}`],
          [newProposalValue ? parseEther(newProposalValue) : 0n],
          [newProposalCalldata || '0x'],
          proposal.description
        ],
      })

      writeContract({
        address: RWAGovernor_ADDRESS,
        abi: RWAGovernor_ABI,
        functionName: 'execute',
        args: [
          [newProposalTarget as `0x${string}`],
          [newProposalValue ? parseEther(newProposalValue) : 0n],
          [newProposalCalldata || '0x'],
          descriptionHash as bytes32
        ],
      })
      
      console.log('提案执行交易已发送到区块链，等待确认...')
      
    } catch (error) {
      console.error('执行提案失败:', error)
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : '无堆栈信息',
        code: (error as any)?.code,
        data: (error as any)?.data
      })
    }
  }

  // 取消提案
  const handleCancel = async (proposalId: bigint) => {
    console.log('开始取消提案:')
    console.log('  提案ID:', proposalId.toString())
    console.log('  操作者:', address)

    try {
      const proposal = proposals.find(p => p.id === proposalId)
      if (!proposal) {
        console.error('找不到提案详情')
        return
      }

      const descriptionHash = await useReadContract({
        address: RWAGovernor_ADDRESS,
        abi: RWAGovernor_ABI,
        functionName: 'hashProposal',
        args: [
          [newProposalTarget as `0x${string}`],
          [newProposalValue ? parseEther(newProposalValue) : 0n],
          [newProposalCalldata || '0x'],
          proposal.description
        ],
      })

      writeContract({
        address: RWAGovernor_ADDRESS,
        abi: RWAGovernor_ABI,
        functionName: 'cancel',
        args: [
          [newProposalTarget as `0x${string}`],
          [newProposalValue ? parseEther(newProposalValue) : 0n],
          [newProposalCalldata || '0x'],
          descriptionHash as bytes32
        ],
      })
      
      console.log('提案取消交易已发送到区块链，等待确认...')
      
    } catch (error) {
      console.error('取消提案失败:', error)
    }
  }

  // 获取状态徽章颜色
  const getStateBadgeColor = (state: string) => {
    switch (state) {
      case 'Pending': return 'bg-yellow-500'
      case 'Active': return 'bg-blue-500'
      case 'Succeeded': return 'bg-green-500'
      case 'Executed': return 'bg-purple-500'
      case 'Defeated': return 'bg-red-500'
      case 'Canceled': return 'bg-gray-500'
      case 'Expired': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  // 添加治理状态监听日志
  useEffect(() => {
    console.log('治理合约状态更新:')
    console.log('  提案数量:', proposalCount?.toString())
    console.log('  当前用户地址:', address)
    console.log('  投票权重:', tokenBalance?.toString())
    console.log('  合约地址:', RWAGovernor_ADDRESS)
  }, [proposalCount, address, tokenBalance])

  // 添加交易状态日志
  useEffect(() => {
    if (isConfirmed) {
      console.log('治理交易已确认，交易哈希:', hash)
      console.log('清空表单数据')
      setNewProposalDescription('')
      setNewProposalTarget('')
      setNewProposalValue('')
      setNewProposalCalldata('')
      setVoteReason('')
      refreshProposals()
    }
  }, [isConfirmed, hash])

  // 添加加载状态日志
  useEffect(() => {
    console.log('治理合约操作状态:')
    console.log('  提案提交中:', isPending)
    console.log('  提案确认中:', isConfirming)
    console.log('  提案已确认:', isConfirmed)
  }, [isPending, isConfirming, isConfirmed])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">投票权重</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {tokenBalance ? formatEther(tokenBalance).toFixed(2) : '0'}
            </div>
            <p className="text-sm text-gray-600">RWA20代币数量</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">提案总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {proposalCount ? proposalCount.toString() : '0'}
            </div>
            <p className="text-sm text-gray-600">已创建提案</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">法定人数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {quorumNumerator ? quorumNumerator.toString() : '0'}%
            </div>
            <p className="text-sm text-gray-600">最低参与率</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">投票状态</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-green-500">活跃</Badge>
            <p className="text-sm text-gray-600 mt-1">可以参与投票</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>创建新提案</CardTitle>
          <CardDescription>发起DAO治理提案</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="description">提案描述</Label>
            <Textarea
              id="description"
              placeholder="详细描述提案内容和目标..."
              value={newProposalDescription}
              onChange={(e) => setNewProposalDescription(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="target">目标合约地址</Label>
              <Input
                id="target"
                placeholder="0x..."
                value={newProposalTarget}
                onChange={(e) => setNewProposalTarget(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="value">发送ETH数量</Label>
              <Input
                id="value"
                type="number"
                placeholder="0"
                value={newProposalValue}
                onChange={(e) => setNewProposalValue(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="calldata">调用数据</Label>
              <Input
                id="calldata"
                placeholder="0x..."
                value={newProposalCalldata}
                onChange={(e) => setNewProposalCalldata(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleCreateProposal}
            disabled={isPending || isConfirming || !newProposalDescription || !newProposalTarget}
            className="w-full"
          >
            {isPending ? '创建中...' : isConfirming ? '确认中...' : '创建提案'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>提案列表</CardTitle>
          <CardDescription>查看和参与提案投票</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {proposals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无提案</p>
            ) : (
              proposals.map((proposal) => (
                <div key={proposal.id.toString()} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">提案 #{proposal.id.toString()}</h4>
                      <p className="text-sm text-gray-600">提议者: {proposal.proposer}</p>
                    </div>
                    <Badge className={getStateBadgeColor(proposal.state)}>
                      {proposal.state}
                    </Badge>
                  </div>
                  
                  <p className="text-sm mb-3">{proposal.description}</p>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-green-600">赞成: {formatEther(proposal.forVotes)}</span>
                    </div>
                    <div>
                      <span className="text-red-600">反对: {formatEther(proposal.againstVotes)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">弃权: {formatEther(proposal.abstainVotes)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-3 text-gray-500">
                    <div>
                      开始时间: {new Date(Number(proposal.voteStart) * 1000).toLocaleString()}
                    </div>
                    <div>
                      结束时间: {new Date(Number(proposal.voteEnd) * 1000).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVote(proposal.id, 1)} // 赞成
                      disabled={proposal.executed || proposal.canceled || proposal.state !== 'Active'}
                    >
                      赞成
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVote(proposal.id, 0)} // 反对
                      disabled={proposal.executed || proposal.canceled || proposal.state !== 'Active'}
                    >
                      反对
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVote(proposal.id, 2)} // 弃权
                      disabled={proposal.executed || proposal.canceled || proposal.state !== 'Active'}
                    >
                      弃权
                    </Button>
                    
                    {proposal.state === 'Succeeded' && !proposal.executed && (
                      <Button
                        size="sm"
                        onClick={() => handleExecute(proposal.id)}
                      >
                        执行
                      </Button>
                    )}
                    
                    {(proposal.state === 'Pending' || proposal.state === 'Active') && 
                     proposal.proposer.toLowerCase() === address.toLowerCase() && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancel(proposal.id)}
                      >
                        取消
                      </Button>
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