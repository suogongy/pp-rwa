'use client'

import { useState, useEffect } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { rwa20Contract, rwaStakingContract } from '@/lib/wagmi'

interface StakingManagementProps {
  address: string
}

interface StakeInfo {
  user: string
  amount: string
  startTime: string
  endTime: string
  rewardRate: string
  lockPeriod: string
  rewardMultiplier: string
  lastRewardTime: string
  claimedRewards: string
  isActive: boolean
  isCompounded: boolean
  pendingRewards: string
}

export function StakingManagement({ address }: StakingManagementProps) {
  const [stakeAmount, setStakeAmount] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('0')
  const [stakeId, setStakeId] = useState('')
  const [compoundAmount, setCompoundAmount] = useState('')
  const [userStakes, setUserStakes] = useState<StakeInfo[]>([])
  
  // 错误状态
  const [errors, setErrors] = useState<{
    stake?: string
    claim?: string
    unstake?: string
    compound?: string
  }>({})

  // 读取合约信息
  const { data: stakingToken, isError: tokenError, refetch: refetchStakingToken } = useReadContract({
    ...rwaStakingContract,
    functionName: 'stakingToken',
  })

  const { data: rewardToken, isError: rewardError, refetch: refetchRewardToken } = useReadContract({
    ...rwaStakingContract,
    functionName: 'rewardToken',
  })

  const { data: totalStaked, isError: totalStakedError, refetch: refetchTotalStaked } = useReadContract({
    ...rwaStakingContract,
    functionName: 'totalStaked',
  })

  const { data: totalRewards, isError: totalRewardsError, refetch: refetchTotalRewards } = useReadContract({
    ...rwaStakingContract,
    functionName: 'totalRewardsDistributed',
  })

  const { data: baseRewardRate, isError: rateError, refetch: refetchBaseRate } = useReadContract({
    ...rwaStakingContract,
    functionName: 'baseRewardRate',
  })

  // 获取用户的质押信息
  const { 
    data: userStakeIds, 
    isError: userStakesError, 
    refetch: refetchUserStakes 
  } = useReadContract({
    ...rwaStakingContract,
    functionName: 'getUserStakes',
    args: [address as `0x${string}`],
  })

  // 获取质押周期信息
  const { data: period1APY, refetch: refetchAPY1 } = useReadContract({
    ...rwaStakingContract,
    functionName: 'calculateAPY',
    args: [0n],
  })

  const { data: period2APY, refetch: refetchAPY2 } = useReadContract({
    ...rwaStakingContract,
    functionName: 'calculateAPY',
    args: [1n],
  })

  const { data: period3APY, refetch: refetchAPY3 } = useReadContract({
    ...rwaStakingContract,
    functionName: 'calculateAPY',
    args: [2n],
  })

  const { data: period4APY, refetch: refetchAPY4 } = useReadContract({
    ...rwaStakingContract,
    functionName: 'calculateAPY',
    args: [3n],
  })

  // 查询质押详情
  const { 
    data: stakeDetails, 
    isError: stakeDetailsError, 
    refetch: refetchStakeDetails 
  } = useReadContract({
    ...rwaStakingContract,
    functionName: 'getStakeInfo',
    args: [stakeId as `0x${string}`],
    query: {
      enabled: false,
    }
  })

  // 获取用户余额
  const { data: userBalance, refetch: refetchUserBalance } = useReadContract({
    ...rwa20Contract,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  })

  // 检查代币授权
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    ...rwa20Contract,
    functionName: 'allowance',
    args: [address as `0x${string}`, rwaStakingContract.address as `0x${string}`],
  })

  // 合约写入操作
  const { writeContract, isPending: isStakePending, data: stakeData, error: stakeError } = useWriteContract()
  const { writeContract: writeUnstake, isPending: isUnstakePending, data: unstakeData, error: unstakeError } = useWriteContract()
  const { writeContract: writeClaim, isPending: isClaimPending, data: claimData, error: claimError } = useWriteContract()
  const { writeContract: writeCompound, isPending: isCompoundPending, data: compoundData, error: compoundError } = useWriteContract()
  const { writeContract: writeApprove, isPending: isApprovePending, data: approveData, error: approveError } = useWriteContract()

  // 等待交易确认
  const { isLoading: isStakeConfirming, isSuccess: isStakeSuccess } = useWaitForTransactionReceipt({
    hash: stakeData,
  })

  const { isLoading: isUnstakeConfirming, isSuccess: isUnstakeSuccess } = useWaitForTransactionReceipt({
    hash: unstakeData,
  })

  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: claimData,
  })

  const { isLoading: isCompoundConfirming, isSuccess: isCompoundSuccess } = useWaitForTransactionReceipt({
    hash: compoundData,
  })

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveData,
  })

  // 质押周期选项
  const stakingPeriods = [
    { id: '0', name: '30天', duration: '30天', multiplier: '1.1x', apy: period1APY },
    { id: '1', name: '90天', duration: '90天', multiplier: '1.25x', apy: period2APY },
    { id: '2', name: '180天', duration: '180天', multiplier: '1.5x', apy: period3APY },
    { id: '3', name: '365天', duration: '365天', multiplier: '2.0x', apy: period4APY },
  ]

  // 刷新所有数据
  const refreshAllData = () => {
    refetchStakingToken()
    refetchRewardToken()
    refetchTotalStaked()
    refetchTotalRewards()
    refetchBaseRate()
    refetchUserStakes()
    refetchUserBalance()
    refetchAllowance()
    refetchAPY1()
    refetchAPY2()
    refetchAPY3()
    refetchAPY4()
  }

  // 更新用户质押列表
  useEffect(() => {
    if (userStakeIds && Array.isArray(userStakeIds)) {
      const fetchStakeDetails = async () => {
        const stakes: StakeInfo[] = []
        for (const stakeId of userStakeIds) {
          try {
            // 这里需要调用合约获取质押详情
            // 由于合约调用的限制，我们暂时使用占位符
            const details = await refetchStakeDetails()
            if (details.data) {
              stakes.push({
                user: details.data[0] as string,
                amount: formatEther(details.data[1] as bigint),
                startTime: new Date(Number(details.data[2]) * 1000).toLocaleDateString(),
                endTime: new Date(Number(details.data[3]) * 1000).toLocaleDateString(),
                rewardRate: (Number(details.data[4]) / 100).toFixed(2) + '%',
                lockPeriod: (Number(details.data[5]) / 86400).toFixed(0) + '天',
                rewardMultiplier: (Number(details.data[6]) / 100).toFixed(2) + 'x',
                lastRewardTime: new Date(Number(details.data[7]) * 1000).toLocaleDateString(),
                claimedRewards: formatEther(details.data[8] as bigint),
                isActive: details.data[9] as boolean,
                isCompounded: details.data[10] as boolean,
                pendingRewards: '0' // 需要额外计算
              })
            }
          } catch (error) {
            console.error('Error fetching stake details:', error)
          }
        }
        setUserStakes(stakes)
      }
      
      fetchStakeDetails()
    }
  }, [userStakeIds])

  const handleApprove = async () => {
    if (!stakeAmount || !address) return
    
    const amount = parseEther(stakeAmount)
    if (amount === 0n) return
    
    try {
      writeApprove({
        ...rwa20Contract,
        functionName: 'approve',
        args: [rwaStakingContract.address as `0x${string}`, amount],
      })
    } catch (error) {
      console.error('Approve error:', error)
      setErrors(prev => ({ ...prev, stake: '授权失败: ' + (error as Error).message }))
    }
  }

  const handleStake = async () => {
    if (!stakeAmount || !selectedPeriod || !address) return
    
    const amount = parseEther(stakeAmount)
    if (amount === 0n) return
    
    // 检查余额
    if (userBalance && amount > userBalance) {
      setErrors(prev => ({ ...prev, stake: '余额不足' }))
      return
    }
    
    // 检查授权
    if (!allowance || amount > allowance) {
      setErrors(prev => ({ ...prev, stake: '需要先授权代币使用权限' }))
      return
    }
    
    try {
      writeContract({
        ...rwaStakingContract,
        functionName: 'stake',
        args: [amount, BigInt(selectedPeriod)],
      })
    } catch (error) {
      console.error('Stake error:', error)
      setErrors(prev => ({ ...prev, stake: '质押失败: ' + (error as Error).message }))
    }
  }

  const handleUnstake = async () => {
    if (!stakeId) return
    
    try {
      writeContract({
        ...rwaStakingContract,
        functionName: 'unstake',
        args: [stakeId as `0x${string}`],
      })
    } catch (error) {
      console.error('Unstake error:', error)
      setErrors(prev => ({ ...prev, unstake: '解除质押失败: ' + (error as Error).message }))
    }
  }

  const handleClaimRewards = async () => {
    if (!stakeId) return
    
    try {
      writeContract({
        ...rwaStakingContract,
        functionName: 'claimRewards',
        args: [stakeId as `0x${string}`],
      })
    } catch (error) {
      console.error('Claim rewards error:', error)
      setErrors(prev => ({ ...prev, claim: '提取奖励失败: ' + (error as Error).message }))
    }
  }

  const handleCompound = async () => {
    if (!stakeId || !compoundAmount) return
    
    const amount = parseEther(compoundAmount)
    if (amount === 0n) return
    
    // 检查余额
    if (userBalance && amount > userBalance) {
      setErrors(prev => ({ ...prev, compound: '余额不足' }))
      return
    }
    
    // 检查授权
    if (!allowance || amount > allowance) {
      setErrors(prev => ({ ...prev, compound: '需要先授权代币使用权限' }))
      return
    }
    
    try {
      writeContract({
        ...rwaStakingContract,
        functionName: 'compoundStake',
        args: [stakeId as `0x${string}`, amount],
      })
    } catch (error) {
      console.error('Compound error:', error)
      setErrors(prev => ({ ...prev, compound: '复投失败: ' + (error as Error).message }))
    }
  }

  // 监控交易状态
  useEffect(() => {
    if (isStakeSuccess || isUnstakeSuccess || isClaimSuccess || isCompoundSuccess || isApproveSuccess) {
      refreshAllData()
      // 清除错误信息
      setErrors({})
    }
  }, [isStakeSuccess, isUnstakeSuccess, isClaimSuccess, isCompoundSuccess, isApproveSuccess])

  return (
    <div className="space-y-6">
      {/* 质押合约信息 */}
      <Card>
        <CardHeader>
          <CardTitle>质押合约信息</CardTitle>
          <CardDescription>RWA代币质押系统概况</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">质押代币</Label>
              <div className="text-lg font-semibold">RWA</div>
            </div>
            <div>
              <Label className="text-sm font-medium">奖励代币</Label>
              <div className="text-lg font-semibold">RWA</div>
            </div>
            <div>
              <Label className="text-sm font-medium">总质押量</Label>
              <div className="text-lg font-semibold">
                {totalStaked ? formatEther(totalStaked) : '0'} RWA
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">总奖励发放</Label>
              <div className="text-lg font-semibold">
                {totalRewards ? formatEther(totalRewards) : '0'} RWA
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            基础收益率: {baseRewardRate ? (Number(baseRewardRate) / 100).toFixed(2) + '%' : '加载中...'}
          </div>
        </CardContent>
      </Card>

      {/* 质押周期选择 */}
      <Card>
        <CardHeader>
          <CardTitle>选择质押周期</CardTitle>
          <CardDescription>不同周期有不同的奖励倍数</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stakingPeriods.map((period) => (
              <div
                key={period.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPeriod === period.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedPeriod(period.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-green-500">{period.name}</Badge>
                  <Badge variant="outline">{period.multiplier}</Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <div>周期: {period.duration}</div>
                  <div>APY: {period.apy ? (Number(period.apy) / 100).toFixed(2) + '%' : '计算中...'}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 质押操作 */}
      <Card>
        <CardHeader>
          <CardTitle>质押代币</CardTitle>
          <CardDescription>质押您的RWA代币获得收益</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 余额和授权状态 */}
          <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium">代币余额</Label>
              <div className="text-lg font-semibold">
                {userBalance ? formatEther(userBalance) : '0'} RWA
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">授权状态</Label>
              <div className="text-lg font-semibold">
                {allowance && BigInt(stakeAmount || '0') <= allowance ? (
                  <span className="text-green-600">已授权</span>
                ) : (
                  <span className="text-red-600">未授权</span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                已授权: {allowance ? formatEther(allowance) : '0'} RWA
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stakeAmount">质押数量</Label>
              <Input
                id="stakeAmount"
                type="number"
                placeholder="0.0"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                可用余额: {userBalance ? formatEther(userBalance) : '0'} RWA
              </p>
            </div>
            <div className="space-y-2">
              <Label>选择的周期</Label>
              <div className="p-2 border rounded bg-gray-50">
                {stakingPeriods.find(p => p.id === selectedPeriod)?.name || '请选择周期'}
              </div>
            </div>
          </div>

          {/* 授权按钮 */}
          {allowance && BigInt(stakeAmount || '0') > allowance && (
            <div className="space-y-2">
              <Button 
                onClick={handleApprove}
                disabled={!stakeAmount || isApprovePending || isApproveConfirming}
                className="w-full"
                variant="outline"
              >
                {isApprovePending ? '确认中...' : isApproveConfirming ? '授权中...' : '授权代币使用权限'}
              </Button>
              {approveError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    授权失败: {approveError.message}
                  </AlertDescription>
                </Alert>
              )}
              {isApproveSuccess && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-700">
                    ✅ 授权成功！现在可以进行质押
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* 质押按钮 */}
          <Button 
            onClick={handleStake}
            disabled={!stakeAmount || !selectedPeriod || isStakePending || isStakeConfirming || (allowance && BigInt(stakeAmount || '0') > allowance)}
            className="w-full"
          >
            {isStakePending ? '确认中...' : isStakeConfirming ? '质押中...' : '确认质押'}
          </Button>
          
          {errors.stake && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {errors.stake}
              </AlertDescription>
            </Alert>
          )}
          
          {stakeError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                质押失败: {stakeError.message}
              </AlertDescription>
            </Alert>
          )}
          
          {isStakeSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">
                ✅ 质押成功！交易哈希: {stakeData?.slice(0, 10)}...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 我的质押记录 */}
      <Card>
        <CardHeader>
          <CardTitle>我的质押记录</CardTitle>
          <CardDescription>查看和管理您的质押</CardDescription>
        </CardHeader>
        <CardContent>
          {userStakes.length > 0 ? (
            <div className="space-y-4">
              {userStakes.map((stake, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium">质押数量</Label>
                      <div className="text-lg font-semibold">{stake.amount} RWA</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">开始时间</Label>
                      <div className="text-sm">{stake.startTime}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">结束时间</Label>
                      <div className="text-sm">{stake.endTime}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">收益率</Label>
                      <div className="text-sm">{stake.rewardRate}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge className={stake.isActive ? "bg-green-500" : "bg-gray-500"}>
                      {stake.isActive ? "活跃" : "已结束"}
                    </Badge>
                    {stake.isCompounded && <Badge className="bg-blue-500">已复投</Badge>}
                    <Badge variant="outline">{stake.rewardMultiplier}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                您还没有任何质押记录。开始质押您的代币获得收益吧！
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 质押管理操作 */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>提取奖励</CardTitle>
            <CardDescription>从质押中提取已获得的奖励</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="claimStakeId">质押ID</Label>
              <Input
                id="claimStakeId"
                placeholder="0x..."
                value={stakeId}
                onChange={(e) => setStakeId(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleClaimRewards}
              disabled={!stakeId || isClaimPending || isClaimConfirming}
              className="w-full"
              variant="outline"
            >
              {isClaimPending ? '确认中...' : isClaimConfirming ? '提取中...' : '提取奖励'}
            </Button>
            
            {errors.claim && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {errors.claim}
                </AlertDescription>
              </Alert>
            )}
            {claimError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  提取奖励失败: {claimError.message}
                </AlertDescription>
              </Alert>
            )}
            
            {isClaimSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">
                  ✅ 奖励提取成功！交易哈希: {claimData?.slice(0, 10)}...
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>解除质押</CardTitle>
            <CardDescription>解除质押并取回代币（需要质押期已满）</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unstakeStakeId">质押ID</Label>
              <Input
                id="unstakeStakeId"
                placeholder="0x..."
                value={stakeId}
                onChange={(e) => setStakeId(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleUnstake}
              disabled={!stakeId || isUnstakePending || isUnstakeConfirming}
              className="w-full"
              variant="destructive"
            >
              {isUnstakePending ? '确认中...' : isUnstakeConfirming ? '解除中...' : '解除质押'}
            </Button>
            
            {errors.unstake && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {errors.unstake}
                </AlertDescription>
              </Alert>
            )}
            {unstakeError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  解除质押失败: {unstakeError.message}
                </AlertDescription>
              </Alert>
            )}
            
            {isUnstakeSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">
                  ✅ 解除质押成功！交易哈希: {unstakeData?.slice(0, 10)}...
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 复投操作 */}
      <Card>
        <CardHeader>
          <CardTitle>复投质押</CardTitle>
          <CardDescription>向现有质押添加更多代币以增加收益</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="compoundStakeId">质押ID</Label>
              <Input
                id="compoundStakeId"
                placeholder="0x..."
                value={stakeId}
                onChange={(e) => setStakeId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compoundAmount">复投数量</Label>
              <Input
                id="compoundAmount"
                type="number"
                placeholder="0.0"
                value={compoundAmount}
                onChange={(e) => setCompoundAmount(e.target.value)}
              />
            </div>
          </div>
          <Button 
            onClick={handleCompound}
            disabled={!stakeId || !compoundAmount || isCompoundPending || isCompoundConfirming}
            className="w-full"
          >
            {isCompoundPending ? '确认中...' : isCompoundConfirming ? '复投中...' : '复投质押'}
          </Button>
          
          {errors.compound && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {errors.compound}
              </AlertDescription>
            </Alert>
          )}
          {compoundError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                复投失败: {compoundError.message}
              </AlertDescription>
            </Alert>
          )}
          
          {isCompoundSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">
                ✅ 复投成功！交易哈希: {compoundData?.slice(0, 10)}...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}