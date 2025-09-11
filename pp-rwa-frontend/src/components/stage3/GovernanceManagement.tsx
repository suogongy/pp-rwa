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

interface Proposal {
  id: bigint
  proposer: string
  description: string
  voteStart: bigint
  voteEnd: bigint
  executed: boolean
  forVotes: bigint
  againstVotes: bigint
  abstainVotes: bigint
}

export function GovernanceManagement({ address }: { address: string }) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [newProposalDescription, setNewProposalDescription] = useState('')
  const [newProposalTarget, setNewProposalTarget] = useState('')
  const [newProposalValue, setNewProposalValue] = useState('')
  const [newProposalCalldata, setNewProposalCalldata] = useState('')

  const { writeContract, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  // 读取提案列表
  const { data: proposalCount } = useReadContract({
    address: RWAGovernor_ADDRESS,
    abi: RWAGovernor_ABI,
    functionName: 'proposalCount',
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

  // 创建提案
  const handleCreateProposal = async () => {
    if (!newProposalDescription || !newProposalTarget) return

    try {
      writeContract({
        address: RWAGovernor_ADDRESS,
        abi: RWAGovernor_ABI,
        functionName: 'propose',
        args: [
          [newProposalTarget as `0x${string}`],
          [newProposalValue ? BigInt(newProposalValue) : 0n],
          [newProposalCalldata || '0x'],
          newProposalDescription,
        ],
      })
    } catch (error) {
      console.error('创建提案失败:', error)
    }
  }

  // 投票
  const handleVote = async (proposalId: bigint, support: number) => {
    try {
      writeContract({
        address: RWAGovernor_ADDRESS,
        abi: RWAGovernor_ABI,
        functionName: 'castVote',
        args: [proposalId, support],
      })
    } catch (error) {
      console.error('投票失败:', error)
    }
  }

  // 执行提案
  const handleExecute = async (proposalId: bigint) => {
    try {
      writeContract({
        address: RWAGovernor_ADDRESS,
        abi: RWAGovernor_ABI,
        functionName: 'execute',
        args: [
          [newProposalTarget as `0x${string}`],
          [newProposalValue ? BigInt(newProposalValue) : 0n],
          [newProposalCalldata || '0x'],
          newProposalDescription,
          proposalId,
        ],
      })
    } catch (error) {
      console.error('执行提案失败:', error)
    }
  }

  useEffect(() => {
    if (isConfirmed) {
      setNewProposalDescription('')
      setNewProposalTarget('')
      setNewProposalValue('')
      setNewProposalCalldata('')
    }
  }, [isConfirmed])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">投票权重</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {tokenBalance ? (Number(tokenBalance) / 1e18).toFixed(2) : '0'}
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
                    <Badge variant={proposal.executed ? 'default' : 'secondary'}>
                      {proposal.executed ? '已执行' : '投票中'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm mb-3">{proposal.description}</p>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-green-600">赞成: {proposal.forVotes.toString()}</span>
                    </div>
                    <div>
                      <span className="text-red-600">反对: {proposal.againstVotes.toString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">弃权: {proposal.abstainVotes.toString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVote(proposal.id, 1)} // 赞成
                      disabled={proposal.executed}
                    >
                      赞成
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVote(proposal.id, 0)} // 反对
                      disabled={proposal.executed}
                    >
                      反对
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVote(proposal.id, 2)} // 弃权
                      disabled={proposal.executed}
                    >
                      弃权
                    </Button>
                    {!proposal.executed && (
                      <Button
                        size="sm"
                        onClick={() => handleExecute(proposal.id)}
                      >
                        执行
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