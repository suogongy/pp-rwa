'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Proposal {
  id: string
  title: string
  description: string
  type: 'parameter' | 'financial' | 'technical' | 'community'
  status: 'active' | 'pending' | 'executed' | 'rejected'
  votesFor: number
  votesAgainst: number
  totalVotes: number
  quorum: number
  endTime: number
  createdBy: string
  createdAt: number
  userVoted?: boolean
  userVote?: 'for' | 'against'
}

interface VotePower {
  delegated: number
  direct: number
  total: number
}

export function GovernancePortal({ isConnected }: { isConnected: boolean }) {
  const [proposals, setProposals] = useState<Proposal[]>([
    {
      id: '1',
      title: '降低平台交易手续费从0.3%至0.2%',
      description: '为提高市场竞争力和用户活跃度，提议将平台交易手续费从0.3%降低至0.2%。这将吸引更多用户使用平台，增加整体交易量。',
      type: 'parameter',
      status: 'active',
      votesFor: 1250000,
      votesAgainst: 340000,
      totalVotes: 1590000,
      quorum: 2000000,
      endTime: Date.now() + 3 * 24 * 60 * 60 * 1000,
      createdBy: '0x1234...5678',
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      userVoted: true,
      userVote: 'for'
    },
    {
      id: '2',
      title: '增加RWA721艺术品质押池APY至15%',
      description: '为促进NFT市场发展，提议将RWA721艺术品质押池的APY从12%提升至15%，为期3个月。',
      type: 'financial',
      status: 'active',
      votesFor: 890000,
      votesAgainst: 210000,
      totalVotes: 1100000,
      quorum: 1500000,
      endTime: Date.now() + 5 * 24 * 60 * 60 * 1000,
      createdBy: '0x8765...4321',
      createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000
    },
    {
      id: '3',
      title: '集成Polygon网络降低Gas费用',
      description: '提议集成Polygon网络，为用户提供更低Gas费用的交易选项，提高用户体验。',
      type: 'technical',
      status: 'executed',
      votesFor: 2100000,
      votesAgainst: 180000,
      totalVotes: 2280000,
      quorum: 2000000,
      endTime: Date.now() - 2 * 24 * 60 * 60 * 1000,
      createdBy: '0x9876...1234',
      createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000
    },
    {
      id: '4',
      title: '建立社区开发者激励基金',
      description: '提议建立500万RWA20代币的社区开发者激励基金，鼓励社区贡献生态建设。',
      type: 'community',
      status: 'pending',
      votesFor: 0,
      votesAgainst: 0,
      totalVotes: 0,
      quorum: 1500000,
      endTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
      createdBy: '0x5432...8765',
      createdAt: Date.now()
    }
  ])

  const [votePower, setVotePower] = useState<VotePower>({
    delegated: 15000,
    direct: 85000,
    total: 100000
  })

  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const getProposalTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'parameter': '参数调整',
      'financial': '财务决策',
      'technical': '技术升级',
      'community': '社区治理'
    }
    return labels[type] || type
  }

  const getProposalTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'parameter': 'bg-blue-100 text-blue-800',
      'financial': 'bg-green-100 text-green-800',
      'technical': 'bg-purple-100 text-purple-800',
      'community': 'bg-orange-100 text-orange-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'executed': 'bg-blue-100 text-blue-800',
      'rejected': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'active': '投票中',
      'pending': '等待开始',
      'executed': '已执行',
      'rejected': '已拒绝'
    }
    return labels[status] || status
  }

  const handleVote = (proposalId: string, voteType: 'for' | 'against') => {
    // 这里应该调用智能合约进行投票
    setProposals(prev => prev.map(proposal =>
      proposal.id === proposalId
        ? {
            ...proposal,
            userVoted: true,
            userVote: voteType,
            votesFor: voteType === 'for' ? proposal.votesFor + votePower.total : proposal.votesFor,
            votesAgainst: voteType === 'against' ? proposal.votesAgainst + votePower.total : proposal.votesAgainst,
            totalVotes: proposal.totalVotes + votePower.total
          }
        : proposal
    ))
    alert(`成功投票 ${voteType === 'for' ? '赞成' : '反对'} 提案 ${proposalId}`)
  }

  const handleCreateProposal = () => {
    // 这里应该跳转到创建提案页面或打开模态框
    alert('创建提案功能开发中...')
  }

  const handleDelegate = () => {
    // 这里应该调用智能合约进行投票权委托
    alert('投票权委托功能开发中...')
  }

  const getTimeRemaining = (endTime: number) => {
    const remaining = Math.max(0, endTime - Date.now())
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000))
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    return `${days}天 ${hours}小时`
  }

  const filteredProposals = proposals.filter(proposal => {
    const matchesType = filterType === 'all' || proposal.type === filterType
    const matchesStatus = filterStatus === 'all' || proposal.status === filterStatus
    return matchesType && matchesStatus
  })

  if (!isConnected) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">请连接钱包</h3>
          <p className="text-gray-600">连接钱包以参与社区治理</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 治理统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">您的投票权</div>
            <div className="text-2xl font-bold text-gray-900">{votePower.total.toLocaleString()}</div>
            <div className="text-sm text-blue-600 mt-1">直接: {votePower.direct.toLocaleString()} | 委托: {votePower.delegated.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">活跃提案</div>
            <div className="text-2xl font-bold text-green-600">{proposals.filter(p => p.status === 'active').length}</div>
            <div className="text-sm text-gray-500 mt-1">参与投票: {proposals.filter(p => p.userVoted).length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">参与率</div>
            <div className="text-2xl font-bold text-purple-600">68.5%</div>
            <div className="text-sm text-gray-500 mt-1">高于平均水平</div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">治理影响力</div>
            <div className="text-2xl font-bold text-orange-600">TOP 15%</div>
            <div className="text-sm text-gray-500 mt-1">活跃治理参与者</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="proposals" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="proposals">治理提案</TabsTrigger>
          <TabsTrigger value="voting">投票中心</TabsTrigger>
          <TabsTrigger value="power">投票权管理</TabsTrigger>
        </TabsList>

        <TabsContent value="proposals" className="space-y-6">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>治理提案</CardTitle>
                  <CardDescription>参与社区决策，共同塑造平台未来</CardDescription>
                </div>
                <Button onClick={handleCreateProposal}>
                  创建提案
                </Button>
              </div>

              {/* 筛选器 */}
              <div className="flex flex-col md:flex-row gap-4 mt-4">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="提案类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="parameter">参数调整</SelectItem>
                    <SelectItem value="financial">财务决策</SelectItem>
                    <SelectItem value="technical">技术升级</SelectItem>
                    <SelectItem value="community">社区治理</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="active">投票中</SelectItem>
                    <SelectItem value="pending">等待开始</SelectItem>
                    <SelectItem value="executed">已执行</SelectItem>
                    <SelectItem value="rejected">已拒绝</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredProposals.map((proposal) => (
                  <div key={proposal.id} className="p-4 bg-white rounded-lg border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{proposal.title}</h4>
                          <Badge className={getProposalTypeColor(proposal.type)}>
                            {getProposalTypeLabel(proposal.type)}
                          </Badge>
                          <Badge className={getStatusColor(proposal.status)}>
                            {getStatusLabel(proposal.status)}
                          </Badge>
                          {proposal.userVoted && (
                            <Badge className="bg-indigo-100 text-indigo-800">
                              已投票
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{proposal.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">创建者:</span>
                            <span className="ml-1 font-medium">{proposal.createdBy}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">法定人数:</span>
                            <span className="ml-1 font-medium">{(proposal.quorum / 1000000).toFixed(1)}M</span>
                          </div>
                          <div>
                            <span className="text-gray-600">参与度:</span>
                            <span className="ml-1 font-medium">{((proposal.totalVotes / proposal.quorum) * 100).toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">剩余时间:</span>
                            <span className="ml-1 font-medium">
                              {proposal.status === 'active' ? getTimeRemaining(proposal.endTime) : '已结束'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 投票进度 */}
                    {proposal.status === 'active' && (
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">赞成: {(proposal.votesFor / proposal.totalVotes * 100).toFixed(1)}%</span>
                          <span className="text-red-600">反对: {(proposal.votesAgainst / proposal.totalVotes * 100).toFixed(1)}%</span>
                          <span className="text-gray-600">总票数: {(proposal.totalVotes / 1000000).toFixed(2)}M</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Progress value={(proposal.votesFor / proposal.totalVotes) * 100} className="h-3 bg-green-100">
                            <div className="h-full bg-green-500 rounded" />
                          </Progress>
                          <Progress value={(proposal.votesAgainst / proposal.totalVotes) * 100} className="h-3 bg-red-100">
                            <div className="h-full bg-red-500 rounded" />
                          </Progress>
                        </div>
                      </div>
                    )}

                    {/* 投票按钮 */}
                    {proposal.status === 'active' && !proposal.userVoted && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleVote(proposal.id, 'for')}
                        >
                          赞成 ({votePower.total} 票)
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleVote(proposal.id, 'against')}
                        >
                          反对 ({votePower.total} 票)
                        </Button>
                      </div>
                    )}

                    {proposal.userVoted && (
                      <div className="text-sm text-gray-600">
                        您投票: <Badge className={proposal.userVote === 'for' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {proposal.userVote === 'for' ? '赞成' : '反对'}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voting" className="space-y-6">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>投票中心</CardTitle>
              <CardDescription>查看您的投票历史和治理参与情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">投票统计</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">总投票次数:</span>
                      <span className="font-medium">23</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">赞成票数:</span>
                      <span className="font-medium">18</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">反对票数:</span>
                      <span className="font-medium">5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">成功率:</span>
                      <span className="font-medium">78.3%</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">治理成就</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-green-700">🏆 活跃治理者</span>
                      <Badge className="bg-green-100 text-green-800">已获得</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-700">🎯 早期支持者</span>
                      <Badge className="bg-green-100 text-green-800">已获得</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-700">💎 社区贡献者</span>
                      <Badge variant="outline">进行中</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-700">🌟 治理大师</span>
                      <Badge variant="outline">待解锁</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">最近投票记录</h4>
                <div className="space-y-2">
                  {proposals.filter(p => p.userVoted).slice(0, 3).map((proposal) => (
                    <div key={proposal.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{proposal.title}</div>
                        <div className="text-sm text-gray-600">
                          投票: {proposal.userVote === 'for' ? '赞成' : '反对'} |
                          时间: {new Date(proposal.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge className={proposal.userVote === 'for' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {proposal.userVote === 'for' ? '赞成' : '反对'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="power" className="space-y-6">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>投票权管理</CardTitle>
              <CardDescription>管理您的投票权和委托关系</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-900 mb-1">{votePower.direct.toLocaleString()}</div>
                    <div className="text-sm text-blue-700">直接投票权</div>
                    <div className="text-xs text-blue-600 mt-1">基于您的RWA20持有量</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-900 mb-1">{votePower.delegated.toLocaleString()}</div>
                    <div className="text-sm text-green-700">委托投票权</div>
                    <div className="text-xs text-green-600 mt-1">来自其他用户的委托</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-900 mb-1">{votePower.total.toLocaleString()}</div>
                    <div className="text-sm text-purple-700">总投票权</div>
                    <div className="text-xs text-purple-600 mt-1">所有投票权之和</div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">投票权委托</h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    您可以将投票权委托给其他信任的用户，让专业的治理代表为您决策。委托后，您仍然可以收回投票权或重新委托。
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDelegate}>
                      委托投票权
                    </Button>
                    <Button variant="outline">
                      查看委托记录
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">投票权计算规则</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 每持有1个RWA20代币获得1个投票权</li>
                    <li>• 质押中的RWA20代币同样享有投票权</li>
                    <li>• 投票权实时计算，动态更新</li>
                    <li>• 委托的投票权可以随时收回</li>
                    <li>• 参与投票可以获得治理奖励</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}