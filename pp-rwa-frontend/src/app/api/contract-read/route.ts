import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { localhost } from 'viem/chains'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, abi, functionName, args } = body

    if (!address || !abi || !functionName) {
      return NextResponse.json(
        { error: '缺少必要参数: address, abi, functionName' },
        { status: 400 }
      )
    }

    console.log('🔧 contract-read API 调用:', {
      address,
      functionName,
      args: args || []
    })

    const publicClient = createPublicClient({
      chain: localhost,
      transport: http()
    })

    let result
    try {
      result = await publicClient.readContract({
        address: address as `0x${string}`,
        abi,
        functionName,
        args: args || []
      })
      
      console.log('✅ 合约读取成功:', {
        functionName,
        result
      })

      // 将 BigInt 转换为字符串以便 JSON 序列化
      const serializedResult = JSON.parse(JSON.stringify(result, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
      ))

      return NextResponse.json({
        success: true,
        data: serializedResult
      })
    } catch (contractError) {
      console.error('❌ 合约读取失败:', contractError)
      
      // 如果是交易不存在的错误，返回特定的错误信息
      if (contractError instanceof Error && contractError.message.includes('revert')) {
        return NextResponse.json({
          success: false,
          error: '交易不存在或已过期'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: false,
        error: contractError instanceof Error ? contractError.message : '未知合约错误'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ API 路由错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}