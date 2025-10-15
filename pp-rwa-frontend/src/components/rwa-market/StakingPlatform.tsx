'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface StakingPool {
  id: string
  name: string
  tokenSymbol: string
  apy: number
  totalStaked: number
  maxCapacity: number
  lockPeriod: number
  minAmount: number
  isActive: boolean
  multiplier: number
}

interface UserStake {
  id: string
  poolId: string
  amount: number
  rewards: number
  startTime: number
  lockPeriod: number
  isLocked: boolean
  poolName: string
}

export function StakingPlatform({ isConnected }: { isConnected: boolean }) {
  const [pools, setPools] = useState<StakingPool[]>([
    {
      id: '1',
      name: 'RWA20 基础质押池',
      tokenSymbol: 'RWA20',
      apy: 8.5,
      totalStaked: 85000000,
      maxCapacity: 100000000,
      lockPeriod: 30,
      minAmount: 1000,
      isActive: true,
      multiplier: 1.0
    },
    {
      id: '2',
      name: 'RWA20 高收益质押池',
      tokenSymbol: 'RWA20',
      apy: 15.0,
      totalStaked: 45000000,
      maxCapacity: 50000000,
      lockPeriod: 90,
      minAmount: 5000,
      isActive: true,
      multiplier: 1.5
    },
    {
      id: '3',
      name: 'RWA721 NFT质押池',
      tokenSymbol: 'RWA721',
      apy: 12.0,
      totalStaked: 25000000,
      maxCapacity: 30000000,
      lockPeriod: 60,
      minAmount: 100,
      isActive: true,
      multiplier: 1.2
    },
    {
      id: '4',
      name: '多代币混合质押池',
      tokenSymbol: 'RWA20/721/1155',
      apy: 10.0,
      totalStaked: 38000000,
      maxCapacity: 50000000,
      lockPeriod: 45,
      minAmount: 2000,
      isActive: true,
      multiplier: 1.1
    }
  ])

  const [userStakes, setUserStakes] = useState<UserStake[]>([
    {
      id: '1',
      poolId: '1',
      amount: 25000,
      rewards: 1785.42,
      startTime: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15天前
      lockPeriod: 30,
      isLocked: true,
      poolName: 'RWA20 基础质押池'
    },
    {
      id: '2',
      poolId: '2',
      amount: 10000,
      rewards: 410.96,
      startTime: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5天前
      lockPeriod: 90,
      isLocked: true,
      poolName: 'RWA20 高收益质押池'
    }
  ])

  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null)
  const [stakeAmount, setStakeAmount] = useState('')
  const [userBalance, setUserBalance] = useState(150000)
  const [totalRewards, setTotalRewards] = useState(2196.38)

  const handleStake = () => {
    if (!selectedPool || !stakeAmount) return

    const amount = Number(stakeAmount)
    if (amount < selectedPool.minAmount) {
      alert(`最小质押金额为 ${selectedPool.minAmount}`)
      return
    }
    if (amount > userBalance) {
      alert('余额不足')
      return
    }

    // 这里应该调用智能合约进行质押
    const newStake: UserStake = {
      id: Date.now().toString(),
      poolId: selectedPool.id,
      amount,
      rewards: 0,
      startTime: Date.now(),
      lockPeriod: selectedPool.lockPeriod,
      isLocked: true,
      poolName: selectedPool.name
    }

    setUserStakes(prev => [...prev, newStake])
    setUserBalance(prev => prev - amount)
    setStakeAmount('')
    alert(`成功质押 ${amount} ${selectedPool.tokenSymbol}`)
  }

  const handleUnstake = (stakeId: string) => {
    const stake = userStakes.find(s => s.id === stakeId)
    if (!stake) return

    if (stake.isLocked) {
      alert('质押仍在锁定期内，无法解除')
      return
    }

    // 这里应该调用智能合约解除质押
    setUserStakes(prev => prev.filter(s => s.id !== stakeId))
    setUserBalance(prev => prev + stake.amount)
    setTotalRewards(prev => prev + stake.rewards)
    alert(`成功解除质押，收回 ${stake.amount} 代币和 ${stake.rewards.toFixed(2)} 奖励`)
  }

  const handleClaimRewards = (stakeId: string) => {
    const stake = userStakes.find(s => s.id === stakeId)
    if (!stake) return

    // 这里应该调用智能合约领取奖励
    setTotalRewards(prev => prev + stake.rewards)
    setUserStakes(prev => prev.map(s =>
      s.id === stakeId ? { ...s, rewards: 0 } : s
    ))
    alert(`成功领取 ${stake.rewards.toFixed(2)} 奖励`)
  }

  const getRemainingTime = (startTime: number, lockPeriod: number) => {
    const elapsed = Date.now() - startTime
    const remaining = Math.max(0, lockPeriod * 24 * 60 * 60 * 1000 - elapsed)
    const days = Math.ceil(remaining / (24 * 60 * 60 * 1000))
    return days
  }

  if (!isConnected) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">请连接钱包</h3>
          <p className="text-gray-600">连接钱包以访问质押平台</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 质押统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">总质押金额</div>
            <div className="text-2xl font-bold text-gray-900">¥{userStakes.reduce((sum, stake) => sum + stake.amount, 0).toLocaleString()}</div>
            <div className="text-sm text-green-600 mt-1">+{userStakes.length} 个质押</div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">累计奖励</div>
            <div className="text-2xl font-bold text-green-600">¥{totalRewards.toFixed(2)}</div>
            <div className="text-sm text-gray-500 mt-1">待领取: ¥{userStakes.reduce((sum, stake) => sum + stake.rewards, 0).toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">平均APY</div>
            <div className="text-2xl font-bold text-blue-600">11.3%</div>
            <div className="text-sm text-gray-500 mt-1">加权平均收益</div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">可用余额</div>
            <div className="text-2xl font-bold text-purple-600">¥{userBalance.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1">RWA20 代币</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 质押池列表 */}
        <div className="lg:col-span-2">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>质押池</CardTitle>
              <CardDescription>选择合适的质押池赚取奖励</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pools.map((pool) => (
                  <div
                    key={pool.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedPool?.id === pool.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedPool(pool)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{pool.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{pool.tokenSymbol}</Badge>
                          <Badge className={pool.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {pool.isActive ? '开放中' : '已关闭'}
                          </Badge>
                          {pool.multiplier > 1 && (
                            <Badge className="bg-purple-100 text-purple-800">
                              {pool.multiplier}x 倍数
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{pool.apy}%</div>
                        <div className="text-sm text-gray-600">APY</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">锁定期:</span>
                        <span className="ml-1 font-medium">{pool.lockPeriod} 天</span>
                      </div>
                      <div>
                        <span className="text-gray-600">最小金额:</span>
                        <span className="ml-1 font-medium">¥{pool.minAmount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">已质押:</span>
                        <span className="ml-1 font-medium">¥{(pool.totalStaked / 1000000).toFixed(1)}M</span>
                      </div>
                      <div>
                        <span className="text-gray-600">容量:</span>
                        <span className="ml-1 font-medium">{((pool.totalStaked / pool.maxCapacity) * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">质押进度</span>
                        <span className="font-medium">{pool.totalStaked.toLocaleString()} / {pool.maxCapacity.toLocaleString()}</span>
                      </div>
                      <Progress value={(pool.totalStaked / pool.maxCapacity) * 100} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 质押操作面板 */}
        <div className="space-y-6">
          {selectedPool ? (
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>质押操作</CardTitle>
                <CardDescription>{selectedPool.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-blue-900 font-medium">当前池信息</div>
                  <div className="text-sm text-blue-700 mt-1">
                    APY: {selectedPool.apy}% | 锁定期: {selectedPool.lockPeriod} 天
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    质押数量 ({selectedPool.tokenSymbol})
                  </label>
                  <Input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder={`最小: ${selectedPool.minAmount}`}
                  />
                  <div className="text-sm text-gray-600 mt-1">
                    可用余额: {userBalance.toLocaleString()} {selectedPool.tokenSymbol}
                  </div>
                </div>

                {stakeAmount && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm text-green-900">
                      预估日收益: ¥{(Number(stakeAmount) * selectedPool.apy / 100 / 365).toFixed(2)}
                    </div>
                    <div className="text-sm text-green-700">
                      预估总收益 ({selectedPool.lockPeriod}天): ¥{(Number(stakeAmount) * selectedPool.apy / 100 * selectedPool.lockPeriod / 365).toFixed(2)}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleStake}
                  className="w-full"
                  disabled={!stakeAmount || !selectedPool.isActive}
                >
                  质押 {selectedPool.tokenSymbol}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">选择质押池</h3>
                <p className="text-gray-600">从左侧列表选择一个质押池</p>
              </CardContent>
            </Card>
          )}

          {/* 我的质押 */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>我的质押</CardTitle>
              <CardDescription>当前质押和奖励情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userStakes.map((stake) => {
                  const remainingDays = getRemainingTime(stake.startTime, stake.lockPeriod)
                  return (
                    <div key={stake.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-medium text-gray-900">{stake.poolName}</h5>
                          <div className="text-sm text-gray-600">
                            质押: ¥{stake.amount.toLocaleString()}
                          </div>
                        </div>
                        <Badge className={stake.isLocked ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>
                          {stake.isLocked ? `锁定中 (${remainingDays}天)` : '可解除'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          <span className="text-gray-600">待领奖励:</span>
                          <span className="ml-1 font-medium text-green-600">¥{stake.rewards.toFixed(2)}</span>
                        </div>
                        <div className="space-x-2">
                          {stake.rewards > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleClaimRewards(stake.id)}
                            >
                              领取奖励
                            </Button>
                          )}
                          {!stake.isLocked && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUnstake(stake.id)}
                            >
                              解除质押
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}