'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { RWAUpgradeableProxy_ADDRESS, RWAUpgradeableProxy_ABI } from '@/lib/wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

interface ProxyInfo {
  address: string
  implementation: string
  version: number
  timestamp: number
  needsInitialization?: boolean
}

interface VersionInfo {
  implementation: string
  version: number
  timestamp: number
  upgradedBy: string
}

export function ProxyManagement({ address }: { address: string }) {
  const [newImplementationAddress, setNewImplementationAddress] = useState<string>('')
  const [selectedProxy, setSelectedProxy] = useState<string>('')
  // proxyList状态已被finalProxyList替代，避免无限循环
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false)
  const [showUpgradeForm, setShowUpgradeForm] = useState<boolean>(false)
  const [showHistory, setShowHistory] = useState<boolean>(false)
  const [versionHistory, setVersionHistory] = useState<VersionInfo[]>([])
  const [isCounterContract, setIsCounterContract] = useState<boolean>(false)

  const { writeContract, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  // 读取合约所有者
  const { data: contractOwner } = useReadContract({
    address: RWAUpgradeableProxy_ADDRESS,
    abi: RWAUpgradeableProxy_ABI,
    functionName: 'owner',
    query: {
      enabled: !!RWAUpgradeableProxy_ADDRESS,
    }
  })

  // 读取代理数量
  const { data: proxyCount, refetch: refetchProxyCount } = useReadContract({
    address: RWAUpgradeableProxy_ADDRESS,
    abi: RWAUpgradeableProxy_ABI,
    functionName: 'getProxyCount',
    query: {
      enabled: !!RWAUpgradeableProxy_ADDRESS,
    }
  })

  // 获取前几个代理地址（需要uint256索引参数）
  const { data: proxyAddress0 } = useReadContract({
    address: RWAUpgradeableProxy_ADDRESS,
    abi: RWAUpgradeableProxy_ABI,
    functionName: 'proxyAddresses',
    args: [0n],
    query: {
      enabled: !!RWAUpgradeableProxy_ADDRESS,
    }
  })

  const { data: proxyAddress1 } = useReadContract({
    address: RWAUpgradeableProxy_ADDRESS,
    abi: RWAUpgradeableProxy_ABI,
    functionName: 'proxyAddresses',
    args: [1n],
    query: {
      enabled: !!RWAUpgradeableProxy_ADDRESS,
    }
  })

  const { data: proxyAddress2 } = useReadContract({
    address: RWAUpgradeableProxy_ADDRESS,
    abi: RWAUpgradeableProxy_ABI,
    functionName: 'proxyAddresses',
    args: [2n],
    query: {
      enabled: !!RWAUpgradeableProxy_ADDRESS,
    }
  })

  // 获取所有代理地址
  const allProxyAddresses = [
    proxyAddress0,
    proxyAddress1,
    proxyAddress2
  ].filter(addr => addr !== undefined && addr !== null && addr !== '') as string[]

  // 获取每个代理的实现地址
  const { data: impl0 } = useReadContract({
    address: proxyAddress0 as `0x${string}`,
    abi: [{"inputs":[],"name":"implementation","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}],
    functionName: 'implementation',
    query: {
      enabled: !!proxyAddress0,
    }
  })

  const { data: impl1 } = useReadContract({
    address: proxyAddress1 as `0x${string}`,
    abi: [{"inputs":[],"name":"implementation","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}],
    functionName: 'implementation',
    query: {
      enabled: !!proxyAddress1,
    }
  })

  const { data: impl2 } = useReadContract({
    address: proxyAddress2 as `0x${string}`,
    abi: [{"inputs":[],"name":"implementation","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}],
    functionName: 'implementation',
    query: {
      enabled: !!proxyAddress2,
    }
  })

  // 获取每个代理的当前版本
  const { data: version0 } = useReadContract({
    address: RWAUpgradeableProxy_ADDRESS,
    abi: RWAUpgradeableProxy_ABI,
    functionName: 'getCurrentVersion',
    args: [proxyAddress0 as `0x${string}`],
    query: {
      enabled: !!proxyAddress0,
    }
  })

  const { data: version1 } = useReadContract({
    address: RWAUpgradeableProxy_ADDRESS,
    abi: RWAUpgradeableProxy_ABI,
    functionName: 'getCurrentVersion',
    args: [proxyAddress1 as `0x${string}`],
    query: {
      enabled: !!proxyAddress1,
    }
  })

  const { data: version2 } = useReadContract({
    address: RWAUpgradeableProxy_ADDRESS,
    abi: RWAUpgradeableProxy_ABI,
    functionName: 'getCurrentVersion',
    args: [proxyAddress2 as `0x${string}`],
    query: {
      enabled: !!proxyAddress2,
    }
  })

  // 获取实现地址映射
  const implementationMap = {
    [String(proxyAddress0)]: impl0,
    [String(proxyAddress1)]: impl1,
    [String(proxyAddress2)]: impl2,
  }

  // 获取版本映射
  const versionMap = {
    [String(proxyAddress0)]: version0,
    [String(proxyAddress1)]: version1,
    [String(proxyAddress2)]: version2,
  }

  // 检查Counter代理的初始化状态
  const { data: count0 } = useReadContract({
    address: proxyAddress0 as `0x${string}`,
    abi: [{"inputs":[],"name":"getCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}],
    functionName: 'getCount',
    query: {
      enabled: !!proxyAddress0 && impl0, // 只有在确定是Counter合约时才查询
    }
  })

  const { data: count1 } = useReadContract({
    address: proxyAddress1 as `0x${string}`,
    abi: [{"inputs":[],"name":"getCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}],
    functionName: 'getCount',
    query: {
      enabled: !!proxyAddress1 && impl1, // 只有在确定是Counter合约时才查询
    }
  })

  const { data: count2 } = useReadContract({
    address: proxyAddress2 as `0x${string}`,
    abi: [{"inputs":[],"name":"getCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}],
    functionName: 'getCount',
    query: {
      enabled: !!proxyAddress2 && impl2, // 只有在确定是Counter合约时才查询
    }
  })

  // Counter状态映射
  const counterStateMap = {
    [String(proxyAddress0)]: count0,
    [String(proxyAddress1)]: count1,
    [String(proxyAddress2)]: count2,
  }

  // 使用useMemo计算代理列表，避免无限循环
  const computedProxyList = useMemo(() => {
    console.log('🔍 计算代理列表...')
    console.log('  proxyCount:', proxyCount)
    console.log('  proxyAddress0:', proxyAddress0)
    console.log('  proxyAddress1:', proxyAddress1)
    console.log('  proxyAddress2:', proxyAddress2)
    console.log('  allProxyAddresses:', allProxyAddresses)
    console.log('  implementationMap:', implementationMap)
    console.log('  versionMap:', versionMap)
    console.log('  counterStateMap:', counterStateMap)
    
    if (allProxyAddresses.length === 0) {
      console.log('⚠️ 没有找到代理地址')
      console.log('  原始地址数组:', [proxyAddress0, proxyAddress1, proxyAddress2])
      console.log('  过滤后的地址数组:', allProxyAddresses)
      return []
    }
    
    const proxies: ProxyInfo[] = allProxyAddresses.map((proxyAddress, index) => {
      const implementation = implementationMap[String(proxyAddress)] || ''
      const version = versionMap[String(proxyAddress)] || 1n
      const count = counterStateMap[String(proxyAddress)]
      const isCounter = implementation && (
        implementation.toLowerCase().includes('counter') ||
        implementation.toLowerCase().includes('v1')
      )
      
      console.log(`📍 代理${index}:`, {
        address: proxyAddress,
        implementation: implementation,
        version: Number(version),
        count: count,
        isCounter: isCounter,
        needsInitialization: isCounter && count === 0n
      })
      
      return {
        address: proxyAddress,
        implementation: implementation,
        version: Number(version), // 使用实际版本
        timestamp: Date.now(),
        needsInitialization: isCounter && count === 0n // Counter合约但count为0说明需要初始化
      }
    })
    
    console.log('✅ 计算完成代理列表:', proxies)
    return proxies
  }, [allProxyAddresses.length, proxyAddress0, proxyAddress1, proxyAddress2, impl0, impl1, impl2, version0, version1, version2, count0, count1, count2])

  // 直接使用计算出的代理列表，避免状态更新和无限循环
  const finalProxyList = computedProxyList

  // 获取版本历史
  const { data: versionHistoryData, refetch: refetchVersionHistory } = useReadContract({
    address: RWAUpgradeableProxy_ADDRESS,
    abi: RWAUpgradeableProxy_ABI,
    functionName: 'getVersionHistory',
    args: selectedProxy ? [selectedProxy as `0x${string}`] : undefined,
    query: {
      enabled: !!RWAUpgradeableProxy_ADDRESS && !!selectedProxy && showHistory,
    }
  })

  // 更新版本历史
  useEffect(() => {
    if (versionHistoryData && Array.isArray(versionHistoryData)) {
      const history = versionHistoryData.map((item: any) => ({
        implementation: item.implementation,
        version: Number(item.version),
        timestamp: Number(item.timestamp),
        upgradedBy: item.upgradedBy
      }))
      setVersionHistory(history)
    }
  }, [versionHistoryData, selectedProxy, showHistory])

  // 创建新代理
  const handleCreateProxy = async () => {
    if (!newImplementationAddress) {
      alert('请输入实现合约地址')
      return
    }

    console.log('🔧 开始创建代理合约:')
    console.log('  实现合约地址:', newImplementationAddress)
    console.log('  操作者:', address)

    try {
      // 根据用户选择确定初始化数据
      let initData = '0x' // 默认空初始化数据
      
      if (isCounterContract) {
        initData = '0x8129fc1c' // CounterV1.initialize() selector
        console.log('🔧 用户选择Counter合约，使用初始化数据')
      } else {
        console.log('🔧 使用标准初始化数据')
      }
      
      writeContract({
        address: RWAUpgradeableProxy_ADDRESS as `0x${string}`,
        abi: RWAUpgradeableProxy_ABI,
        functionName: 'createProxy',
        args: [newImplementationAddress as `0x${string}`, initData],
      })
      
      console.log('✅ 代理创建交易已发送到区块链，等待确认...')
      
    } catch (error) {
      console.error('❌ 创建代理失败:', error)
      alert('创建代理失败，请检查控制台日志')
    }
  }

  // 升级代理
  const handleUpgradeProxy = async () => {
    if (!selectedProxy || !newImplementationAddress) {
      alert('请选择代理并输入新的实现合约地址')
      return
    }

    console.log('🔄 开始记录代理升级信息:')
    console.log('  代理地址:', selectedProxy)
    console.log('  新实现地址:', newImplementationAddress)
    console.log('  操作者:', address)

    try {
      // 在管理合约中执行升级
      writeContract({
        address: RWAUpgradeableProxy_ADDRESS as `0x${string}`,
        abi: RWAUpgradeableProxy_ABI,
        functionName: 'upgrade',
        args: [selectedProxy as `0x${string}`, newImplementationAddress as `0x${string}`],
      })
      
      console.log('✅ 代理升级记录已发送，等待确认...')
      
    } catch (error) {
      console.error('❌ 记录升级信息失败:', error)
      alert('记录升级信息失败，请检查控制台日志')
    }
  }

  // 交易确认后刷新数据
  useEffect(() => {
    if (isConfirmed && hash) {
      console.log('✅ 代理管理交易已确认，交易哈希:', hash)
      console.log('🔄 刷新数据...')
      
      setTimeout(() => {
        refetchProxyCount()
        console.log('📊 代理数量刷新')
        
        if (selectedProxy) {
          refetchVersionHistory()
        }
        
        // 重置表单状态
        setShowCreateForm(false)
        setShowUpgradeForm(false)
        setNewImplementationAddress('')
        setIsCounterContract(false)
        
        console.log('✅ 代理管理数据刷新完成')
      }, 2000)
    }
  }, [isConfirmed, hash, refetchProxyCount, refetchVersionHistory, selectedProxy])

  // 检查权限
  const hasPermission = contractOwner && String(contractOwner).toLowerCase() === address.toLowerCase()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">代理数量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">
              {proxyCount ? proxyCount.toString() : '0'}
            </div>
            <p className="text-sm text-gray-600">已创建代理</p>
            <Badge variant="outline" className="mt-2">
              ERC1967 标准
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">升级权限</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium text-cyan-600">
              {hasPermission ? '管理员' : '无权限'}
            </div>
            <p className="text-sm text-gray-600">
              {contractOwner ? String(contractOwner).slice(0, 6) + '...' + String(contractOwner).slice(-4) : '加载中...'}
            </p>
            <Badge variant={hasPermission ? "default" : "secondary"} className="mt-2">
              {hasPermission ? '有权限' : '无权限'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">合约状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium text-green-600">
              {RWAUpgradeableProxy_ADDRESS ? '已部署' : '未部署'}
            </div>
            <p className="text-sm text-gray-600">代理管理器</p>
            <Badge variant="outline" className="mt-2">
              可升级
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>代理合约管理</CardTitle>
              <CardDescription>创建和管理可升级代理合约 (最多支持5个代理)</CardDescription>
            </div>
            <Link href="/stage3/proxy-demo" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                🔄 Counter升级演示
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 操作按钮区域 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => {
                  setShowCreateForm(!showCreateForm)
                  setShowUpgradeForm(false)
                  setShowHistory(false)
                }}
                disabled={!hasPermission || isPending || isConfirming}
                className="w-full"
              >
                {showCreateForm ? '取消创建' : '创建代理'}
              </Button>
              
              <Button 
                onClick={() => {
                  setShowUpgradeForm(!showUpgradeForm)
                  setShowCreateForm(false)
                  setShowHistory(false)
                }}
                disabled={!hasPermission || proxyCount === 0n || isPending || isConfirming}
                variant="outline"
                className="w-full"
              >
                {showUpgradeForm ? '取消升级' : '升级代理'}
              </Button>
              
              <Button 
                onClick={() => {
                  setShowHistory(!showHistory)
                  setShowCreateForm(false)
                  setShowUpgradeForm(false)
                }}
                disabled={proxyCount === 0n}
                variant="outline"
                className="w-full"
              >
                {showHistory ? '隐藏历史' : '查看升级历史'}
              </Button>
            </div>

            {/* 创建代理表单 */}
            {showCreateForm && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3">创建新代理合约</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="implementation" className="text-sm font-medium">
                      实现合约地址
                    </Label>
                    <Input
                      id="implementation"
                      placeholder="0x..."
                      value={newImplementationAddress}
                      onChange={(e) => setNewImplementationAddress(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isCounter"
                      checked={isCounterContract}
                      onChange={(e) => setIsCounterContract(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="isCounter" className="text-sm font-medium">
                      这是Counter合约 (需要初始化)
                    </Label>
                  </div>
                  {isCounterContract && (
                    <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                      💡 如果创建Counter合约代理，系统会自动调用initialize()函数进行初始化
                    </div>
                  )}
                  <Button 
                    onClick={handleCreateProxy}
                    disabled={!newImplementationAddress || isPending || isConfirming}
                    size="sm"
                  >
                    {isPending ? '创建中...' : isConfirming ? '确认中...' : '创建代理'}
                  </Button>
                </div>
              </div>
            )}

            {/* 升级代理表单 */}
            {showUpgradeForm && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-3">升级代理合约</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="proxy-select" className="text-sm font-medium">
                      选择代理合约
                    </Label>
                    <select
                      id="proxy-select"
                      value={selectedProxy}
                      onChange={(e) => setSelectedProxy(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">请选择代理合约</option>
                      {finalProxyList.map((proxy) => (
                        <option key={proxy.address} value={proxy.address}>
                          {proxy.address.slice(0, 8)}...{proxy.address.slice(-6)} (v{proxy.version})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="new-implementation" className="text-sm font-medium">
                      新实现合约地址
                    </Label>
                    <Input
                      id="new-implementation"
                      placeholder="0x..."
                      value={newImplementationAddress}
                      onChange={(e) => setNewImplementationAddress(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={handleUpgradeProxy}
                    disabled={!selectedProxy || !newImplementationAddress || isPending || isConfirming}
                    size="sm"
                  >
                    {isPending ? '升级中...' : isConfirming ? '确认中...' : '升级代理'}
                  </Button>
                  </div>
              </div>
            )}

            {/* 升级历史 */}
            {showHistory && selectedProxy && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-3">
                  升级历史 - {selectedProxy.slice(0, 8)}...{selectedProxy.slice(-6)}
                </h4>
                {versionHistory.length > 0 ? (
                  <div className="space-y-2">
                    {versionHistory.map((version, index) => (
                      <div key={index} className="p-3 bg-white rounded border">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">版本 {version.version}</span>
                          <Badge variant="outline">v{version.version}</Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <div>实现地址: {version.implementation.slice(0, 10)}...{version.implementation.slice(-8)}</div>
                          <div>升级者: {version.upgradedBy.slice(0, 6)}...{version.upgradedBy.slice(-4)}</div>
                          <div>时间: {new Date(version.timestamp * 1000).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">暂无升级历史</p>
                )}
              </div>
            )}

            {/* 代理列表 */}
            {finalProxyList.length > 0 && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">代理合约列表</h4>
                <div className="space-y-2">
                  {finalProxyList.map((proxy) => (
                    <div key={proxy.address} className="p-3 bg-white rounded border flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{proxy.address.slice(0, 10)}...{proxy.address.slice(-8)}</div>
                        <div className="text-sm text-gray-600">
                          实现: {proxy.implementation ? `${proxy.implementation.slice(0, 10)}...${proxy.implementation.slice(-8)}` : '未知'}
                        </div>
                        <div className="text-sm text-gray-500">版本: v{proxy.version}</div>
                        {proxy.implementation && (
                          <div className="text-sm">
                            {proxy.implementation.toLowerCase().includes('counter') ? (
                              <span className="text-blue-600">🔢 Counter合约</span>
                            ) : (
                              <span className="text-gray-500">标准合约</span>
                            )}
                            {proxy.needsInitialization && (
                              <span className="text-orange-600 ml-2">⚠️ 需要初始化</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">v{proxy.version}</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (showHistory && selectedProxy === proxy.address) {
                              setShowHistory(false)
                              setSelectedProxy('')
                            } else {
                              setSelectedProxy(proxy.address)
                              setShowHistory(true)
                            }
                          }}
                        >
                          {showHistory && selectedProxy === proxy.address ? '隐藏历史' : '查看历史'}
                        </Button>
                        {/* 如果是Counter代理，提供测试链接 */}
                        {proxy.implementation.toLowerCase().includes('counter') && (
                          <>
                            <Link href={`/stage3/proxy-demo?proxy=${proxy.address}`} target="_blank">
                              <Button size="sm" variant="outline">
                                🧪 测试Counter
                              </Button>
                            </Link>
                            {proxy.needsInitialization && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  // 复制代理地址到剪贴板，提示用户去demo页面初始化
                                  navigator.clipboard.writeText(proxy.address)
                                  alert(`已复制代理地址 ${proxy.address.slice(0, 10)}... 请在Counter升级演示页面进行初始化`)
                                }}
                              >
                                📋 复制地址
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isConfirming && (
              <div className="text-center text-blue-600">
                ⏳ 交易确认中，请稍候...
              </div>
            )}

            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <p><strong>合约地址:</strong> {RWAUpgradeableProxy_ADDRESS || '未配置'}</p>
              <p><strong>状态:</strong> {RWAUpgradeableProxy_ADDRESS ? '已配置' : '未配置'}</p>
              {!hasPermission && (
                <p className="text-orange-600 mt-2">
                  ⚠️ 当前用户不是合约所有者，无法执行管理操作
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}