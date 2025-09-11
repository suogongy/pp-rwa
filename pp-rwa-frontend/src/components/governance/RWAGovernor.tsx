"use client";

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Users, Vote, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Proposal {
  id: number;
  title: string;
  description: string;
  type: 'GENERAL' | 'PARAMETER_CHANGE' | 'EMERGENCY' | 'UPGRADE';
  status: 'PENDING' | 'ACTIVE' | 'SUCCEEDED' | 'DEFEATED' | 'QUEUED' | 'EXECUTED' | 'EXPIRED';
  proposer: string;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  startBlock: number;
  endBlock: number;
  timestamp: number;
  executed: boolean;
}

const RWAGovernor = () => {
  const { address, isConnected } = useAccount();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  const [votingPower, setVotingPower] = useState<bigint>(BigInt(0));
  const [totalSupply, setTotalSupply] = useState<bigint>(BigInt(0));
  const [quorum, setQuorum] = useState<bigint>(BigInt(0));
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    type: 'GENERAL',
    targets: [] as string[],
    values: [] as string[],
    calldatas: [] as string[],
  });

  // 合约配置
  const governorAddress = '0x1234567890123456789012345678901234567890';
  const tokenAddress = '0x0987654321098765432109876543210987654321';

  // 读取治理参数
  const { data: quorumData } = useReadContract({
    address: governorAddress as `0x${string}`,
    abi: [
      {
        "inputs": [{"internalType": "uint256", "name": "blockNumber", "type": "uint256"}],
        "name": "quorum",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'quorum',
    args: [BigInt(1)], // 当前区块号
  });

  const { data: votingPowerData } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: [
      {
        "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
        "name": "getVotes",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'getVotes',
    args: [address as `0x${string}`],
  });

  const { writeContract } = useWriteContract();

  // 模拟提案数据
  useEffect(() => {
    const mockProposals: Proposal[] = [
      {
        id: 1,
        title: '增加质押奖励比例',
        description: '建议将质押奖励比例从5%提高到7%，以激励更多用户参与质押。',
        type: 'PARAMETER_CHANGE',
        status: 'ACTIVE',
        proposer: '0x1234...5678',
        forVotes: parseEther('75000'),
        againstVotes: parseEther('25000'),
        abstainVotes: parseEther('10000'),
        startBlock: 12345678,
        endBlock: 12346678,
        timestamp: Date.now() - 86400000,
        executed: false,
      },
      {
        id: 2,
        title: '添加新的资产类型',
        description: '提议增加债券类资产类型，扩大平台的资产范围。',
        type: 'GENERAL',
        status: 'SUCCEEDED',
        proposer: '0x8765...4321',
        forVotes: parseEther('120000'),
        againstVotes: parseEther('30000'),
        abstainVotes: parseEther('15000'),
        startBlock: 12343678,
        endBlock: 12344678,
        timestamp: Date.now() - 172800000,
        executed: true,
      },
      {
        id: 3,
        title: '紧急安全升级',
        description: '发现潜在安全漏洞，需要立即升级智能合约。',
        type: 'EMERGENCY',
        status: 'EXECUTED',
        proposer: '0x1111...2222',
        forVotes: parseEther('95000'),
        againstVotes: parseEther('5000'),
        abstainVotes: parseEther('2000'),
        startBlock: 12341678,
        endBlock: 12342678,
        timestamp: Date.now() - 259200000,
        executed: true,
      },
    ];
    setProposals(mockProposals);
    
    if (quorumData) setQuorum(quorumData as bigint);
    if (votingPowerData) setVotingPower(votingPowerData as bigint);
    setTotalSupply(parseEther('1000000')); // 模拟总供应量
  }, [quorumData, votingPowerData]);

  const handleVote = (proposalId: number, support: boolean) => {
    if (!isConnected) {
      alert('请先连接钱包');
      return;
    }

    writeContract({
      address: governorAddress as `0x${string}`,
      abi: [
        {
          "inputs": [
            {"internalType": "uint256", "name": "proposalId", "type": "uint256"},
            {"internalType": "uint8", "name": "support", "type": "uint8"}
          ],
          "name": "castVote",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
      functionName: 'castVote',
      args: [BigInt(proposalId), support ? 1 : 0],
    });
  };

  const handleCreateProposal = () => {
    if (!isConnected || !newProposal.title || !newProposal.description) {
      alert('请填写完整的提案信息');
      return;
    }

    writeContract({
      address: governorAddress as `0x${string}`,
      abi: [
        {
          "inputs": [
            {"internalType": "address[]", "name": "targets", "type": "address[]"},
            {"internalType": "uint256[]", "name": "values", "type": "uint256[]"},
            {"internalType": "bytes[]", "name": "calldatas", "type": "bytes[]"},
            {"internalType": "string", "name": "description", "type": "string"},
            {"internalType": "bytes32", "name": "descriptionHash", "type": "bytes32"}
          ],
          "name": "propose",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
      functionName: 'propose',
      args: [
        newProposal.targets,
        newProposal.values.map(v => parseEther(v)),
        newProposal.calldatas.map(c => c as `0x${string}`),
        newProposal.description,
        '0x0000000000000000000000000000000000000000000000000000000000000000' // description hash
      ],
    });

    setIsCreatingProposal(false);
    setNewProposal({
      title: '',
      description: '',
      type: 'GENERAL',
      targets: [],
      values: [],
      calldatas: [],
    });
  };

  const getStatusColor = (status: Proposal['status']) => {
    switch (status) {
      case 'ACTIVE': return 'bg-blue-100 text-blue-800';
      case 'SUCCEEDED': return 'bg-green-100 text-green-800';
      case 'DEFEATED': return 'bg-red-100 text-red-800';
      case 'QUEUED': return 'bg-yellow-100 text-yellow-800';
      case 'EXECUTED': return 'bg-purple-100 text-purple-800';
      case 'EXPIRED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: Proposal['type']) => {
    switch (type) {
      case 'EMERGENCY': return 'bg-red-100 text-red-800';
      case 'PARAMETER_CHANGE': return 'bg-orange-100 text-orange-800';
      case 'UPGRADE': return 'bg-purple-100 text-purple-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const totalVotes = (proposal: Proposal) => proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
  const forPercentage = (proposal: Proposal) => (Number(proposal.forVotes) / Number(totalVotes(proposal))) * 100;
  const againstPercentage = (proposal: Proposal) => (Number(proposal.againstVotes) / Number(totalVotes(proposal))) * 100;
  const abstainPercentage = (proposal: Proposal) => (Number(proposal.abstainVotes) / Number(totalVotes(proposal))) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">RWA 治理中心</h1>
          <p className="text-xl text-gray-600">参与平台治理，共同决定未来发展</p>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总供应量</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatEther(totalSupply)}</div>
              <p className="text-xs text-muted-foreground">RWA 代币</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">我的投票权</CardTitle>
              <Vote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatEther(votingPower)}</div>
              <p className="text-xs text-muted-foreground">
                {votingPower > 0 ? `${((Number(votingPower) / Number(totalSupply)) * 100).toFixed(2)}%` : '0%'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">法定人数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatEther(quorum)}</div>
              <p className="text-xs text-muted-foreground">
                {quorum > 0 ? `${((Number(quorum) / Number(totalSupply)) * 100).toFixed(2)}%` : '0%'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">活跃提案</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {proposals.filter(p => p.status === 'ACTIVE').length}
              </div>
              <p className="text-xs text-muted-foreground">需要投票</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="proposals" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="proposals">提案列表</TabsTrigger>
            <TabsTrigger value="create">创建提案</TabsTrigger>
          </TabsList>

          <TabsContent value="proposals" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">治理提案</h2>
              <Button onClick={() => setIsCreatingProposal(true)}>
                创建新提案
              </Button>
            </div>

            <div className="grid gap-6">
              {proposals.map((proposal) => (
                <Card key={proposal.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{proposal.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {proposal.description}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getTypeColor(proposal.type)}>
                          {proposal.type}
                        </Badge>
                        <Badge className={getStatusColor(proposal.status)}>
                          {proposal.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          创建于 {formatDistanceToNow(new Date(proposal.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">
                          提案者: {proposal.proposer}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">
                          总投票: {formatEther(totalVotes(proposal))}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>赞成 ({forPercentage(proposal).toFixed(1)}%)</span>
                          <span>{formatEther(proposal.forVotes)}</span>
                        </div>
                        <Progress value={forPercentage(proposal)} className="h-2 bg-green-200" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>反对 ({againstPercentage(proposal).toFixed(1)}%)</span>
                          <span>{formatEther(proposal.againstVotes)}</span>
                        </div>
                        <Progress value={againstPercentage(proposal)} className="h-2 bg-red-200" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>弃权 ({abstainPercentage(proposal).toFixed(1)}%)</span>
                          <span>{formatEther(proposal.abstainVotes)}</span>
                        </div>
                        <Progress value={abstainPercentage(proposal)} className="h-2 bg-gray-200" />
                      </div>
                    </div>

                    {proposal.status === 'ACTIVE' && isConnected && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => handleVote(proposal.id, true)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          投赞成票
                        </Button>
                        <Button
                          onClick={() => handleVote(proposal.id, false)}
                          variant="destructive"
                        >
                          投反对票
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>创建新提案</CardTitle>
                  <CardDescription>
                    创建一个新的治理提案，让社区投票决定。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">提案标题</label>
                    <Input
                      value={newProposal.title}
                      onChange={(e) => setNewProposal({...newProposal, title: e.target.value})}
                      placeholder="输入提案标题"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">提案类型</label>
                    <Select value={newProposal.type} onValueChange={(value) => setNewProposal({...newProposal, type: value as any})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENERAL">一般提案</SelectItem>
                        <SelectItem value="PARAMETER_CHANGE">参数变更</SelectItem>
                        <SelectItem value="EMERGENCY">紧急提案</SelectItem>
                        <SelectItem value="UPGRADE">升级提案</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">提案描述</label>
                    <Textarea
                      value={newProposal.description}
                      onChange={(e) => setNewProposal({...newProposal, description: e.target.value})}
                      placeholder="详细描述提案内容和理由"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">目标合约地址</label>
                    <Input
                      value={newProposal.targets.join(',')}
                      onChange={(e) => setNewProposal({...newProposal, targets: e.target.value.split(',').map(s => s.trim())})}
                      placeholder="0x1234...5678 (多个地址用逗号分隔)"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">转账金额</label>
                    <Input
                      value={newProposal.values.join(',')}
                      onChange={(e) => setNewProposal({...newProposal, values: e.target.value.split(',').map(s => s.trim())})}
                      placeholder="0.1, 0.2 (多个金额用逗号分隔)"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">调用数据</label>
                    <Textarea
                      value={newProposal.calldatas.join(',')}
                      onChange={(e) => setNewProposal({...newProposal, calldatas: e.target.value.split(',').map(s => s.trim())})}
                      placeholder="0x1234... (多个数据用逗号分隔)"
                      rows={2}
                    />
                  </div>

                  <Button onClick={handleCreateProposal} className="w-full">
                    创建提案
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RWAGovernor;