"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Activity, 
  AlertTriangle,
  BarChart3,
  PieChart,
  LineChart,
  Clock,
  Target,
  Zap,
  Shield
} from 'lucide-react';

interface AssetData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  totalSupply: number;
  holders: number;
}

interface TransactionData {
  date: string;
  volume: number;
  count: number;
  avgAmount: number;
}

interface UserActivity {
  date: string;
  activeUsers: number;
  newUsers: number;
  transactions: number;
}

interface GovernanceData {
  proposals: number;
  activeProposals: number;
  votingPower: number;
  participation: number;
}

const RWADataVisualization = () => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [assetData, setAssetData] = useState<AssetData[]>([]);
  const [transactionData, setTransactionData] = useState<TransactionData[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [governanceData, setGovernanceData] = useState<GovernanceData>({
    proposals: 0,
    activeProposals: 0,
    votingPower: 0,
    participation: 0,
  });

  // 模拟数据
  useEffect(() => {
    const mockAssetData: AssetData[] = [
      {
        symbol: 'RWA',
        name: 'Real World Asset',
        price: 2.45,
        change24h: 5.2,
        change7d: 12.8,
        marketCap: 245000000,
        volume24h: 8500000,
        totalSupply: 100000000,
        holders: 15420,
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        price: 3200,
        change24h: -2.1,
        change7d: 8.5,
        marketCap: 384000000000,
        volume24h: 15000000000,
        totalSupply: 120000000,
        holders: 2500000,
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        price: 1.00,
        change24h: 0.01,
        change7d: 0.02,
        marketCap: 25000000000,
        volume24h: 3000000000,
        totalSupply: 25000000000,
        holders: 5000000,
      },
    ];

    const mockTransactionData: TransactionData[] = [
      { date: '2024-01-01', volume: 1250000, count: 450, avgAmount: 2778 },
      { date: '2024-01-02', volume: 1380000, count: 520, avgAmount: 2654 },
      { date: '2024-01-03', volume: 1120000, count: 380, avgAmount: 2947 },
      { date: '2024-01-04', volume: 1450000, count: 580, avgAmount: 2500 },
      { date: '2024-01-05', volume: 1680000, count: 650, avgAmount: 2585 },
      { date: '2024-01-06', volume: 1420000, count: 490, avgAmount: 2898 },
      { date: '2024-01-07', volume: 1750000, count: 720, avgAmount: 2431 },
    ];

    const mockUserActivity: UserActivity[] = [
      { date: '2024-01-01', activeUsers: 1250, newUsers: 45, transactions: 450 },
      { date: '2024-01-02', activeUsers: 1380, newUsers: 52, transactions: 520 },
      { date: '2024-01-03', activeUsers: 1120, newUsers: 38, transactions: 380 },
      { date: '2024-01-04', activeUsers: 1450, newUsers: 58, transactions: 580 },
      { date: '2024-01-05', activeUsers: 1680, newUsers: 65, transactions: 650 },
      { date: '2024-01-06', activeUsers: 1420, newUsers: 49, transactions: 490 },
      { date: '2024-01-07', activeUsers: 1750, newUsers: 72, transactions: 720 },
    ];

    const mockGovernanceData: GovernanceData = {
      proposals: 45,
      activeProposals: 3,
      votingPower: 68.5,
      participation: 42.3,
    };

    setAssetData(mockAssetData);
    setTransactionData(mockTransactionData);
    setUserActivity(mockUserActivity);
    setGovernanceData(mockGovernanceData);
  }, [timeRange]);

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toString();
  };

  const totalVolume = transactionData.reduce((sum, data) => sum + data.volume, 0);
  const avgDailyVolume = totalVolume / transactionData.length;
  const totalTransactions = transactionData.reduce((sum, data) => sum + data.count, 0);
  const peakDay = transactionData.reduce((max, data) => data.volume > max.volume ? data : max, transactionData[0]);

  const totalUsers = userActivity.reduce((sum, data) => sum + data.newUsers, 0);
  const avgDailyUsers = userActivity.reduce((sum, data) => sum + data.activeUsers, 0) / userActivity.length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">RWA 数据分析</h1>
          <p className="text-xl text-gray-600">实时数据洞察与分析</p>
        </div>

        {/* 时间范围选择 */}
        <div className="flex justify-end mb-6">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24小时</SelectItem>
              <SelectItem value="7d">7天</SelectItem>
              <SelectItem value="30d">30天</SelectItem>
              <SelectItem value="90d">90天</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 关键指标 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总交易量</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalVolume)}</div>
              <p className="text-xs text-muted-foreground">
                平均每日 {formatCurrency(avgDailyVolume)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">交易次数</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(totalTransactions)}</div>
              <p className="text-xs text-muted-foreground">
                平均每日 {formatNumber(totalTransactions / transactionData.length)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(avgDailyUsers)}</div>
              <p className="text-xs text-muted-foreground">
                总用户 {formatNumber(totalUsers)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">治理参与度</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{governanceData.participation}%</div>
              <p className="text-xs text-muted-foreground">
                活跃提案 {governanceData.activeProposals}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="assets" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="assets">资产分析</TabsTrigger>
            <TabsTrigger value="transactions">交易分析</TabsTrigger>
            <TabsTrigger value="users">用户分析</TabsTrigger>
            <TabsTrigger value="governance">治理分析</TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="space-y-6">
            <div className="grid gap-6">
              {assetData.map((asset) => (
                <Card key={asset.symbol}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{asset.name}</CardTitle>
                        <CardDescription>{asset.symbol}</CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">${asset.price.toFixed(2)}</div>
                        <div className={`flex items-center gap-1 ${asset.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {asset.change24h >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          <span>{Math.abs(asset.change24h).toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium">市值</Label>
                        <p className="text-lg font-semibold">{formatCurrency(asset.marketCap)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">24h成交量</Label>
                        <p className="text-lg font-semibold">{formatCurrency(asset.volume24h)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">总供应量</Label>
                        <p className="text-lg font-semibold">{formatNumber(asset.totalSupply)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">持有人数</Label>
                        <p className="text-lg font-semibold">{formatNumber(asset.holders)}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label className="text-sm font-medium">7日趋势</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={Math.abs(asset.change7d)} className="flex-1" />
                        <span className={`text-sm ${asset.change7d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {asset.change7d >= 0 ? '+' : ''}{asset.change7d.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">峰值日期</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">{peakDay.date}</div>
                  <p className="text-sm text-muted-foreground">{formatCurrency(peakDay.volume)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">平均交易金额</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">{formatCurrency(avgDailyVolume)}</div>
                  <p className="text-sm text-muted-foreground">每日平均</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">交易效率</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">98.5%</div>
                  <p className="text-sm text-muted-foreground">成功率</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>交易趋势</CardTitle>
                <CardDescription>过去7天的交易量和交易次数</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactionData.map((data) => (
                    <div key={data.date} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{data.date}</span>
                          <span className="text-sm text-muted-foreground">{formatCurrency(data.volume)}</span>
                        </div>
                        <Progress value={(data.volume / peakDay.volume) * 100} className="h-2" />
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-sm font-medium">{data.count} 笔</div>
                        <div className="text-xs text-muted-foreground">平均 {formatCurrency(data.avgAmount)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">新增用户</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">{formatNumber(totalUsers)}</div>
                  <p className="text-sm text-muted-foreground">过去7天</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">平均日活</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">{formatNumber(avgDailyUsers)}</div>
                  <p className="text-sm text-muted-foreground">每日平均</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">用户留存</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">85.2%</div>
                  <p className="text-sm text-muted-foreground">7日留存率</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>用户活跃度</CardTitle>
                <CardDescription>过去7天的用户活跃情况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userActivity.map((data) => (
                    <div key={data.date} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{data.date}</span>
                          <span className="text-sm text-muted-foreground">{formatNumber(data.activeUsers)} 活跃</span>
                        </div>
                        <Progress value={(data.activeUsers / Math.max(...userActivity.map(u => u.activeUsers))) * 100} className="h-2" />
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-sm font-medium">+{data.newUsers}</div>
                        <div className="text-xs text-muted-foreground">{data.transactions} 笔交易</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="governance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">总提案数</CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{governanceData.proposals}</div>
                  <p className="text-xs text-muted-foreground">历史提案</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">活跃提案</CardTitle>
                  <LineChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{governanceData.activeProposals}</div>
                  <p className="text-xs text-muted-foreground">需要投票</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">投票参与度</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{governanceData.participation}%</div>
                  <p className="text-xs text-muted-foreground">参与率</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">投票权分布</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{governanceData.votingPower}%</div>
                  <p className="text-xs text-muted-foreground">去中心化程度</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>提案状态分布</CardTitle>
                  <CardDescription>不同状态的提案数量</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>已通过</span>
                      <Badge className="bg-green-100 text-green-800">28</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>进行中</span>
                      <Badge className="bg-blue-100 text-blue-800">3</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>已拒绝</span>
                      <Badge className="bg-red-100 text-red-800">12</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>已取消</span>
                      <Badge className="bg-gray-100 text-gray-800">2</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>治理健康度</CardTitle>
                  <CardDescription>平台治理的整体健康状况</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">提案通过率</span>
                        <span className="text-sm text-muted-foreground">67%</span>
                      </div>
                      <Progress value={67} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">投票参与度</span>
                        <span className="text-sm text-muted-foreground">{governanceData.participation}%</span>
                      </div>
                      <Progress value={governanceData.participation} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">执行效率</span>
                        <span className="text-sm text-muted-foreground">92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  function Label({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={`text-sm font-medium ${className}`}>{children}</div>;
  }
};

export default RWADataVisualization;