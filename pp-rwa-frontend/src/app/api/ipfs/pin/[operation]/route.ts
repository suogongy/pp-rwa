import { NextRequest, NextResponse } from 'next/server'

// IPFS节点配置
const IPFS_API_URL = 'http://localhost:5001'

export async function POST(
  request: NextRequest,
  { params }: { params: { operation: string } }
) {
  try {
    const { operation } = params
    const searchParams = request.nextUrl.searchParams
    
    const fullOperation = `pin/${operation}`
    
    console.log('IPFS Pin代理收到请求:', {
      operation: fullOperation,
      searchParams: Object.fromEntries(searchParams.entries())
    })

    // 构建目标URL
    const targetUrl = new URL(`${IPFS_API_URL}/api/v0/${fullOperation}`)
    searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value)
    })

    console.log('IPFS Pin代理请求:', {
      operation: fullOperation,
      targetUrl: targetUrl.toString(),
      method: request.method
    })

    // 转发请求到IPFS节点 - pin操作不需要body
    const response = await fetch(targetUrl.toString(), {
      method: 'POST',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('IPFS Pin代理错误:', response.status, errorText)
      return NextResponse.json(
        { error: `IPFS Pin请求失败: ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('IPFS Pin代理错误:', error)
    return NextResponse.json(
      { error: 'Pin代理服务器错误' },
      { status: 500 }
    )
  }
}