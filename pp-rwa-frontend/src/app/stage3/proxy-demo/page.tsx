'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { RWAUpgradeableProxy_ADDRESS, RWAUpgradeableProxy_ABI } from '@/lib/wagmi'
import { Navigation } from '@/components/Navigation'
import { WalletConnect } from '@/components/WalletConnect'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

interface VersionInfo {
  implementation: string
  version: number
  timestamp: number
  upgradedBy: string
}

interface ContractState {
  count: number
  owner: string
  v2Prop: number
}

// 版本ABI配置
const VERSION_ABIS = {
  1: [
    {
      "inputs": [],
      "name": "initialize",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getCount",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "next",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [{"internalType": "address", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  2: [
    {
      "inputs": [],
      "name": "initialize",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "initializeV2",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getCount",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getV2Prop",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "next",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "multiplier", "type": "uint256"}],
      "name": "multi",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [{"internalType": "address", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    }
  ]
} as const

// 版本功能描述
const VERSION_DESCRIPTIONS = {
  1: {
    name: 'V1',
    description: '基础计数器功能',
    features: ['initialize() - 初始化合约', 'getCount() - 获取当前值', 'next() - 计数器加1']
  },
  2: {
    name: 'V2',
    description: '增强计数器功能',
    features: [
      'initialize() - 基础初始化',
      'initializeV2() - V2扩展初始化',
      'getCount() - 获取当前值',
      'getV2Prop() - 获取V2属性',
      'next() - 计数器加2',
      'multi(uint256) - 倍乘功能'
    ]
  }
} as const

export default function CounterDemoPage() {
  const { isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [versionHistory, setVersionHistory] = useState<VersionInfo[]>([])
  const [currentVersion, setCurrentVersion] = useState<number>(0)
  const [contractState, setContractState] = useState<ContractState>({
    count: 0,
    owner: '',
    v2Prop: 0
  })
  const [multiInput, setMultiInput] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [isV2Initialized, setIsV2Initialized] = useState<boolean>(false)
  const [lastQueryTime, setLastQueryTime] = useState<{count: Date | null, v2Prop: Date | null}>({
    count: null,
    v2Prop: null
  })

  // 管理合约地址
  const managementAddress = RWAUpgradeableProxy_ADDRESS || ''
  console.log('🔍 管理合约地址:', managementAddress)
  console.log('🔍 环境变量原始值:', process.env.NEXT_PUBLIC_RWA_UPGRADEABLE_PROXY_ADDRESS)

  const { writeContract, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })


  // 获取代理合约列表
  const { data: proxyCount } = useReadContract({
    address: managementAddress as `0x${string}`,
    abi: RWAUpgradeableProxy_ABI,
    functionName: 'getProxyCount',
    query: {
      enabled: !!managementAddress,
    }
  })
  console.log('🔍 代理合约数量:', proxyCount)

  // 获取第一个代理地址（索引0）
  const { data: proxyAddressAtIndex0 } = useReadContract({
    address: managementAddress as `0x${string}`,
    abi: RWAUpgradeableProxy_ABI,
    functionName: 'proxyAddresses',
    args: [0], // 获取索引0的地址
    query: {
      enabled: !!managementAddress && proxyCount !== undefined && proxyCount > 0,
    }
  })

  // 使用第一个代理地址作为演示
  const targetProxyAddress = proxyAddressAtIndex0 || ''
  console.log('🔍 索引0的代理地址:', proxyAddressAtIndex0)
  console.log('🔍 目标代理地址:', targetProxyAddress)
  console.log('🔍 代理数量:', proxyCount)
  console.log('🔍 代理地址获取状态:', {
    hasCount: proxyCount !== undefined && proxyCount > 0,
    hasAddress: !!proxyAddressAtIndex0,
    count: proxyCount,
    address: proxyAddressAtIndex0
  })

  // 获取版本历史
  const { data: versionHistoryData, refetch: refetchVersionHistory } = useReadContract({
    address: managementAddress as `0x${string}`,
    abi: RWAUpgradeableProxy_ABI,
    functionName: 'getVersionHistory',
    args: [targetProxyAddress as `0x${string}`],
    query: {
      enabled: !!targetProxyAddress,
      retry: false,
    }
  })
  console.log('🔍 版本历史数据:', versionHistoryData)

  // 获取当前版本
  const { data: currentVersionData, refetch: refetchCurrentVersion } = useReadContract({
    address: managementAddress as `0x${string}`,
    abi: RWAUpgradeableProxy_ABI,
    functionName: 'getCurrentVersion',
    args: [targetProxyAddress as `0x${string}`],
    query: {
      enabled: !!targetProxyAddress,
      retry: false,
    }
  })
  console.log('🔍 当前版本数据:', currentVersionData)

  // 获取当前实现地址
  const { data: directImplementation, refetch: refetchImplementation } = useReadContract({
    address: managementAddress as `0x${string}`,
    abi: [
      {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "implementation",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'implementation',
    args: [targetProxyAddress as `0x${string}`],
    query: {
      enabled: !!targetProxyAddress,
      retry: false,
    }
  })
  console.log('🔍 当前实现地址:', directImplementation)

  // 根据当前版本确定可用的ABI
  const availableABI = currentVersion ? VERSION_ABIS[currentVersion as keyof typeof VERSION_ABIS] : []

  const { data: countData, refetch: refetchCount } = useReadContract({
    address: targetProxyAddress as `0x${string}`,
    abi: availableABI,
    functionName: 'getCount',
    query: {
      enabled: !!targetProxyAddress && currentVersion > 0,
    }
  })

  const { data: ownerData, refetch: refetchOwner } = useReadContract({
    address: targetProxyAddress as `0x${string}`,
    abi: availableABI,
    functionName: 'owner',
    query: {
      enabled: !!targetProxyAddress && currentVersion > 0,
    }
  })

  const { data: v2PropData, refetch: refetchV2Prop } = useReadContract({
    address: targetProxyAddress as `0x${string}`,
    abi: availableABI,
    functionName: 'getV2Prop',
    query: {
      enabled: !!targetProxyAddress && currentVersion >= 2,
    }
  })

  console.log('🔍 合约状态数据:', { countData, ownerData, v2PropData, currentVersion, targetProxyAddress })

  // 处理版本历史数据
  useEffect(() => {
    console.log('🔍 版本历史数据变化:', versionHistoryData)
    if (versionHistoryData && Array.isArray(versionHistoryData)) {
      const formattedHistory: VersionInfo[] = versionHistoryData.map(item => ({
        implementation: item.implementation,
        version: Number(item.version),
        timestamp: Number(item.timestamp),
        upgradedBy: item.upgradedBy
      }))
      setVersionHistory(formattedHistory)
      console.log('📜 版本历史加载完成:', formattedHistory)
    } else {
      console.log('❌ 版本历史数据无效:', versionHistoryData)
    }
  }, [versionHistoryData])

  // 处理当前版本数据
  useEffect(() => {
    console.log('🔍 当前版本数据变化:', currentVersionData)
    if (currentVersionData !== undefined) {
      setCurrentVersion(Number(currentVersionData))
      console.log('🔄 当前版本设置:', Number(currentVersionData))
    }
  }, [currentVersionData])

  // 更新合约状态
  useEffect(() => {
    console.log('🔍 合约状态更新:', { countData, ownerData, v2PropData })
    if (countData !== undefined) {
      setContractState(prev => ({ ...prev, count: Number(countData) }))
      console.log('📊 count 更新:', Number(countData))
    }
    if (ownerData !== undefined) {
      setContractState(prev => ({ ...prev, owner: ownerData }))
      // 检查是否已初始化（owner不为零地址）
      const initialized = ownerData !== '0x0000000000000000000000000000000000000000'
      setIsInitialized(initialized)
      console.log('👤 owner 更新:', ownerData, '初始化状态:', initialized)
    }
    if (v2PropData !== undefined) {
      const v2PropValue = Number(v2PropData)
      setContractState(prev => ({ ...prev, v2Prop: v2PropValue }))
      // 检查V2是否已初始化（v2Prop不为0）
      const v2Initialized = v2PropValue > 0
      setIsV2Initialized(v2Initialized)
      console.log('🔢 v2Prop 更新:', v2PropValue, 'V2初始化状态:', v2Initialized)
    }
  }, [countData, ownerData, v2PropData])

  // 获取当前实现地址
  const currentImplementation = versionHistory.length > 0
    ? versionHistory[versionHistory.length - 1].implementation
    : directImplementation

  // 合约调用函数
  const callContractFunction = async (functionName: 'initialize' | 'next' | 'initializeV2' | 'multi', args?: readonly unknown[]) => {
    console.log(`🚀 准备调用 ${functionName}(), 参数:`, args)
    if (!targetProxyAddress || !currentVersion) {
      console.log('❌ 调用条件不满足:', { targetProxyAddress, currentVersion })
      return
    }

    try {
      const abi = VERSION_ABIS[currentVersion as keyof typeof VERSION_ABIS]
      console.log(`📋 使用ABI:`, abi.filter(item => item.name === functionName))

      writeContract({
        address: targetProxyAddress as `0x${string}`,
        abi,
        functionName,
        args: args as readonly [] | readonly [bigint] | undefined
      })
      console.log(`✅ ${functionName}() 调用已发送`)
    } catch (error) {
      console.error(`❌ ${functionName}() 调用失败:`, error)
      alert(`${functionName}() 调用失败`)
    }
  }

  // 具体的调用函数
  const handleInitialize = () => callContractFunction('initialize')
  const handleInitializeV2 = () => callContractFunction('initializeV2')
  const handleGetCount = () => {
    console.log('🔍 handleGetCount 被调用')
    console.log('🔍 当前状态:', {
      targetProxyAddress,
      currentVersion,
      isInitialized,
      availableABILength: availableABI.length,
      countData
    })
    setLastQueryTime(prev => ({ ...prev, count: new Date() }))
    refetchCount()
  }
  const handleGetV2Prop = () => {
    console.log('🔍 handleGetV2Prop 被调用')
    console.log('🔍 当前状态:', {
      targetProxyAddress,
      currentVersion,
      isInitialized,
      availableABILength: availableABI.length,
      v2PropData
    })
    setLastQueryTime(prev => ({ ...prev, v2Prop: new Date() }))
    refetchV2Prop()
  }
  const handleNext = () => callContractFunction('next')
  const handleMulti = () => {
    console.log('🚀 handleMulti 被调用, multiInput:', multiInput)
    if (!multiInput) {
      console.log('❌ multiInput 为空')
      return
    }
    const value = parseInt(multiInput)
    if (isNaN(value) || value <= 0) {
      console.log('❌ 无效的乘数值:', value)
      alert('乘数必须大于0')
      return
    }
    console.log('🔢 准备调用 multi 函数，参数:', BigInt(value))
    callContractFunction('multi', [BigInt(value)])
    setMultiInput('')
  }

  // 交易确认后刷新状态
  useEffect(() => {
    if (isConfirmed && hash) {
      console.log('✅ 交易已确认，刷新状态...')
      refetchCount()
      refetchOwner()
      refetchV2Prop()
      refetchVersionHistory()
      refetchCurrentVersion()
      // 重置V2初始化状态，等待新的v2Prop数据
      setIsV2Initialized(false)
    }
  }, [isConfirmed, hash, refetchCount, refetchOwner, refetchV2Prop, refetchVersionHistory, refetchCurrentVersion])

  // 刷新所有状态
  const refreshAllState = () => {
    console.log('🔄 刷新所有状态...')
    refetchVersionHistory()
    refetchCurrentVersion()
    refetchImplementation()
    refetchCount()
    refetchOwner()
    refetchV2Prop()
  }

  // 设置mounted状态
  useEffect(() => {
    console.log('🚀 页面组件挂载，设置mounted状态')
    setMounted(true)
  }, [])

  if (!mounted) return null

  const currentVersionInfo = currentVersion ? VERSION_DESCRIPTIONS[currentVersion as keyof typeof VERSION_DESCRIPTIONS] : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            代理合约交互演示
          </h1>
          <p className="text-xl text-gray-600">
            通过代理合约查询版本信息并调用不同版本的功能
          </p>
        </header>

        <Navigation />

        <div className="container mx-auto px-4 mt-8">
          {!isConnected ? (
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>连接钱包开始演示</CardTitle>
                  <CardDescription>
                    请连接您的Web3钱包以参与代理合约交互演示
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
                      <CardTitle>代理地址</CardTitle>
                      <CardDescription>从环境变量自动读取</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <Label>代理管理合约地址:</Label>
                        <div className="mt-1 p-2 bg-gray-100 rounded text-sm font-mono break-all">
                          {managementAddress || '未配置环境变量 NEXT_PUBLIC_RWA_UPGRADEABLE_PROXY_ADDRESS'}
                        </div>
                      </div>
                      {targetProxyAddress ? (
                        <div className="mt-3">
                          <Label>目标代理合约地址:</Label>
                          <div className="mt-1 p-2 bg-blue-50 rounded text-sm font-mono break-all">
                            {targetProxyAddress}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-sm font-medium text-yellow-800 mb-2">
                            ⚠️ 未找到可用的代理合约地址
                          </p>

                          <div className="bg-white rounded p-3 mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">诊断结果：</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              <li>✅ 代理管理合约已正确部署</li>
                              <li>✅ 环境变量配置正确</li>
                              {proxyCount !== undefined && proxyCount > 0 ? (
                                <li>✅ 管理合约中有代理合约记录</li>
                              ) : (
                                <li>❌ 管理合约中没有代理合约记录</li>
                              )}
                            </ul>
                            <p className="text-xs text-gray-500 mt-2">
                              📊 代理合约数量：{proxyCount || 0}
                            </p>
                          </div>

                          <div className="bg-blue-50 rounded p-3">
                            <p className="text-sm font-medium text-blue-800 mb-2">解决方案：</p>
                            <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                              <li>确保已部署 CounterV1 或 CounterV2 实现合约</li>
                              <li>在代理管理合约中调用 createProxy() 函数创建代理合约</li>
                              <li>创建时代理需要传入实现合约地址和初始化数据</li>
                              <li>创建成功后，页面会自动检测到新的代理合约</li>
                            </ol>
                          </div>

                          {proxyCount !== undefined && proxyCount > 0 && !proxyAddressAtIndex0 && (
                            <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                              <p className="text-xs text-yellow-700">
                                ⚠️ 检测到代理管理合约中记录有 {proxyCount} 个代理合约，
                                但无法读取索引0的代理地址。可能是：
                              </p>
                              <ul className="text-xs text-yellow-600 mt-1 list-disc list-inside">
                                <li>代理合约还未初始化</li>
                                <li>网络延迟问题</li>
                                <li>权限问题</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>操作控制</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        onClick={refreshAllState}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        🔄 刷新所有状态
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-3">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* 代理信息 */}
                    <Card>
                      <CardHeader>
                        <CardTitle>代理信息</CardTitle>
                        <CardDescription>当前代理合约的状态</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-gray-500">当前版本</Label>
                            <div className="font-semibold">V{currentVersion}</div>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-500">初始化状态</Label>
                            <div className="font-semibold">
                              {isInitialized ? '✅ 已初始化' : '❌ 未初始化'}
                            </div>
                          </div>
                        </div>

                        {currentImplementation && (
                          <div>
                            <Label className="text-sm text-gray-500">当前实现地址</Label>
                            <div className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                              {currentImplementation}
                            </div>
                          </div>
                        )}

                        {targetProxyAddress && (
                          <div>
                            <Label className="text-sm text-gray-500">代理合约地址</Label>
                            <div className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                              {targetProxyAddress}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* 合约状态 */}
                    <Card>
                      <CardHeader>
                        <CardTitle>合约状态</CardTitle>
                        <CardDescription>当前实现合约的状态数据</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-gray-500">计数器值</Label>
                            <div className="font-semibold">{contractState.count}</div>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-500">合约所有者</Label>
                            <div className="text-xs font-mono">
                              {contractState.owner ? `${contractState.owner.slice(0, 8)}...${contractState.owner.slice(-6)}` : '未设置'}
                            </div>
                          </div>
                        </div>

                        {currentVersion >= 2 && (
                          <div>
                            <Label className="text-sm text-gray-500">V2属性</Label>
                            <div className="font-semibold">{contractState.v2Prop}</div>
                          </div>
                        )}

                        <div className="text-xs text-gray-500">
                          所有数据通过代理合约从当前实现合约获取
                        </div>
                      </CardContent>
                    </Card>

                    {/* 版本历史 */}
                    <Card>
                      <CardHeader>
                        <CardTitle>版本历史</CardTitle>
                        <CardDescription>代理合约的升级历史</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {versionHistory.length > 0 ? (
                          <div className="space-y-3">
                            {versionHistory.map((info, index) => (
                              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <Badge variant="secondary">V{info.version}</Badge>
                                  <span className="text-xs text-gray-500">
                                    {new Date(info.timestamp * 1000).toLocaleString()}
                                  </span>
                                </div>
                                <div className="text-xs font-mono text-gray-600">
                                  {info.implementation.slice(0, 10)}...{info.implementation.slice(-8)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  升级者: {info.upgradedBy.slice(0, 8)}...{info.upgradedBy.slice(-6)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-4">
                            暂无版本历史
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* 功能调用 */}
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle>功能调用</CardTitle>
                        <CardDescription>
                          通过代理合约调用当前版本的功能 (当前: {currentVersionInfo?.name})
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {currentVersion === 0 ? (
                          <div className="text-center text-gray-500 py-8">
                            请先设置代理合约地址并确保有版本历史
                          </div>
                        ) : (
                          <>
                            {/* 初始化功能 */}
                            <div>
                              <h4 className="font-semibold mb-3">初始化功能</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <Button
                                  onClick={handleInitialize}
                                  disabled={!targetProxyAddress || isPending || isInitialized}
                                  variant={isInitialized ? "outline" : "default"}
                                >
                                  {isInitialized ? '✅ 已初始化' : 'initialize()'}
                                </Button>
                                {currentVersion >= 2 && (
                                  <Button
                                    onClick={handleInitializeV2}
                                    disabled={!targetProxyAddress || isPending || !isInitialized || isV2Initialized}
                                    variant={isV2Initialized ? "outline" : "default"}
                                  >
                                    {isV2Initialized ? '✅ V2已初始化' : 'initializeV2()'}
                                  </Button>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-2">
                                基础初始化后才能调用V2初始化，V2初始化后v2Prop值将大于0
                              </div>
                            </div>

                            {/* 查询功能 */}
                            <div>
                              <h4 className="font-semibold mb-4">查询功能</h4>

                              {/* getCount() 行 */}
                              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg mb-3">
                                <Button
                                  variant="outline"
                                  onClick={handleGetCount}
                                  disabled={!targetProxyAddress || currentVersion === 0}
                                >
                                  getCount()
                                </Button>
                                <div className="flex-1 ml-4">
                                  <div className="text-sm text-gray-600 mb-1">查询结果:</div>
                                  <div className="text-xl font-bold text-blue-600">
                                    {countData !== undefined ? Number(countData) : '--'}
                                  </div>
                                  {lastQueryTime.count && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {lastQueryTime.count.toLocaleTimeString()}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* getV2Prop() 行 */}
                              {currentVersion >= 2 && (
                                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                  <Button
                                    variant="outline"
                                    onClick={handleGetV2Prop}
                                    disabled={!targetProxyAddress || currentVersion === 0}
                                  >
                                    getV2Prop()
                                  </Button>
                                  <div className="flex-1 ml-4">
                                    <div className="text-sm text-gray-600 mb-1">查询结果:</div>
                                    <div className="text-xl font-bold text-green-600">
                                      {v2PropData !== undefined ? Number(v2PropData) : '--'}
                                    </div>
                                    {lastQueryTime.v2Prop && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        {lastQueryTime.v2Prop.toLocaleTimeString()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* 版本提示 */}
                              {currentVersion < 2 && (
                                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                  <div className="text-sm text-yellow-800">
                                    💡 当前版本 V{currentVersion} 不支持 getV2Prop() 功能，升级到 V2 版本后可用
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 操作功能 */}
                            <div>
                              <h4 className="font-semibold mb-4">操作功能</h4>

                              {/* next() 功能行 */}
                              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg mb-3">
                                <Button
                                  onClick={handleNext}
                                  disabled={!targetProxyAddress || isPending || !isInitialized}
                                  className="min-w-[200px]"
                                >
                                  {currentVersion === 1 ? 'next() - 计数器+1' : 'next() - 计数器+2'}
                                </Button>
                                <div className="flex-1 ml-4">
                                  <div className="text-sm text-gray-600 mb-1">功能说明:</div>
                                  <div className="text-sm font-medium text-purple-700">
                                    {currentVersion === 1
                                      ? '调用计数器加1操作 (V1版本功能)'
                                      : '调用计数器加2操作 (V2版本增强功能)'
                                    }
                                  </div>
                                </div>
                              </div>

                              {/* multi() 功能行 */}
                              {currentVersion >= 2 && (
                                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                                  <div className="flex items-center space-x-2 min-w-[280px]">
                                    <div className="flex-1">
                                      <Input
                                        placeholder="输入乘数 (如: 2, 3, 5)"
                                        value={multiInput}
                                        onChange={(e) => setMultiInput(e.target.value)}
                                        className="w-full"
                                        disabled={!targetProxyAddress || isPending || !isInitialized}
                                      />
                                      <div className="text-xs text-gray-500 mt-1">
                                        请输入大于0的整数
                                      </div>
                                    </div>
                                    <Button
                                      onClick={handleMulti}
                                      disabled={!targetProxyAddress || isPending || !isInitialized || !multiInput}
                                      className="whitespace-nowrap"
                                    >
                                      multi()
                                    </Button>
                                  </div>
                                  <div className="flex-1 ml-4">
                                    <div className="text-sm text-gray-600 mb-1">功能说明:</div>
                                    <div className="text-sm font-medium text-orange-700">
                                      将当前计数器值乘以指定倍数 (V2版本专属功能)
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* 版本提示 */}
                              {currentVersion < 2 && (
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <div className="text-sm text-blue-800">
                                    💡 当前版本 V{currentVersion} 不支持 multi() 功能，升级到 V2 版本后可用
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 当前版本信息 */}
                            <div>
                              <h4 className="font-semibold mb-3">当前版本信息</h4>
                              <div className="p-4 border rounded-lg bg-gray-50">
                                <h5 className="font-medium mb-2">{currentVersionInfo?.name} - {currentVersionInfo?.description}</h5>
                                <div className="space-y-1">
                                  <div className="text-sm text-gray-600">支持的功能:</div>
                                  {currentVersionInfo?.features.map((feature, index) => (
                                    <div key={index} className="text-sm text-gray-700">• {feature}</div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* 交易状态 */}
                        {(isPending || isConfirming) && (
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm text-blue-700">
                              {isPending ? '交易发送中...' : '交易确认中...'}
                              {hash && (
                                <div className="font-mono text-xs mt-1">
                                  Hash: {hash}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              {/* 返回链接 */}
              <div className="text-center mt-8">
                <Link href="/stage3" className="text-blue-600 hover:text-blue-800 underline">
                  ← 返回 Stage3 主页
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}