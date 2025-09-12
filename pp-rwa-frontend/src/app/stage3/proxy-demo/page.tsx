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

interface CounterState {
  count: number
  v2Prop: number
  version: string
  implementation: string
}

export default function CounterDemoPage() {
  const { isConnected, address } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [counterV1Address, setCounterV1Address] = useState<string>('')
  const [counterV2Address, setCounterV2Address] = useState<string>('')
  const [proxyAddress, setProxyAddress] = useState<string>('')
  const [counterState, setCounterState] = useState<CounterState>({
    count: 0,
    v2Prop: 0,
    version: 'V1',
    implementation: ''
  })
  const [demoStep, setDemoStep] = useState<number>(1)
  const [isUpgraded, setIsUpgraded] = useState<boolean>(false)

  const { writeContract, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    setMounted(true)
  }, [])

  // 读取合约所有者
  const { data: contractOwner } = useReadContract({
    address: RWAUpgradeableProxy_ADDRESS,
    abi: RWAUpgradeableProxy_ABI,
    functionName: 'owner',
    query: {
      enabled: !!RWAUpgradeableProxy_ADDRESS,
    }
  })

  // 检查权限
  const hasPermission = contractOwner && String(contractOwner).toLowerCase() === address?.toLowerCase()

  // 创建CounterV1代理
  const handleCreateCounterV1 = async () => {
    if (!counterV1Address) {
      alert('请输入CounterV1合约地址')
      return
    }

    try {
      const initData = '0x8129fc1c' // CounterV1.initialize() selector
      
      writeContract({
        address: RWAUpgradeableProxy_ADDRESS as `0x${string}`,
        abi: RWAUpgradeableProxy_ABI,
        functionName: 'createProxy',
        args: [counterV1Address as `0x${string}`, initData],
      })
      
      console.log('✅ CounterV1代理创建交易已发送')
    } catch (error) {
      console.error('❌ 创建CounterV1代理失败:', error)
      alert('创建CounterV1代理失败')
    }
  }

  // 升级到CounterV2
  const handleUpgradeToV2 = async () => {
    if (!proxyAddress || !counterV2Address) {
      alert('请输入代理地址和CounterV2合约地址')
      return
    }

    try {
      writeContract({
        address: RWAUpgradeableProxy_ADDRESS as `0x${string}`,
        abi: RWAUpgradeableProxy_ABI,
        functionName: 'upgrade',
        args: [proxyAddress as `0x${string}`, counterV2Address as `0x${string}`],
      })
      
      console.log('✅ 升级到CounterV2交易已发送')
    } catch (error) {
      console.error('❌ 升级到CounterV2失败:', error)
      alert('升级到CounterV2失败')
    }
  }

  // 初始化CounterV2
  const handleInitializeV2 = async () => {
    if (!proxyAddress) return

    try {
      // 这里需要通过代理调用initializeV2
      const initData = '0x5cd8a76b' // CounterV2.initializeV2() selector
      
      writeContract({
        address: proxyAddress as `0x${string}`,
        abi: [
          {
            "inputs": [],
            "name": "initializeV2",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: 'initializeV2',
      })
      
      console.log('✅ 初始化CounterV2交易已发送')
    } catch (error) {
      console.error('❌ 初始化CounterV2失败:', error)
      alert('初始化CounterV2失败')
    }
  }

  // 调用Counter的next方法
  const handleCallNext = async () => {
    if (!proxyAddress) return

    try {
      writeContract({
        address: proxyAddress as `0x${string}`,
        abi: [
          {
            "inputs": [],
            "name": "next",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: 'next',
      })
      
      console.log('✅ Counter.next() 调用已发送')
    } catch (error) {
      console.error('❌ 调用Counter.next()失败:', error)
      alert('调用Counter.next()失败')
    }
  }

  // 调用CounterV2的multi方法
  const handleCallMulti = async (multiplier: number) => {
    if (!proxyAddress) return

    try {
      writeContract({
        address: proxyAddress as `0x${string}`,
        abi: [
          {
            "inputs": [
              {
                "internalType": "uint256",
                "name": "multiplier",
                "type": "uint256"
              }
            ],
            "name": "multi",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: 'multi',
        args: [BigInt(multiplier)],
      })
      
      console.log('✅ Counter.multi() 调用已发送')
    } catch (error) {
      console.error('❌ 调用Counter.multi()失败:', error)
      alert('调用Counter.multi()失败')
    }
  }

  // 读取Counter状态
  const { data: countData, refetch: refetchCount } = useReadContract({
    address: proxyAddress as `0x${string}`,
    abi: [
      {
        "inputs": [],
        "name": "getCount",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'getCount',
    query: {
      enabled: !!proxyAddress,
    }
  })

  const { data: v2PropData, refetch: refetchV2Prop } = useReadContract({
    address: proxyAddress as `0x${string}`,
    abi: [
      {
        "inputs": [],
        "name": "getV2Prop",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'getV2Prop',
    query: {
      enabled: !!proxyAddress && isUpgraded,
    }
  })

  // 更新Counter状态
  useEffect(() => {
    if (countData !== undefined) {
      setCounterState(prev => ({
        ...prev,
        count: Number(countData)
      }))
    }
    if (v2PropData !== undefined) {
      setCounterState(prev => ({
        ...prev,
        v2Prop: Number(v2PropData)
      }))
    }
  }, [countData, v2PropData])

  // 交易确认后刷新状态
  useEffect(() => {
    if (isConfirmed && hash) {
      setTimeout(() => {
        refetchCount()
        refetchV2Prop()
        
        // 更新演示步骤和状态
        if (demoStep === 1) {
          setDemoStep(2)
        } else if (demoStep === 3) {
          setDemoStep(4)
          setIsUpgraded(true)
          setCounterState(prev => ({
            ...prev,
            version: 'V2',
            implementation: counterV2Address
          }))
        }
      }, 2000)
    }
  }, [isConfirmed, hash, demoStep, counterV2Address])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p>正在加载...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Counter合约升级演示
          </h1>
          <p className="text-xl text-gray-600">
            展示可升级代理合约的完整升级流程
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
                    请连接您的Web3钱包以参与Counter合约升级演示
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
                      <CardTitle>演示进度</CardTitle>
                      <CardDescription>当前步骤</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className={`p-3 rounded-lg ${demoStep >= 1 ? 'bg-green-100 border-green-300' : 'bg-gray-100'}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">步骤 1</span>
                            <Badge variant={demoStep >= 1 ? "default" : "secondary"}>
                              {demoStep >= 1 ? '✓' : '1'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">部署CounterV1代理</div>
                        </div>
                        
                        <div className={`p-3 rounded-lg ${demoStep >= 2 ? 'bg-green-100 border-green-300' : 'bg-gray-100'}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">步骤 2</span>
                            <Badge variant={demoStep >= 2 ? "default" : "secondary"}>
                              {demoStep >= 2 ? '✓' : '2'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">测试V1功能</div>
                        </div>
                        
                        <div className={`p-3 rounded-lg ${demoStep >= 3 ? 'bg-green-100 border-green-300' : 'bg-gray-100'}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">步骤 3</span>
                            <Badge variant={demoStep >= 3 ? "default" : "secondary"}>
                              {demoStep >= 3 ? '✓' : '3'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">升级到CounterV2</div>
                        </div>
                        
                        <div className={`p-3 rounded-lg ${demoStep >= 4 ? 'bg-green-100 border-green-300' : 'bg-gray-100'}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">步骤 4</span>
                            <Badge variant={demoStep >= 4 ? "default" : "secondary"}>
                              {demoStep >= 4 ? '✓' : '4'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">测试V2功能</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>当前状态</CardTitle>
                      <CardDescription>Counter合约状态</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">版本</span>
                          <Badge variant="outline">{counterState.version}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">计数器值</span>
                          <span className="font-mono text-lg">{counterState.count}</span>
                        </div>
                        {isUpgraded && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm">V2属性</span>
                            <span className="font-mono text-lg">{counterState.v2Prop}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm">升级状态</span>
                          <Badge variant={isUpgraded ? "default" : "secondary"}>
                            {isUpgraded ? '已升级' : '未升级'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-3">
                  <div className="space-y-6">
                    {/* 步骤1：部署CounterV1 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          🔢 步骤 1: 部署CounterV1代理
                        </CardTitle>
                        <CardDescription>
                          创建基于CounterV1实现的代理合约
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="counterV1">CounterV1合约地址</Label>
                              <Input
                                id="counterV1"
                                placeholder="0x..."
                                value={counterV1Address}
                                onChange={(e) => setCounterV1Address(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="proxy-result">代理地址（创建后显示）</Label>
                              <Input
                                id="proxy-result"
                                value={proxyAddress}
                                readOnly
                                placeholder="等待创建..."
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={handleCreateCounterV1}
                              disabled={!counterV1Address || !hasPermission || isPending || isConfirming}
                            >
                              {isPending ? '创建中...' : isConfirming ? '确认中...' : '创建CounterV1代理'}
                            </Button>
                            {demoStep >= 1 && (
                              <Badge variant="default">✓ 已完成</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                            <p><strong>CounterV1功能:</strong></p>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>next() 方法：计数器加1</li>
                              <li>getCount() 方法：获取当前计数器值</li>
                              <li>继承UUPSUpgradeable，支持升级</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 步骤2：测试V1功能 */}
                    {demoStep >= 1 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            🧪 步骤 2: 测试CounterV1功能
                          </CardTitle>
                          <CardDescription>
                            在升级前测试CounterV1的基本功能
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="p-4 bg-blue-50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-blue-600">{counterState.count}</div>
                                <div className="text-sm text-blue-600">当前计数</div>
                              </div>
                              <div className="p-4 bg-green-50 rounded-lg text-center">
                                <div className="text-lg font-medium text-green-600">V1</div>
                                <div className="text-sm text-green-600">当前版本</div>
                              </div>
                              <div className="p-4 bg-purple-50 rounded-lg text-center">
                                <div className="text-lg font-medium text-purple-600">+1</div>
                                <div className="text-sm text-purple-600">每次增加</div>
                              </div>
                            </div>
                            <Button 
                              onClick={handleCallNext}
                              disabled={!proxyAddress || isPending || isConfirming}
                              className="w-full"
                            >
                              调用 next() 方法
                            </Button>
                            {demoStep >= 2 && (
                              <div className="text-center">
                                <Badge variant="default">✓ V1功能测试完成</Badge>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* 步骤3：升级到CounterV2 */}
                    {demoStep >= 2 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            🔄 步骤 3: 升级到CounterV2
                          </CardTitle>
                          <CardDescription>
                            将代理升级到CounterV2实现
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="counterV2">CounterV2合约地址</Label>
                                <Input
                                  id="counterV2"
                                  placeholder="0x..."
                                  value={counterV2Address}
                                  onChange={(e) => setCounterV2Address(e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="upgrade-status">升级状态</Label>
                                <div className="mt-1">
                                  <Badge variant={isUpgraded ? "default" : "secondary"}>
                                    {isUpgraded ? '✓ 已升级到V2' : '等待升级'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                onClick={handleUpgradeToV2}
                                disabled={!counterV2Address || !hasPermission || isPending || isConfirming}
                                variant="outline"
                              >
                                {isPending ? '升级中...' : isConfirming ? '确认中...' : '升级到CounterV2'}
                              </Button>
                              {isUpgraded && (
                                <Button 
                                  onClick={handleInitializeV2}
                                  disabled={isPending || isConfirming}
                                  variant="default"
                                >
                                  初始化V2状态
                                </Button>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 bg-orange-50 p-3 rounded-lg">
                              <p><strong>CounterV2新增功能:</strong></p>
                              <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>next() 方法：计数器加2（升级后）</li>
                                <li>multi() 方法：v2Prop属性倍乘</li>
                                <li>getV2Prop() 方法：获取v2Prop值</li>
                                <li>新增v2Prop状态变量</li>
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* 步骤4：测试V2功能 */}
                    {isUpgraded && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            ✨ 步骤 4: 测试CounterV2功能
                          </CardTitle>
                          <CardDescription>
                            验证升级后的新功能和状态保持
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="p-4 bg-blue-50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-blue-600">{counterState.count}</div>
                                <div className="text-sm text-blue-600">计数器值</div>
                              </div>
                              <div className="p-4 bg-green-50 rounded-lg text-center">
                                <div className="text-lg font-medium text-green-600">V2</div>
                                <div className="text-sm text-green-600">当前版本</div>
                              </div>
                              <div className="p-4 bg-purple-50 rounded-lg text-center">
                                <div className="text-lg font-medium text-purple-600">+2</div>
                                <div className="text-sm text-purple-600">每次增加</div>
                              </div>
                              <div className="p-4 bg-orange-50 rounded-lg text-center">
                                <div className="text-lg font-medium text-orange-600">{counterState.v2Prop}</div>
                                <div className="text-sm text-orange-600">V2属性值</div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Button 
                                onClick={handleCallNext}
                                disabled={isPending || isConfirming}
                              >
                                调用 next() (现在加2)
                              </Button>
                              <div className="space-y-2">
                                <Button 
                                  onClick={() => handleCallMulti(2)}
                                  disabled={isPending || isConfirming}
                                  variant="outline"
                                  className="w-full"
                                >
                                  multi(2) - v2Prop × 2
                                </Button>
                                <Button 
                                  onClick={() => handleCallMulti(3)}
                                  disabled={isPending || isConfirming}
                                  variant="outline"
                                  className="w-full"
                                >
                                  multi(3) - v2Prop × 3
                                </Button>
                              </div>
                            </div>
                            
                            {demoStep >= 4 && (
                              <div className="text-center p-4 bg-green-50 rounded-lg border-green-300">
                                <Badge variant="default" className="text-lg px-4 py-2">
                                  🎉 完整升级演示完成！
                                </Badge>
                                <p className="text-sm text-gray-600 mt-2">
                                  状态保持：{counterState.count} | 
                                  V2功能：✓ | 
                                  新属性：{counterState.v2Prop}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* 返回按钮 */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <Link href="/stage3">
                            <Button variant="outline">
                              ← 返回Stage3主页面
                            </Button>
                          </Link>
                          <div className="text-sm text-gray-500">
                            {hasPermission ? '✓ 有管理权限' : '⚠️ 无管理权限'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}