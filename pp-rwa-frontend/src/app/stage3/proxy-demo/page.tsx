'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent } from 'wagmi'
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

interface VersionInfo {
  implementation: string
  version: number
  timestamp: number
  upgradedBy: string
}

// 版本配置映射 - 可以扩展更多版本
const VERSION_CONFIG = {
  1: {
    name: 'V1',
    description: '基础计数器功能',
    features: ['next() 方法：计数器加1', 'getCount() 方法：获取当前值'],
    initSelector: '0x8129fc1c', // CounterV1.initialize()
    address: '0x2E2Ed0Cfd3AD2f1d34481277b3204d807Ca2F8c2' // 可以从配置文件或环境变量读取
  },
  2: {
    name: 'V2', 
    description: '增强计数器功能',
    features: ['next() 方法：计数器加2', 'multi() 方法：倍乘功能', 'getV2Prop() 方法：获取V2属性'],
    initSelector: '0x5cd8a76b', // CounterV2.initializeV2()
    address: '0xD8a5a9b31c3C0232e196d518E89Fd8bF83AcAd43' // 可以从配置文件或环境变量读取
  },
  // 未来可以轻松添加V3、V4等
} as const

type VersionNumber = keyof typeof VERSION_CONFIG

// 实用函数：获取版本配置
function getVersionConfig(version: number) {
  return VERSION_CONFIG[version as VersionNumber] || null
}

// 实用函数：获取下一个版本
function getNextVersion(currentVersion: number): number | null {
  const versions = Object.keys(VERSION_CONFIG).map(Number).sort((a, b) => a - b)
  const currentIndex = versions.indexOf(currentVersion)
  return currentIndex < versions.length - 1 ? versions[currentIndex + 1] : null
}

// 实用函数：获取最高版本
function getLatestVersion(): number {
  return Math.max(...Object.keys(VERSION_CONFIG).map(Number))
}

export default function CounterDemoPage() {
  const { isConnected, address } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [proxyAddress, setProxyAddress] = useState<string>('')
  const [versionHistory, setVersionHistory] = useState<VersionInfo[]>([])
  const [currentVersion, setCurrentVersion] = useState<number>(0)
  
  // 从URL参数获取代理地址
  useEffect(() => {
    if (mounted) {
      const urlParams = new URLSearchParams(window.location.search)
      const proxyParam = urlParams.get('proxy')
      if (proxyParam) {
        setProxyAddress(proxyParam)
        setDemoStep(1)
        console.log('✅ 从URL参数获取代理地址:', proxyParam)
      }
    }
  }, [mounted])
  const [counterState, setCounterState] = useState<CounterState>({
    count: 0,
    v2Prop: 0,
    version: 'V1',
    implementation: ''
  })
  const [demoStep, setDemoStep] = useState<number>(1)
  const [isUpgraded, setIsUpgraded] = useState<boolean>(false)
  const [v2PropInput, setV2PropInput] = useState<string>('')
  const [isInitializingV2, setIsInitializingV2] = useState<boolean>(false)

  const { writeContract, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  // 监听代理创建事件
  useWatchContractEvent({
    address: RWAUpgradeableProxy_ADDRESS,
    abi: RWAUpgradeableProxy_ABI,
    eventName: 'ProxyCreated',
    onLogs(logs) {
      console.log('📡 收到代理创建事件:', logs)
      if (logs && logs.length > 0) {
        const latestLog = logs[logs.length - 1]
        const proxyAddress = latestLog.args.proxy
        if (proxyAddress) {
          setProxyAddress(String(proxyAddress))
          setDemoStep(1)
          console.log('✅ 自动设置代理地址:', proxyAddress)
        }
      }
    },
  })

  // 自动检测已有的代理
  const { data: proxyCount } = useReadContract({
    address: RWAUpgradeableProxy_ADDRESS,
    abi: RWAUpgradeableProxy_ABI,
    functionName: 'getProxyCount',
    query: {
      enabled: !!RWAUpgradeableProxy_ADDRESS,
    }
  })

  // 获取第一个代理地址
  const { data: firstProxyAddress } = useReadContract({
    address: RWAUpgradeableProxy_ADDRESS,
    abi: RWAUpgradeableProxy_ABI,
    functionName: 'proxyAddresses',
    args: [0n],
    query: {
      enabled: !!RWAUpgradeableProxy_ADDRESS && proxyCount && proxyCount > 0n && !proxyAddress,
    }
  })

  // 获取第二个代理地址（如果存在）
  const { data: secondProxyAddress } = useReadContract({
    address: RWAUpgradeableProxy_ADDRESS,
    abi: RWAUpgradeableProxy_ABI,
    functionName: 'proxyAddresses',
    args: [1n],
    query: {
      enabled: !!RWAUpgradeableProxy_ADDRESS && proxyCount && proxyCount > 1n && !proxyAddress,
    }
  })

  // 如果有代理但未设置，自动设置第一个代理
  useEffect(() => {
    console.log('🔍 代理地址检测:')
    console.log('  firstProxyAddress:', firstProxyAddress)
    console.log('  secondProxyAddress:', secondProxyAddress)
    console.log('  当前proxyAddress:', proxyAddress)
    console.log('  proxyCount:', proxyCount)
    
    if (firstProxyAddress && !proxyAddress) {
      setProxyAddress(String(firstProxyAddress))
      setDemoStep(1)
      console.log('✅ 自动检测到现有代理:', firstProxyAddress)
    } else if (secondProxyAddress && !proxyAddress) {
      setProxyAddress(String(secondProxyAddress))
      setDemoStep(1)
      console.log('✅ 自动检测到第二个代理:', secondProxyAddress)
    }
  }, [firstProxyAddress, secondProxyAddress, proxyAddress, proxyCount])

  // 获取版本历史信息
  const { data: versionHistoryData, refetch: refetchVersionHistory } = useReadContract({
    address: RWAUpgradeableProxy_ADDRESS,
    abi: RWAUpgradeableProxy_ABI,
    functionName: 'getVersionHistory',
    args: [proxyAddress as `0x${string}`],
    query: {
      enabled: !!proxyAddress,
    }
  })

  // 获取当前版本号
  const { data: currentVersionData, refetch: refetchCurrentVersion } = useReadContract({
    address: RWAUpgradeableProxy_ADDRESS,
    abi: RWAUpgradeableProxy_ABI,
    functionName: 'getCurrentVersion',
    args: [proxyAddress as `0x${string}`],
    query: {
      enabled: !!proxyAddress,
    }
  })

  // 获取当前实现地址（备用方法）- 处理UUPS代理可能没有标准implementation函数的情况
  const { data: directImplementation, refetch: refetchImplementation } = useReadContract({
    address: proxyAddress as `0x${string}`,
    abi: [
      {
        "inputs": [],
        "name": "implementation",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'implementation',
    query: {
      enabled: !!proxyAddress,
      retry: false, // 不重试，避免不必要的错误日志
    }
  })

  // 处理版本历史数据
  useEffect(() => {
    if (versionHistoryData && Array.isArray(versionHistoryData)) {
      const formattedHistory: VersionInfo[] = versionHistoryData.map(item => ({
        implementation: item.implementation,
        version: Number(item.version),
        timestamp: Number(item.timestamp),
        upgradedBy: item.upgradedBy
      }))
      setVersionHistory(formattedHistory)
      console.log('📜 版本历史加载完成:', formattedHistory)
    }
  }, [versionHistoryData])

  // 处理当前版本数据
  useEffect(() => {
    if (currentVersionData !== undefined) {
      setCurrentVersion(Number(currentVersionData))
      console.log('🔄 当前版本:', Number(currentVersionData))
    }
  }, [currentVersionData])

  // 获取当前实现地址
  const currentImplementation = versionHistory.length > 0 
    ? versionHistory[versionHistory.length - 1].implementation 
    : directImplementation

  // 初始化当前版本
  const handleInitializeCurrentVersion = useCallback(async () => {
    if (!proxyAddress) return

    const currentConfig = getVersionConfig(currentVersion)
    if (!currentConfig) {
      alert(`V${currentVersion}配置未找到`)
      return
    }

    try {
      // 根据版本选择初始化方法
      const abi = currentVersion === 1 ? [
        {
          "inputs": [],
          "name": "initialize",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ] : [
        {
          "inputs": [],
          "name": "initializeV2",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ]

      writeContract({
        address: proxyAddress as `0x${string}`,
        abi,
        functionName: currentVersion === 1 ? 'initialize' : 'initializeV2',
      })
      
      console.log(`✅ 初始化${currentConfig.name}交易已发送`)
      
      // 设置一个超时来重置初始化状态（防止卡在初始化中）
      setTimeout(() => {
        setIsInitializingV2(false)
        console.log('✅ 重置初始化状态标志')
      }, 5000)
    } catch (error) {
      console.error(`❌ 初始化${currentConfig.name}失败:`, error)
      alert(`初始化${currentConfig.name}失败`)
      setIsInitializingV2(false)
    }
  }, [proxyAddress, currentVersion, writeContract, setIsInitializingV2, getVersionConfig])

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

  // 读取代理的owner信息（用于测试代理是否正常工作）
  const { data: ownerData } = useReadContract({
    address: proxyAddress as `0x${string}`,
    abi: [
      {
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'owner',
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

  // 基于版本历史更新Counter状态
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    if (versionHistory.length > 0) {
      const latestVersion = versionHistory[versionHistory.length - 1]
      const isUpgraded = currentVersion > 1
      
      setIsUpgraded(isUpgraded)
      setCounterState(prev => ({
        ...prev,
        version: isUpgraded ? 'V2' : 'V1',
        implementation: latestVersion.implementation
      }))

      // 更新演示步骤
      if (isUpgraded) {
        setDemoStep(4)
        console.log('✅ 检测到已升级状态，进入步骤4')
        
        // 检查是否需要初始化V2 - 使用防抖机制避免重复检查
        const checkV2Initialization = () => {
          console.log('🔍 检查V2初始化状态:')
          console.log('  v2PropData:', v2PropData)
          console.log('  currentVersion:', currentVersion)
          console.log('  isUpgraded:', isUpgraded)
          console.log('  isInitializingV2:', isInitializingV2)
          
          // 防止重复初始化
          if (isInitializingV2) {
            console.log('⏳ 正在初始化V2中，跳过检查')
            return
          }
          
          // 只有在数据已加载且确实需要初始化时才调用
          if (isUpgraded && v2PropData !== undefined) {
            if (v2PropData === 0n) {
              console.log('⚠️ 检测到V2属性为0，准备调用initializeV2()...')
              setIsInitializingV2(true)
              handleInitializeCurrentVersion()
            } else {
              console.log('✅ V2属性已正确初始化，值为:', v2PropData)
              // 如果正在初始化，现在可以重置状态
              if (isInitializingV2) {
                setIsInitializingV2(false)
                console.log('✅ 检测到V2已正确初始化，重置初始化状态')
              }
            }
          } else if (isUpgraded && v2PropData === undefined) {
            console.log('⏳ V2属性数据正在加载，稍后重试...')
          }
        }
        
        // 延迟检查，确保数据已加载
        timeoutId = setTimeout(checkV2Initialization, 2000)
      } else {
        if (demoStep === 4) {
          setDemoStep(2)
        }
        console.log('✅ 检测到V1状态')
      }
    }
    
    // 清理函数
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [versionHistory, currentVersion, demoStep, v2PropData, isInitializingV2, handleInitializeCurrentVersion])

  // 交易确认后刷新状态
  useEffect(() => {
    if (isConfirmed && hash) {
      setTimeout(async () => {
        console.log('🔄 交易确认，刷新状态...')
        refetchVersionHistory()
        refetchCurrentVersion()
        refetchCount()
        refetchV2Prop()
        
        // 额外延迟确保区块链状态更新
        setTimeout(() => {
          refetchVersionHistory()
          refetchCurrentVersion()
        }, 1000)
        
        // 更新演示步骤和状态
        if (demoStep === 1 && proxyAddress) {
          setDemoStep(2)
          console.log('✅ 步骤1完成，进入步骤2')
        } else if (demoStep === 2) {
          console.log('✅ V1功能测试完成')
        } else if (demoStep === 3) {
          console.log('✅ 步骤3完成，等待版本更新')
          // 升级交易完成后，等待版本历史更新
          setTimeout(() => {
            setDemoStep(4)
          }, 2000)
        }
      }, 2000)
    }
  }, [isConfirmed, hash, demoStep, proxyAddress, refetchVersionHistory, refetchCurrentVersion, refetchCount, refetchV2Prop])

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

  // 创建初始代理（默认V1）
  const handleCreateProxy = async () => {
    // 如果已有代理，直接进入下一步
    if (proxyAddress) {
      alert('已有代理，请直接测试功能')
      return
    }

    try {
      // 使用V1配置创建代理
      const v1Config = getVersionConfig(1)
      if (!v1Config) {
        alert('V1配置未找到')
        return
      }
      
      writeContract({
        address: RWAUpgradeableProxy_ADDRESS as `0x${string}`,
        abi: RWAUpgradeableProxy_ABI,
        functionName: 'createProxy',
        args: [v1Config.address as `0x${string}`, v1Config.initSelector],
      })
      
      console.log('✅ 代理创建交易已发送，使用版本:', v1Config.name)
    } catch (error) {
      console.error('❌ 创建代理失败:', error)
      alert('创建代理失败')
    }
  }

  // 升级到下一个版本
  const handleUpgradeToNextVersion = async () => {
    if (!proxyAddress) {
      alert('请先创建代理')
      return
    }

    const nextVersion = getNextVersion(currentVersion)
    if (!nextVersion) {
      alert(`当前版本V${currentVersion}已是最新版本`)
      return
    }

    const nextConfig = getVersionConfig(nextVersion)
    if (!nextConfig) {
      alert(`V${nextVersion}配置未找到`)
      return
    }

    try {
      console.log(`🔄 准备从V${currentVersion}升级到V${nextVersion}`)
      
      writeContract({
        address: RWAUpgradeableProxy_ADDRESS as `0x${string}`,
        abi: RWAUpgradeableProxy_ABI,
        functionName: 'upgrade',
        args: [proxyAddress as `0x${string}`, nextConfig.address as `0x${string}`],
      })
      
      console.log(`✅ 升级到${nextConfig.name}交易已发送`)
    } catch (error) {
      console.error(`❌ 升级到${nextConfig.name}失败:`, error)
      alert(`升级到${nextConfig.name}失败`)
    }
  }

  // 调用Counter的next方法
  const handleCallNext = async () => {
    if (!proxyAddress) {
      alert('请先创建或设置代理地址')
      return
    }

    try {
      console.log('🔄 调用Counter.next()方法...')
      console.log('  代理地址:', proxyAddress)
      console.log('  当前实现:', currentImplementation)
      console.log('  当前count值:', countData)
      console.log('  owner地址:', ownerData)
      console.log('  用户地址:', address)
      console.log('  是否有权限:', hasPermission)
      
      // 检查合约是否已初始化
      if (countData === undefined) {
        console.error('❌ Counter合约未正确初始化，无法读取count值')
        alert('Counter合约未初始化，请先初始化合约')
        return
      }
      
      // 检查用户权限
      if (!hasPermission) {
        console.error('❌ 用户没有调用权限')
        alert('您没有调用该合约的权限')
        return
      }
      
      console.log('🔍 合约状态检查完成，准备调用next方法...')
      
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
      console.error('  错误类型:', error.name)
      console.error('  错误代码:', error.code)
      console.error('  错误消息:', error.message)
      console.error('  错误详情:', error.details)
      console.error('  完整错误对象:', JSON.stringify(error, null, 2))
      
      let errorMessage = '调用Counter.next()失败'
      if (error.message?.includes('execution reverted')) {
        errorMessage = '合约调用被拒绝，可能是权限问题或合约状态错误'
      } else if (error.message?.includes('user rejected')) {
        errorMessage = '用户拒绝了交易'
      }
      alert(errorMessage)
    }
  }

  // 设置V2属性值（通过重置为基础值再乘以目标值）
  const handleSetV2Prop = async (value: number) => {
    if (!proxyAddress || value <= 0) return

    try {
      // 首先重置为1，然后乘以目标值
      // 因为multi方法是乘法，所以要得到目标值，需要先重置状态
      // 这是一个变通方法，因为合约没有直接的setter方法
      
      // 方法1：直接乘以目标值（如果当前值是1）
      const currentValue = counterState.v2Prop || 1
      if (currentValue === 1) {
        writeContract({
          address: proxyAddress as `0x${string}`,
          abi: [
            {
              "inputs": [
                {"internalType": "uint256", "name": "multiplier", "type": "uint256"}
              ],
              "name": "multi",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ],
          functionName: 'multi',
          args: [BigInt(value)],
        })
        console.log(`✅ 设置V2属性值为 ${value} (当前值为1，直接乘以${value})`)
      } else {
        // 方法2：计算乘数
        const multiplier = Math.floor(value / currentValue)
        if (multiplier > 0) {
          writeContract({
            address: proxyAddress as `0x${string}`,
            abi: [
              {
                "inputs": [
                  {"internalType": "uint256", "name": "multiplier", "type": "uint256"}
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
          console.log(`✅ 设置V2属性值调用已发送: 当前值 ${currentValue} × ${multiplier} ≈ ${value}`)
        } else {
          alert('目标值必须大于等于当前值')
        }
      }
    } catch (error) {
      console.error('❌ 设置V2属性值失败:', error)
      alert('设置V2属性值失败')
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

  // 调试状态读取 - 简化日志输出
  useEffect(() => {
    if (proxyAddress) {
      // 只在关键状态变化时输出日志，避免过多日志
      if (v2PropData !== undefined || currentImplementation !== undefined) {
        console.log('🔍 关键状态更新:')
        console.log('  当前版本:', currentVersion)
        console.log('  当前实现:', currentImplementation)
        console.log('  计数器数据:', countData)
        console.log('  V2属性:', v2PropData)
      }
    }
  }, [proxyAddress, currentVersion, currentImplementation, countData, v2PropData])

  // 更新Counter状态
  useEffect(() => {
    // 只在数据实际变化时更新状态，减少不必要的日志
    const shouldUpdateCount = countData !== undefined && Number(countData) !== counterState.count
    const shouldUpdateV2Prop = isUpgraded && v2PropData !== undefined && Number(v2PropData) !== counterState.v2Prop
    
    if (shouldUpdateCount || shouldUpdateV2Prop) {
      console.log('🔄 更新Counter状态:')
      console.log('  countData:', countData)
      console.log('  v2PropData:', v2PropData)
      console.log('  isUpgraded:', isUpgraded)
    }
    
    if (shouldUpdateCount) {
      setCounterState(prev => ({
        ...prev,
        count: Number(countData)
      }))
      console.log('✅ 更新count值为:', Number(countData))
    }
    
    // 如果已升级，尝试读取V2属性值
    if (isUpgraded) {
      if (v2PropData !== undefined) {
        if (shouldUpdateV2Prop) {
          setCounterState(prev => ({
            ...prev,
            v2Prop: Number(v2PropData)
          }))
          console.log('✅ 更新v2Prop值为:', Number(v2PropData))
        }
      } else {
        // 如果V2属性数据为undefined，设置为默认值1
        if (counterState.v2Prop !== 1) {
          setCounterState(prev => ({
            ...prev,
            v2Prop: 1
          }))
          console.log('⚠️ V2属性数据为undefined，设置为默认值1')
        }
      }
    } else {
      // 如果未升级，设置V2属性为0
      if (counterState.v2Prop !== 0) {
        setCounterState(prev => ({
          ...prev,
          v2Prop: 0
        }))
        console.log('⚠️ 未升级状态，设置v2Prop为0')
      }
    }
  }, [countData, v2PropData, isUpgraded, counterState.count, counterState.v2Prop])

  // 交易确认后刷新状态
  useEffect(() => {
    if (isConfirmed && hash) {
      setTimeout(async () => {
        console.log('🔄 交易确认，刷新状态...')
        refetchCount()
        refetchV2Prop()
        refetchImplementation()
        refetchVersionHistory()
        refetchCurrentVersion()
        
        // 如果是初始化V2的交易确认，重置初始化状态
        if (isInitializingV2) {
          setTimeout(() => {
            setIsInitializingV2(false)
            console.log('✅ 初始化交易确认，重置初始化状态')
          }, 1000)
        }
        
        // 额外延迟确保区块链状态更新
        setTimeout(() => {
          refetchImplementation()
          refetchV2Prop()
          refetchVersionHistory()
          refetchCurrentVersion()
        }, 1000)
        
        // 更新演示步骤和状态
        if (demoStep === 1 && proxyAddress) {
          setDemoStep(2)
          console.log('✅ 步骤1完成，进入步骤2')
        } else if (demoStep === 2) {
          // 测试V1功能时调用next后保持步骤2
          console.log('✅ V1功能测试完成')
        } else if (demoStep === 3) {
          console.log('✅ 步骤3完成，进入步骤4')
          // 升级交易完成后，等待实现地址更新
          setTimeout(() => {
            setDemoStep(4)
            // 升级后检查是否需要初始化V2
            setTimeout(() => {
              if (isInitializingV2) {
                console.log('⏳ 正在初始化V2中，跳过升级后检查')
                return
              }
              
              if (isUpgraded && v2PropData === 0n) {
                console.log('⚠️ 升级后检测到V2属性为0，准备调用initializeV2()...')
                setIsInitializingV2(true)
                handleInitializeCurrentVersion()
              } else if (isUpgraded && v2PropData === undefined) {
                console.log('⏳ 升级后V2属性数据正在加载，等待...')
                setTimeout(() => {
                  if (v2PropData === 0n && !isInitializingV2) {
                    console.log('⚠️ 升级后确认V2属性为0，准备调用initializeV2()...')
                    setIsInitializingV2(true)
                    handleInitializeCurrentVersion()
                  }
                }, 1000)
              }
            }, 2000)
          }, 1000)
        }
      }, 2000)
    }
  }, [isConfirmed, hash, demoStep, proxyAddress, refetchCount, refetchV2Prop, refetchImplementation, refetchVersionHistory, refetchCurrentVersion, handleInitializeCurrentVersion, isInitializingV2, isUpgraded, v2PropData])

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
                        <Button 
                          onClick={() => {
                            console.log('🔄 手动刷新状态...')
                            refetchVersionHistory()
                            refetchCurrentVersion()
                            refetchImplementation()
                            refetchCount()
                            refetchV2Prop()
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          🔄 刷新状态
                        </Button>
                        <Button 
                          onClick={() => {
                            console.log('🎯 专门刷新V2属性...')
                            refetchV2Prop()
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          🎯 刷新V2属性
                        </Button>
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
                        <div className="flex items-center justify-between">
                          <span className="text-sm">代理地址</span>
                          <span className="text-xs font-mono">
                            {proxyAddress ? `${proxyAddress.slice(0, 8)}...${proxyAddress.slice(-6)}` : '未设置'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {versionHistory.length > 0 && (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>版本历史</CardTitle>
                        <CardDescription>代理升级记录</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {versionHistory.map((version, index) => (
                            <div 
                              key={index} 
                              className={`p-3 rounded-lg border ${
                                index === versionHistory.length - 1 
                                  ? 'border-green-300 bg-green-50' 
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant={index === versionHistory.length - 1 ? "default" : "secondary"}>
                                  V{version.version}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {new Date(version.timestamp * 1000).toLocaleString()}
                                </span>
                              </div>
                              <div className="text-xs font-mono text-gray-600">
                                {version.implementation}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                升级者: {version.upgradedBy.slice(0, 8)}...{version.upgradedBy.slice(-6)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>调试信息</CardTitle>
                      <CardDescription>技术细节</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>当前版本: V{currentVersion}</div>
                        <div>版本历史: {versionHistory.length} 个版本</div>
                        <div>当前实现: {currentImplementation ? `${String(currentImplementation).slice(0, 10)}...` : '检测中'}</div>
                        <div>直接实现: {directImplementation ? `${String(directImplementation).slice(0, 10)}...` : '检测中'}</div>
                        <div>演示步骤: {demoStep}</div>
                        <div>已升级状态: {isUpgraded ? '是' : '否'}</div>
                        <div>原始V2数据: {v2PropData !== undefined ? String(v2PropData) : 'undefined'}</div>
                        <div>显示V2值: {counterState.v2Prop}</div>
                        <div>V2读取启用: {!!proxyAddress && isUpgraded ? '是' : '否'}</div>
                        <div>正在初始化V2: {isInitializingV2 ? '是' : '否'}</div>
                        <div>代理地址: {proxyAddress ? `${proxyAddress.slice(0, 8)}...` : '未设置'}</div>
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
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <p className="text-sm text-blue-800">
                            <strong>使用说明:</strong> 
                          </p>
                          <ul className="text-sm text-blue-800 list-disc list-inside mt-2 space-y-1">
                            <li>系统会自动检测已有的Counter代理并填充地址</li>
                            <li>如果Counter未初始化，count会显示为0，需要点击&ldquo;初始化CounterV1&rdquo;</li>
                            <li>如果已在Stage3主页面创建过代理，可以直接使用</li>
                            <li>代理地址: {proxyAddress ? `${proxyAddress.slice(0, 10)}...${proxyAddress.slice(-6)}` : '等待检测'}</li>
                          </ul>
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <Label htmlFor="proxy-result">代理地址</Label>
                              <Input
                                id="proxy-result"
                                value={proxyAddress || (firstProxyAddress ? String(firstProxyAddress) : '')}
                                readOnly
                                placeholder={firstProxyAddress ? "检测到已有代理" : "等待创建..."}
                                className="mt-1"
                              />
                              {proxyAddress && (
                                <p className="text-xs text-green-600 mt-1">
                                  ✅ 代理地址已设置
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={handleCreateProxy}
                              disabled={proxyAddress || !hasPermission || isPending || isConfirming}
                            >
                              {isPending ? '创建中...' : isConfirming ? '确认中...' : '创建代理(V1)'}
                            </Button>
                            {proxyAddress && (
                              <Badge variant="default">✅ 已有代理</Badge>
                            )}
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
                            {counterState.count === 0 && (
                              <p className="text-orange-600 mt-2">
                                ⚠️ 如果next()方法不工作，请点击&ldquo;初始化CounterV1&rdquo;按钮
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 步骤2：测试V1功能 */}
                    {demoStep >= 1 && !isUpgraded && (
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
                            <div className="space-y-2">
                              <Button 
                                onClick={handleCallNext}
                                disabled={!proxyAddress || isPending || isConfirming}
                                className="w-full"
                              >
                                {isPending ? '调用中...' : isConfirming ? '确认中...' : '调用 next() 方法'}
                              </Button>
                              {counterState.count === 0 && (
                                <Button 
                                  onClick={handleInitializeCurrentVersion}
                                  disabled={isPending || isConfirming}
                                  variant="outline"
                                  className="w-full"
                                >
                                  初始化{getVersionConfig(currentVersion)?.name || '当前版本'}
                                </Button>
                              )}
                            </div>
                            <div className="text-center mt-4">
                              {counterState.count > 0 ? (
                                <div className="space-y-2">
                                  <Badge variant="default">✓ V1功能测试完成</Badge>
                                  <p className="text-sm text-gray-600">
                                    已调用 {counterState.count} 次，可进入下一步
                                  </p>
                                  <Button 
                                    onClick={() => setDemoStep(3)}
                                    variant="outline"
                                    size="sm"
                                    disabled={demoStep >= 3}
                                  >
                                    进入步骤 3 →
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">
                                  点击上方按钮测试next()功能
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* 步骤3：升级到CounterV2 */}
                    {demoStep >= 2 && !isUpgraded && (
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
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <Label>升级状态</Label>
                                <div className="mt-1">
                                  <Badge variant={isUpgraded ? "default" : "secondary"}>
                                    {isUpgraded ? '✓ 已升级到V2' : '等待升级'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                onClick={handleUpgradeToNextVersion}
                                disabled={!hasPermission || isPending || isConfirming}
                                variant="outline"
                              >
                                {isPending ? '升级中...' : isConfirming ? '确认中...' : `升级到V${getNextVersion(currentVersion) || '最新版本'}`}
                              </Button>
                              {currentVersion > 1 && (
                                <Button 
                                  onClick={handleInitializeCurrentVersion}
                                  disabled={isPending || isConfirming}
                                  variant="default"
                                >
                                  初始化V{currentVersion}状态
                                </Button>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 bg-orange-50 p-3 rounded-lg">
                              <p><strong>V{getNextVersion(currentVersion) || '最新版本'}功能:</strong></p>
                              <ul className="list-disc list-inside mt-2 space-y-1">
                                {getNextVersion(currentVersion) && getVersionConfig(getNextVersion(currentVersion))?.features.map((feature, index) => (
                                  <li key={index}>{feature}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* 步骤4：测试当前版本功能 */}
                    {currentVersion > 1 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            ✨ 步骤 4: 测试{getVersionConfig(currentVersion)?.name}功能
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
                                <div className="text-lg font-medium text-green-600">{getVersionConfig(currentVersion)?.name}</div>
                                <div className="text-sm text-green-600">当前版本</div>
                              </div>
                              <div className="p-4 bg-purple-50 rounded-lg text-center">
                                <div className="text-lg font-medium text-purple-600">
                                  {currentVersion === 1 ? '+1' : currentVersion === 2 ? '+2' : `+${currentVersion}`}
                                </div>
                                <div className="text-sm text-purple-600">每次增加</div>
                              </div>
                              {currentVersion > 1 && (
                                <div className="p-4 bg-orange-50 rounded-lg text-center">
                                  <div className="text-lg font-medium text-orange-600">{counterState.v2Prop}</div>
                                  <div className="text-sm text-orange-600">V{currentVersion}属性值</div>
                                  {counterState.v2Prop === 0 && (
                                    <div className="mt-2">
                                      <Badge variant="destructive" className="text-xs">
                                        ⚠️ 未初始化
                                      </Badge>
                                    </div>
                                  )}
                                  {counterState.v2Prop > 0 && (
                                    <div className="mt-2">
                                      <Badge variant="default" className="text-xs">
                                        ✓ 已初始化
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Button 
                                onClick={handleCallNext}
                                disabled={isPending || isConfirming}
                              >
                                调用 next() (现在加{currentVersion === 1 ? '1' : currentVersion === 2 ? '2' : currentVersion})
                              </Button>
                              {currentVersion > 1 && (
                                <div className="space-y-2">
                                  <Button 
                                    onClick={() => handleCallMulti(2)}
                                    disabled={isPending || isConfirming}
                                    variant="outline"
                                    className="w-full"
                                  >
                                    multi(2) - v{currentVersion}Prop × 2
                                  </Button>
                                  <Button 
                                    onClick={() => handleCallMulti(3)}
                                    disabled={isPending || isConfirming}
                                    variant="outline"
                                    className="w-full"
                                  >
                                    multi(3) - v{currentVersion}Prop × 3
                                  </Button>
                                  <Button 
                                    onClick={() => {
                                      // 强制设置V2属性为1（如果当前值为0）
                                      if (counterState.v2Prop === 0) {
                                        handleSetV2Prop(1)
                                      } else {
                                        alert('当前V2属性值不为0，无需强制初始化')
                                      }
                                    }}
                                    disabled={isPending || isConfirming}
                                    variant="default"
                                    className="w-full"
                                  >
                                    🔄 强制初始化V2为1
                                  </Button>
                                </div>
                              )}
                            </div>
                            
                            {currentVersion > 1 && (
                              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <h4 className="font-medium text-yellow-800 mb-3">
                                  🎯 V2属性管理
                                </h4>
                                <p className="text-sm text-yellow-700 mb-3">
                                  V2属性默认值为1，您可以初始化或设置新的值来测试multi方法的效果
                                </p>
                                {counterState.v2Prop === 0 && (
                                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                                    <p className="text-sm text-red-700">
                                      ⚠️ V2属性未初始化，请先点击&ldquo;初始化V2属性&rdquo;按钮
                                    </p>
                                    <Button 
                                      onClick={() => {
                                        setIsInitializingV2(true)
                                        handleInitializeCurrentVersion()
                                      }}
                                      disabled={isPending || isConfirming || isInitializingV2}
                                      variant="destructive"
                                      size="sm"
                                      className="mt-2 w-full"
                                    >
                                      {isInitializingV2 ? '🔄 初始化中...' : '🔄 初始化V2属性'}
                                    </Button>
                                  </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <Label htmlFor="v2-prop-input" className="text-sm font-medium">
                                      目标值
                                    </Label>
                                    <Input
                                      id="v2-prop-input"
                                      type="number"
                                      min="1"
                                      value={v2PropInput}
                                      onChange={(e) => setV2PropInput(e.target.value)}
                                      placeholder="输入目标值"
                                      className="mt-1"
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <Button 
                                      onClick={() => {
                                        const value = parseInt(v2PropInput)
                                        if (value > 0) {
                                          handleSetV2Prop(value)
                                        } else {
                                          alert('请输入大于0的数字')
                                        }
                                      }}
                                      disabled={!v2PropInput || isPending || isConfirming}
                                      variant="outline"
                                      className="w-full"
                                    >
                                      设置V2属性
                                    </Button>
                                  </div>
                                  <div className="flex items-end">
                                    <Button 
                                      onClick={() => {
                                        setV2PropInput('10')
                                        handleSetV2Prop(10)
                                      }}
                                      disabled={isPending || isConfirming}
                                      variant="default"
                                      className="w-full"
                                    >
                                      快速设为10
                                    </Button>
                                  </div>
                                </div>
                                <div className="mt-3 text-xs text-yellow-600">
                                  <p>💡 提示：multi方法会将当前V2属性值乘以指定倍数，所以建议先设置一个基础值再测试倍乘效果</p>
                                  <p>当前V2属性值: {counterState.v2Prop} | 目标值: {v2PropInput || '未设置'}</p>
                                  <p>原始V2数据: {v2PropData !== undefined ? String(v2PropData) : 'undefined'} | 已升级: {isUpgraded ? '是' : '否'}</p>
                                  <Button 
                                    onClick={() => refetchV2Prop()}
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 w-full"
                                  >
                                    🔄 手动刷新V2数据
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {demoStep >= 4 && (
                              <div className="text-center p-4 bg-green-50 rounded-lg border-green-300">
                                <Badge variant="default" className="text-lg px-4 py-2">
                                  🎉 完整升级演示完成！
                                </Badge>
                                <p className="text-sm text-gray-600 mt-2">
                                  状态保持：{counterState.count} | 
                                  {getVersionConfig(currentVersion)?.name}功能：✓ | 
                                  {currentVersion > 1 && ` 新属性：${counterState.v2Prop}`}
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