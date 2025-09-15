'use client'

import { useState, useEffect } from 'react'

// 错误类型定义
interface ContractError {
  code?: number
  data?: unknown
  message?: string
  stack?: string
}
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { RWAGovernor_ADDRESS, RWAGovernor_ABI } from '@/lib/wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { formatEther, parseEther, keccak256, encodePacked } from 'viem'

interface Proposal {
  id: bigint
  proposer: string
  description: string
  voteStart: bigint
  voteEnd: bigint
  executed: boolean
  canceled: boolean
  forVotes: bigint
  againstVotes: bigint
  abstainVotes: bigint
  state: string
  targets: string[]
  values: bigint[]
  calldatas: string[]
}

export function GovernanceManagement({ address }: { address: string }) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [newProposalDescription, setNewProposalDescription] = useState('')
  const [newProposalTarget, setNewProposalTarget] = useState('')
  const [newProposalValue, setNewProposalValue] = useState('')
  const [newProposalCalldata, setNewProposalCalldata] = useState('')
  const [voteReason, setVoteReason] = useState('')
  const [delegateAddress, setDelegateAddress] = useState('')
  const [isLoadingProposals, setIsLoadingProposals] = useState(false)
  const [proposalError, setProposalError] = useState<string | null>(null)

  const { writeContract, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })
  const publicClient = usePublicClient()

  // 读取提案总数
  const { data: proposalCount } = useReadContract({
    address: RWAGovernor_ADDRESS,
    abi: RWAGovernor_ABI,
    functionName: 'getProposalCount',
  })
  
  // 读取所有提案ID列表
  const { data: allProposalIds } = useReadContract({
    address: RWAGovernor_ADDRESS,
    abi: RWAGovernor_ABI,
    functionName: 'getAllProposalIds',
  })

  // 获取治理代币地址
  const { data: governanceTokenAddress } = useReadContract({
    address: RWAGovernor_ADDRESS,
    abi: RWAGovernor_ABI,
    functionName: 'token',
  })

  // 读取代币余额（投票权重）
  const { data: tokenBalance } = useReadContract({
    address: governanceTokenAddress as `0x${string}`,
    abi: [
      {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  })

  // 读取当前委托信息
  const { data: currentDelegate } = useReadContract({
    address: governanceTokenAddress as `0x${string}`,
    abi: [
      {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'delegates',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'delegates',
    args: [address as `0x${string}`],
  })

  // 读取当前投票权重
  const { data: currentVotes } = useReadContract({
    address: governanceTokenAddress as `0x${string}`,
    abi: [
      {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'getVotes',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'getVotes',
    args: [address as `0x${string}`],
  })

  // 读取法定人数
  const { data: quorumNumerator } = useReadContract({
    address: RWAGovernor_ADDRESS,
    abi: RWAGovernor_ABI,
    functionName: 'quorumNumerator',
  })

  // 创建动态获取提案状态的函数 - 调用智能合约
  const getProposalState = async (proposalId: bigint) => {
    try {
      console.log(`🔍 获取提案 ${proposalId.toString()} 状态...`)

      // 优先使用合约的 state 方法，这是最可靠的方式
      try {
        const state = await publicClient.readContract({
          address: RWAGovernor_ADDRESS,
          abi: RWAGovernor_ABI,
          functionName: 'state',
          args: [proposalId],
        }) as bigint

        console.log(`✅ 通过合约state方法获取到提案 ${proposalId.toString()} 状态: ${getProposalStateStringFromEnum(state)} (${state.toString()})`)
        return state
      } catch (stateError) {
        console.warn(`合约state方法失败，尝试getProposalBasicInfo:`, stateError)
      }

      // 备用方案：通过 getProposalBasicInfo 获取状态
      const proposalData = await publicClient.readContract({
        address: RWAGovernor_ADDRESS,
        abi: RWAGovernor_ABI,
        functionName: 'getProposalBasicInfo',
        args: [proposalId],
      }) as [
        string, // proposer
        string, // description
        bigint, // voteStart
        bigint, // voteEnd
        boolean, // executed
        boolean, // canceled,
      ]

      const proposer = proposalData[0]
      const voteStart = proposalData[2]
      const voteEnd = proposalData[3]
      const executed = proposalData[4]
      const canceled = proposalData[5]

      // 获取当前区块时间而不是本地时间
      const currentBlock = await publicClient.getBlock()
      const currentTime = currentBlock.timestamp

      console.log(`提案 ${proposalId.toString()} 详细信息:`, {
        proposer,
        voteStart: voteStart.toString(),
        voteEnd: voteEnd.toString(),
        voteStartDate: voteStart > BigInt(0) ? new Date(Number(voteStart) * 1000).toLocaleString() : 'Invalid timestamp',
        voteEndDate: voteEnd > BigInt(0) ? new Date(Number(voteEnd) * 1000).toLocaleString() : 'Invalid timestamp',
        currentTime: new Date(Number(currentTime) * 1000).toLocaleString(),
        currentBlock: currentBlock.number,
        executed,
        canceled,
      })

      // 检查时间戳是否有效
      if (voteStart === BigInt(0) || voteEnd === BigInt(0)) {
        console.warn(`提案 ${proposalId.toString()} 时间戳无效，提案可能不存在`)
        return BigInt(8) // Unknown状态
      }

      // 基于OZ Governor的状态逻辑，使用区块时间
      if (canceled) {
        return BigInt(2) // Canceled
      } else if (executed) {
        return BigInt(7) // Executed
      } else if (currentTime < voteStart) {
        return BigInt(0) // Pending
      } else if (currentTime <= voteEnd) {
        return BigInt(1) // Active
      } else {
        // 投票已结束，需要检查是否成功达到法定人数
        // 简化处理，返回 Defeated
        console.log(`提案 ${proposalId.toString()} 投票已结束`)
        return BigInt(3) // Defeated
      }
    } catch (error) {
      console.error(`获取提案 ${proposalId.toString()} 状态失败:`, error)

      // 最后的备用方案：假设提案不存在
      return BigInt(8) // Unknown状态
    }
  }
  
  // 获取提案详情的辅助函数 - 使用优化后的分离函数调用
  const getProposalDetails = async (proposalId: bigint): Promise<Proposal | null> => {
    try {
      console.log(`🔍 获取提案 ${proposalId.toString()} 详情...`)

      let proposer: string, description: string, voteStart: bigint, voteEnd: bigint, executed: boolean, canceled: boolean
      let forVotes: bigint = BigInt(0), againstVotes: bigint = BigInt(0), abstainVotes: bigint = BigInt(0)
      let targets: string[] = [], values: bigint[] = [], calldatas: string[] = []

      try {
        // 使用优化后的分离函数调用，避免堆栈溢出
        [
          proposer,
          description,
          voteStart,
          voteEnd,
          executed,
          canceled,
        ] = await publicClient.readContract({
          address: RWAGovernor_ADDRESS,
          abi: RWAGovernor_ABI,
          functionName: 'getProposalBasicInfo',
          args: [proposalId],
        }) as [
          string, // proposer
          string, // description
          bigint, // voteStart
          bigint, // voteEnd
          boolean, // executed
          boolean, // canceled
        ]
      } catch (basicInfoError) {
        console.warn(`⚠️ 获取提案基本信息失败: ${basicInfoError}`)
        // 设置默认值
        proposer = '0x0000000000000000000000000000000000000000'
        description = '提案信息不可用'
        voteStart = BigInt(0)
        voteEnd = BigInt(0)
        executed = false
        canceled = false
      }

      try {
        [
          forVotes,
          againstVotes,
          abstainVotes,
        ] = await publicClient.readContract({
          address: RWAGovernor_ADDRESS,
          abi: RWAGovernor_ABI,
          functionName: 'getProposalVotes',
          args: [proposalId],
        }) as [
          bigint, // forVotes
          bigint, // againstVotes
          bigint, // abstainVotes
        ]
      } catch (votesError) {
        console.warn(`⚠️ 获取提案投票信息失败: ${votesError}`)
        // 保持默认值 0
      }

      try {
        [
          targets,
          values,
          calldatas,
        ] = await publicClient.readContract({
          address: RWAGovernor_ADDRESS,
          abi: RWAGovernor_ABI,
          functionName: 'getProposalActions',
          args: [proposalId],
        }) as [
          string[], // targets
          bigint[], // values
          string[], // calldatas
        ]
      } catch (actionsError) {
        console.warn(`⚠️ 获取提案执行参数失败: ${actionsError}`)
        // 保持默认空数组
      }

      // 获取提案状态
      const state = await getProposalState(proposalId)

      // 检查时间戳是否有效
      const isValidTimestamp = voteStart > BigInt(0) && voteEnd > BigInt(0)

      // 创建提案对象
      const proposal: Proposal = {
        id: proposalId,
        proposer,
        description,
        voteStart: isValidTimestamp ? voteStart : BigInt(0),
        voteEnd: isValidTimestamp ? voteEnd : BigInt(0),
        executed,
        canceled,
        forVotes,
        againstVotes,
        abstainVotes,
        state: getProposalStateStringFromEnum(BigInt(state.toString())),
        targets,
        values,
        calldatas,
      }

      console.log(`✅ 成功获取提案 ${proposalId.toString()} 详情:`, {
        proposer: proposal.proposer,
        description: proposal.description,
        state: proposal.state,
        voteStart: isValidTimestamp ? new Date(Number(proposal.voteStart) * 1000).toLocaleString() : 'Invalid timestamp',
        voteEnd: isValidTimestamp ? new Date(Number(proposal.voteEnd) * 1000).toLocaleString() : 'Invalid timestamp',
        rawVoteStart: voteStart.toString(),
        rawVoteEnd: voteEnd.toString(),
        isValidTimestamp,
      })

      return proposal

    } catch (error) {
      console.error(`获取提案 ${proposalId.toString()} 详情失败:`, error)

      // 如果获取详情失败，返回一个基础的提案对象，显示错误信息
      try {
        const state = await getProposalState(proposalId)
        return {
          id: proposalId,
          proposer: '0x0000000000000000000000000000000000000000',
          description: `提案 ${proposalId.toString()} 详情获取失败 - 可能不存在`,
          voteStart: BigInt(0),
          voteEnd: BigInt(0),
          executed: false,
          canceled: false,
          forVotes: BigInt(0),
          againstVotes: BigInt(0),
          abstainVotes: BigInt(0),
          state: getProposalStateStringFromEnum(BigInt(state.toString())),
          targets: [],
          values: [],
          calldatas: [],
        }
      } catch (stateError) {
        console.error(`获取提案 ${proposalId.toString()} 状态也失败:`, stateError)
        return null
      }
    }
  }

  // 将提案状态枚举值转换为字符串
  const getProposalStateStringFromEnum = (state: bigint): string => {
    const stateMap: { [key: number]: string } = {
      0: 'Pending',
      1: 'Active',
      2: 'Canceled',
      3: 'Defeated',
      4: 'Succeeded',
      5: 'Queued',
      6: 'Expired',
      7: 'Executed',
      8: 'Unknown'
    }
    return stateMap[Number(state)] || 'Unknown'
  }

  // 刷新提案列表 - 优化版本
  const refreshProposals = async () => {
    setIsLoadingProposals(true)
    setProposalError(null)
    
    try {
      if (!allProposalIds || !Array.isArray(allProposalIds)) {
        console.log('暂无提案ID列表')
        setProposals([])
        return
      }
      
      console.log(`开始刷新 ${allProposalIds.length} 个提案的详情`)
      
      const proposalList: Proposal[] = []
      const ids = allProposalIds.slice() // 复制数组
      
      // 限制显示最新的10个提案（从最新到最旧）
      const latestIds = ids.reverse().slice(0, 10)
      
      // 并行获取提案详情以提高性能
      const detailPromises = latestIds.map(async (proposalId) => {
        try {
          const details = await getProposalDetails(proposalId)
          return details
        } catch (error) {
          console.error(`获取提案 ${proposalId.toString()} 详情时出错:`, error)
          return null
        }
      })
      
      const detailsResults = await Promise.allSettled(detailPromises)
      
      for (const result of detailsResults) {
        if (result.status === 'fulfilled' && result.value) {
          proposalList.push(result.value)
        }
      }
      
      console.log(`成功获取 ${proposalList.length} 个提案详情`)
      setProposals(proposalList)
      
    } catch (error) {
      console.error('刷新提案列表失败:', error)
      setProposalError('获取提案列表失败，请稍后重试')
    } finally {
      setIsLoadingProposals(false)
    }
  }

  // 监听提案ID列表变化
  useEffect(() => {
    console.log('提案ID列表更新:', allProposalIds)
    if (allProposalIds && Array.isArray(allProposalIds)) {
      refreshProposals()
    }
  }, [allProposalIds])
  
  // 添加定时刷新，确保提案数据是最新的
  useEffect(() => {
    const interval = setInterval(() => {
      refreshProposals()
    }, 30000) // 每30秒刷新一次
    
    return () => clearInterval(interval)
  }, [allProposalIds])

  // 监听交易完成，刷新提案数据
  useEffect(() => {
    if (isConfirmed && hash) {
      console.log('交易已确认，刷新提案数据...')
      refreshProposals()
    }
  }, [isConfirmed, hash])

  // 创建提案
  const handleCreateProposal = async () => {
    if (!newProposalDescription || !newProposalTarget) {
      console.warn('创建提案失败: 描述或目标地址为空')
      return
    }

    console.log('开始创建治理提案:')
    console.log('  提案描述:', newProposalDescription)
    console.log('  目标地址:', newProposalTarget)
    console.log('  价值:', newProposalValue || '0', 'ETH')
    console.log('  调用数据:', newProposalCalldata || '0x')
    console.log('  合约地址:', RWAGovernor_ADDRESS)
    console.log('  提案者:', address)

    try {
      const proposalArgs = [
        [newProposalTarget as `0x${string}`],
        [newProposalValue ? parseEther(newProposalValue) : BigInt(0)],
        [newProposalCalldata || '0x'],
        newProposalDescription,
      ]
      
      console.log('提案参数:', proposalArgs)
      
      writeContract({
        address: RWAGovernor_ADDRESS as `0x${string}`,
        abi: RWAGovernor_ABI,
        functionName: 'propose',
        args: proposalArgs,
      })
      
      console.log('提案创建交易已发送到区块链，等待确认...')
      
    } catch (error) {
      console.error('创建提案失败:', error)
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : '无堆栈信息',
        code: (error as ContractError)?.code,
        data: (error as ContractError)?.data
      })
    }
  }

  // 投票
  const handleVote = async (proposalId: bigint, support: number) => {
    // 检查是否有待处理的交易
    if (isPending || isConfirming) {
      console.warn('已有交易正在处理中，请等待完成')
      return
    }

    // 检查投票权限
    if (!currentVotes || currentVotes === BigInt(0)) {
      console.warn('投票失败: 没有激活的投票权')
      alert('您需要先自我委托以激活投票权才能投票')
      return
    }

    console.log('开始为提案投票:')
    console.log('  提案ID:', proposalId.toString())
    console.log('  投票类型:', support === 0 ? '反对' : support === 1 ? '赞成' : support === 2 ? '弃权' : '未知')
    console.log('  投票者:', address)
    console.log('  投票权重:', currentVotes.toString())
    console.log('  投票理由:', voteReason || '无')
    console.log('  合约地址:', RWAGovernor_ADDRESS)

    try {
      if (voteReason) {
        // 带理由的投票
        writeContract({
          address: RWAGovernor_ADDRESS,
          abi: RWAGovernor_ABI,
          functionName: 'castVoteWithReason',
          args: [proposalId, support, voteReason],
        })
      } else {
        // 普通投票
        writeContract({
          address: RWAGovernor_ADDRESS,
          abi: RWAGovernor_ABI,
          functionName: 'castVote',
          args: [proposalId, support],
        })
      }
      
      console.log('投票交易已发送到区块链，等待确认...')
      
    } catch (error) {
      console.error('投票失败:', error)
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : '无堆栈信息',
        code: (error as ContractError)?.code,
        data: (error as ContractError)?.data
      })
    }
  }

  // 执行提案 - 优化版本
  const handleExecute = async (proposalId: bigint) => {
    console.log('开始执行治理提案:')
    console.log('  提案ID:', proposalId.toString())
    console.log('  执行者:', address)
    console.log('  合约地址:', RWAGovernor_ADDRESS)

    try {
      // 获取提案详情来执行
      const proposal = proposals.find(p => p.id === proposalId)
      if (!proposal) {
        console.error('找不到提案详情')
        // 重新获取提案详情
        await refreshProposals()
        const refreshedProposal = proposals.find(p => p.id === proposalId)
        if (!refreshedProposal) {
          setProposalError('找不到提案详情，请刷新后重试')
          return
        }
      }

      // 使用提案的原始参数
      const executeProposal = proposals.find(p => p.id === proposalId)
      if (!executeProposal) {
        setProposalError('提案数据不完整')
        return
      }

      // 计算提案描述哈希
      const descriptionHash = keccak256(encodePacked(['string'], [executeProposal.description || '']))

      writeContract({
        address: RWAGovernor_ADDRESS,
        abi: RWAGovernor_ABI,
        functionName: 'execute',
        args: [
          (executeProposal.targets || [newProposalTarget as `0x${string}`]) as readonly `0x${string}`[],
          (executeProposal.values || [newProposalValue ? parseEther(newProposalValue) : BigInt(0)]) as readonly bigint[],
          (executeProposal.calldatas || [newProposalCalldata || '0x']) as readonly `0x${string}`[],
          descriptionHash
        ],
      })
      
      console.log('提案执行交易已发送到区块链，等待确认...')
      
    } catch (error) {
      console.error('执行提案失败:', error)
      setProposalError('执行提案失败，请检查权限和提案状态')
    }
  }

  // 取消提案 - 优化版本
  const handleCancel = async (proposalId: bigint) => {
    console.log('开始取消提案:')
    console.log('  提案ID:', proposalId.toString())
    console.log('  操作者:', address)

    try {
      const proposal = proposals.find(p => p.id === proposalId)
      if (!proposal) {
        console.error('找不到提案详情')
        // 重新获取提案详情
        await refreshProposals()
        const refreshedProposal = proposals.find(p => p.id === proposalId)
        if (!refreshedProposal) {
          setProposalError('找不到提案详情，请刷新后重试')
          return
        }
      }

      // 使用提案的原始参数
      const cancelProposal = proposals.find(p => p.id === proposalId)
      if (!cancelProposal) {
        setProposalError('提案数据不完整')
        return
      }

      // 计算提案描述哈希
      const descriptionHash = keccak256(encodePacked(['string'], [cancelProposal.description || '']))

      writeContract({
        address: RWAGovernor_ADDRESS,
        abi: RWAGovernor_ABI,
        functionName: 'cancel',
        args: [
          (cancelProposal.targets || [newProposalTarget as `0x${string}`]) as readonly `0x${string}`[],
          (cancelProposal.values || [newProposalValue ? parseEther(newProposalValue) : BigInt(0)]) as readonly bigint[],
          (cancelProposal.calldatas || [newProposalCalldata || '0x']) as readonly `0x${string}`[],
          descriptionHash
        ],
      })
      
      console.log('提案取消交易已发送到区块链，等待确认...')
      
    } catch (error) {
      console.error('取消提案失败:', error)
      setProposalError('取消提案失败，请检查权限和提案状态')
    }
  }

  // 获取状态徽章颜色
  const getStateBadgeColor = (state: string) => {
    switch (state) {
      case 'Pending': return 'bg-yellow-500'
      case 'Active': return 'bg-blue-500'
      case 'Succeeded': return 'bg-green-500'
      case 'Executed': return 'bg-purple-500'
      case 'Defeated': return 'bg-red-500'
      case 'Canceled': return 'bg-gray-500'
      case 'Expired': return 'bg-orange-500'
      case 'Unknown': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  // 添加治理状态监听日志
  useEffect(() => {
    console.log('治理合约状态更新:')
    console.log('  提案数量:', proposalCount?.toString())
    console.log('  提案ID列表:', allProposalIds)
    console.log('  当前用户地址:', address)
    console.log('  投票权重:', tokenBalance?.toString())
    console.log('  合约地址:', RWAGovernor_ADDRESS)
  }, [proposalCount, allProposalIds, address, tokenBalance])

  // 添加交易状态日志
  useEffect(() => {
    if (isConfirmed) {
      console.log('治理交易已确认，交易哈希:', hash)
      console.log('清空表单数据')
      setNewProposalDescription('')
      setNewProposalTarget('')
      setNewProposalValue('')
      setNewProposalCalldata('')
      setVoteReason('')
      refreshProposals()
    }
  }, [isConfirmed, hash])

  // 添加加载状态日志
  useEffect(() => {
    console.log('治理合约操作状态:')
    console.log('  提案提交中:', isPending)
    console.log('  提案确认中:', isConfirming)
    console.log('  提案已确认:', isConfirmed)
  }, [isPending, isConfirming, isConfirmed])

  // 委托投票处理函数
  const handleDelegate = async () => {
    if (!delegateAddress || !governanceTokenAddress) {
      console.warn('委托投票失败: 委托地址或代币地址为空')
      return
    }

    // 验证地址格式
    if (!delegateAddress.startsWith('0x') || delegateAddress.length !== 42) {
      console.warn('委托投票失败: 无效的委托地址格式')
      return
    }

    console.log('开始委托投票:')
    console.log('  委托地址:', delegateAddress)
    console.log('  代币合约地址:', governanceTokenAddress)
    console.log('  委托者:', address)

    try {
      writeContract({
        address: governanceTokenAddress as `0x${string}`,
        abi: [
          {
            inputs: [{ name: 'delegatee', type: 'address' }],
            name: 'delegate',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ] as const,
        functionName: 'delegate',
        args: [delegateAddress as `0x${string}`],
      } as any)
      
      console.log('委托投票交易已发送到区块链，等待确认...')
      
    } catch (error) {
      console.error('委托投票失败:', error)
    }
  }

  // 自我委托（激活投票权）
  const handleSelfDelegate = async () => {
    if (!address || !governanceTokenAddress) {
      console.warn('自我委托失败: 地址信息不完整')
      return
    }

    console.log('开始自我委托（激活投票权）:')
    console.log('  地址:', address)
    console.log('  代币合约地址:', governanceTokenAddress)

    try {
      writeContract({
        address: governanceTokenAddress as `0x${string}`,
        abi: [
          {
            inputs: [{ name: 'delegatee', type: 'address' }],
            name: 'delegate',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ] as const,
        functionName: 'delegate',
        args: [address as `0x${string}`],
      } as any)
      
      console.log('自我委托交易已发送到区块链，等待确认...')
      
    } catch (error) {
      console.error('自我委托失败:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">投票权重</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {tokenBalance ? parseFloat(formatEther(tokenBalance)).toFixed(2) : '0'}
            </div>
            <p className="text-sm text-gray-600">RWA20代币数量</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">提案总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {proposalCount ? proposalCount.toString() : '0'}
            </div>
            <p className="text-sm text-gray-600">已创建提案</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">法定人数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {quorumNumerator ? quorumNumerator.toString() : '0'}%
            </div>
            <p className="text-sm text-gray-600">最低参与率</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">委托信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentDelegate && currentDelegate !== '0x0000000000000000000000000000000000000000' ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">委托状态:</span>
                    <Badge variant={currentDelegate === address ? 'default' : 'secondary'}>
                      {currentDelegate === address ? '自我委托' : '已委托'}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">委托地址: </span>
                    <span className="font-mono text-xs">
                      {currentDelegate === address 
                        ? '自己' 
                        : `${currentDelegate.slice(0, 6)}...${currentDelegate.slice(-4)}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">激活投票数:</span>
                    <span className="text-sm font-medium text-blue-600">
                      {currentVotes ? parseFloat(formatEther(currentVotes)).toFixed(2) : '0'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-2">
                  <div className="text-sm text-gray-500 mb-1">未激活投票权</div>
                  <div className="text-xs text-gray-400">请进行自我委托以激活投票权</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>委托投票</CardTitle>
          <CardDescription>委托你的投票权给他人或自我委托以激活投票权</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="delegate-address">委托地址</Label>
              <Input
                id="delegate-address"
                placeholder="输入要委托的地址 (0x...)"
                value={delegateAddress}
                onChange={(e) => setDelegateAddress(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-end">
              <Button 
                onClick={handleDelegate}
                disabled={!delegateAddress || isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                委托投票
              </Button>
              <Button 
                onClick={handleSelfDelegate}
                disabled={isPending}
                variant="outline"
              >
                自我委托
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            注意：首次使用需要自我委托以激活投票权。委托后你的代币将按照委托地址的投票意愿进行投票。
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>创建新提案</CardTitle>
          <CardDescription>发起DAO治理提案</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="description">提案描述</Label>
            <Textarea
              id="description"
              placeholder="详细描述提案内容和目标..."
              value={newProposalDescription}
              onChange={(e) => setNewProposalDescription(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="target">目标合约地址</Label>
              <Input
                id="target"
                placeholder="0x..."
                value={newProposalTarget}
                onChange={(e) => setNewProposalTarget(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="value">发送ETH数量</Label>
              <Input
                id="value"
                type="number"
                placeholder="0"
                value={newProposalValue}
                onChange={(e) => setNewProposalValue(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="calldata">调用数据</Label>
              <Input
                id="calldata"
                placeholder="0x..."
                value={newProposalCalldata}
                onChange={(e) => setNewProposalCalldata(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleCreateProposal}
            disabled={isPending || isConfirming || !newProposalDescription || !newProposalTarget}
            className="w-full"
          >
            {isPending ? '创建中...' : isConfirming ? '确认中...' : '创建提案'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>提案列表</CardTitle>
              <CardDescription>查看和参与提案投票</CardDescription>
            </div>
            <Button 
              onClick={refreshProposals}
              variant="outline"
              size="sm"
              disabled={isLoadingProposals}
            >
              {isLoadingProposals ? '刷新中...' : '刷新'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoadingProposals ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">正在加载提案列表...</p>
              </div>
            ) : proposalError ? (
              <div className="text-center py-8">
                <div className="text-red-600 mb-4">⚠️ {proposalError}</div>
                <Button 
                  onClick={refreshProposals}
                  variant="outline"
                  size="sm"
                >
                  重试
                </Button>
              </div>
            ) : proposals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无提案</p>
            ) : (
              proposals.map((proposal) => (
                <div key={proposal.id.toString()} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">提案 #{proposal.id.toString()}</h4>
                      <p className="text-sm text-gray-600">提议者: {proposal.proposer}</p>
                    </div>
                    <Badge className={getStateBadgeColor(proposal.state)}>
                      {proposal.state}
                    </Badge>
                  </div>
                  
                  <p className="text-sm mb-3">{proposal.description}</p>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-green-600">赞成: {formatEther(proposal.forVotes)}</span>
                    </div>
                    <div>
                      <span className="text-red-600">反对: {formatEther(proposal.againstVotes)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">弃权: {formatEther(proposal.abstainVotes)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-3 text-gray-500">
                    <div>
                      开始区块: {proposal.voteStart > BigInt(0) ? proposal.voteStart.toString() : '区块无效'}
                    </div>
                    <div>
                      结束区块: {proposal.voteEnd > BigInt(0) ? proposal.voteEnd.toString() : '区块无效'}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVote(proposal.id, 1)} // 赞成
                      disabled={proposal.executed || proposal.canceled || proposal.state !== 'Active' || !currentVotes || currentVotes === BigInt(0)}
                      title={!currentVotes || currentVotes === BigInt(0) ? "需要先自我委托激活投票权" : undefined}
                    >
                      赞成
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVote(proposal.id, 0)} // 反对
                      disabled={proposal.executed || proposal.canceled || proposal.state !== 'Active' || !currentVotes || currentVotes === BigInt(0)}
                      title={!currentVotes || currentVotes === BigInt(0) ? "需要先自我委托激活投票权" : undefined}
                    >
                      反对
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVote(proposal.id, 2)} // 弃权
                      disabled={proposal.executed || proposal.canceled || proposal.state !== 'Active' || !currentVotes || currentVotes === BigInt(0)}
                      title={!currentVotes || currentVotes === BigInt(0) ? "需要先自我委托激活投票权" : undefined}
                    >
                      弃权
                    </Button>
                    
                    {/* 投票权限提示 */}
                    {proposal.state === 'Active' && (!currentVotes || currentVotes === BigInt(0)) && (
                      <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        需要自我委托激活投票权
                      </div>
                    )}
                    
                    {proposal.state === 'Succeeded' && !proposal.executed && (
                      <Button
                        size="sm"
                        onClick={() => handleExecute(proposal.id)}
                      >
                        执行
                      </Button>
                    )}
                    
                    {(proposal.state === 'Pending' || proposal.state === 'Active') && 
                     proposal.proposer.toLowerCase() === address.toLowerCase() && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancel(proposal.id)}
                      >
                        取消
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}