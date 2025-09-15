'use client'

import { useState } from 'react'
import { useReadContract } from 'wagmi'
import { RWAGovernor_ADDRESS, RWAGovernor_ABI } from '@/lib/wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatEther } from 'viem'

export default function ProposalVoteVerifier() {
  const [proposalId, setProposalId] = useState('10388695569530123787768146006268480000635881738976960256112883338575564976875')
  const [voterAddress, setVoterAddress] = useState('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')

  // 获取提案详情 - 使用新的 getProposalFullInfo 函数获取更完整的信息
  const { data: proposalDetails, refetch: refetchProposalDetails } = useReadContract({
    address: RWAGovernor_ADDRESS,
    abi: RWAGovernor_ABI,
    functionName: 'getProposalFullInfo',
    args: [BigInt(proposalId)],
  })

  // 获取提案状态
  const { data: proposalState } = useReadContract({
    address: RWAGovernor_ADDRESS,
    abi: RWAGovernor_ABI,
    functionName: 'getProposalState',
    args: [BigInt(proposalId)],
  })

  // 获取提案投票结果（使用 OpenZeppelin 标准的 proposalVotes 函数）
  const { data: proposalVotes } = useReadContract({
    address: RWAGovernor_ADDRESS,
    abi: [
      {
        inputs: [{ name: 'proposalId', type: 'uint256' }],
        name: 'proposalVotes',
        outputs: [
          { name: 'againstVotes', type: 'uint256' },
          { name: 'forVotes', type: 'uint256' },
          { name: 'abstainVotes', type: 'uint256' }
        ],
        stateMutability: 'view',
        type: 'function'
      }
    ],
    functionName: 'proposalVotes',
    args: [BigInt(proposalId)],
  })

  // 检查特定地址是否已投票
  const { data: hasVoted } = useReadContract({
    address: RWAGovernor_ADDRESS,
    abi: [
      {
        inputs: [{ name: 'proposalId', type: 'uint256' }, { name: 'account', type: 'address' }],
        name: 'hasVoted',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function'
      }
    ],
    functionName: 'hasVoted',
    args: [BigInt(proposalId), voterAddress as `0x${string}`],
  })

  // 获取用户的投票权重
  const { data: userVotes } = useReadContract({
    address: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // RWA20 代币地址
    abi: [
      {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'getVotes',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
      }
    ],
    functionName: 'getVotes',
    args: [voterAddress as `0x${string}`],
  })

  // 获取用户的代币余额
  const { data: tokenBalance } = useReadContract({
    address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    abi: [
      {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
      }
    ],
    functionName: 'balanceOf',
    args: [voterAddress as `0x${string}`],
  })

  // 获取用户的委托信息
  const { data: delegates } = useReadContract({
    address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    abi: [
      {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'delegates',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function'
      }
    ],
    functionName: 'delegates',
    args: [voterAddress as `0x${string}`],
  })

  const handleRefresh = () => {
    refetchProposalDetails()
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>提案投票验证工具</CardTitle>
          <CardDescription>验证指定提案的投票情况和用户状态</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="proposalId">提案ID</Label>
              <Input
                id="proposalId"
                value={proposalId}
                onChange={(e) => setProposalId(e.target.value)}
                placeholder="输入提案ID"
              />
            </div>
            <div>
              <Label htmlFor="voterAddress">投票者地址</Label>
              <Input
                id="voterAddress"
                value={voterAddress}
                onChange={(e) => setVoterAddress(e.target.value)}
                placeholder="输入投票者地址"
              />
            </div>
          </div>
          <Button onClick={handleRefresh}>刷新数据</Button>
        </CardContent>
      </Card>

      {/* 提案基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>提案基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>提案ID:</strong> {proposalId}
            </div>
            <div>
              <strong>提案状态:</strong> {proposalState || '加载中...'}
            </div>
          </div>
          {proposalDetails && (
            <div className="mt-4 space-y-2">
              <div><strong>提案者:</strong> {proposalDetails[0]}</div>
              <div><strong>投票开始区块:</strong> {proposalDetails && proposalDetails[1] > 0 ? proposalDetails[1].toString() : '区块无效'}</div>
              <div><strong>投票结束区块:</strong> {proposalDetails && proposalDetails[2] > 0 ? proposalDetails[2].toString() : '区块无效'}</div>
              <div><strong>已执行:</strong> {proposalDetails[3] ? '是' : '否'}</div>
              <div><strong>已取消:</strong> {proposalDetails[4] ? '是' : '否'}</div>
              <div><strong>赞成票:</strong> {proposalDetails && proposalDetails[5] > 0 ? parseFloat(formatEther(proposalDetails[5])).toFixed(2) : '0'}</div>
              <div><strong>反对票:</strong> {proposalDetails && proposalDetails[6] > 0 ? parseFloat(formatEther(proposalDetails[6])).toFixed(2) : '0'}</div>
              <div><strong>弃权票:</strong> {proposalDetails && proposalDetails[7] > 0 ? parseFloat(formatEther(proposalDetails[7])).toFixed(2) : '0'}</div>
              <div><strong>创建时间:</strong> {proposalDetails && proposalDetails[8] > 0 ? new Date(Number(proposalDetails[8]) * 1000).toLocaleString() : '未知'}</div>
              <div><strong>额外信息:</strong> {proposalDetails[9] || '无'}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 投票结果 */}
      <Card>
        <CardHeader>
          <CardTitle>投票结果</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {proposalVotes ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {parseFloat(formatEther(proposalVotes[1])).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">赞成票</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {parseFloat(formatEther(proposalVotes[0])).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">反对票</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {parseFloat(formatEther(proposalVotes[2])).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">弃权票</div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">无法获取投票结果数据</div>
          )}
        </CardContent>
      </Card>

      {/* 用户状态 */}
      <Card>
        <CardHeader>
          <CardTitle>用户投票状态</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>是否已投票:</strong> {hasVoted !== undefined ? (hasVoted ? '是' : '否') : '加载中...'}
            </div>
            <div>
              <strong>代币余额:</strong> {tokenBalance ? parseFloat(formatEther(tokenBalance)).toFixed(2) : '0'} RWA20
            </div>
            <div>
              <strong>投票权重:</strong> {userVotes ? parseFloat(formatEther(userVotes)).toFixed(2) : '0'} 票
            </div>
            <div>
              <strong>委托给:</strong> {delegates || '未委托'}
            </div>
          </div>
          
          {delegates && delegates !== '0x0000000000000000000000000000000000000000' && (
            <div className="mt-4">
              <Badge variant="secondary">
                已委托投票权给: {delegates}
              </Badge>
            </div>
          )}
          
          {userVotes && userVotes > 0n && !hasVoted && (
            <div className="mt-4">
              <Badge variant="destructive">
                有投票权但尚未投票
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 调试信息 */}
      <Card>
        <CardHeader>
          <CardTitle>调试信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><strong>合约地址:</strong> {RWAGovernor_ADDRESS}</div>
          <div><strong>代币合约:</strong> 0x5FbDB2315678afecb367f032d93F642f64180aa3</div>
          <div><strong>当前时间:</strong> {new Date().toLocaleString()}</div>
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <strong>原始数据:</strong>
            <pre className="text-xs mt-2 overflow-auto">
              {JSON.stringify({
                proposalDetails,
                proposalState,
                proposalVotes,
                hasVoted,
                userVotes,
                tokenBalance,
                delegates
              }, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}