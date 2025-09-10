import { NextRequest, NextResponse } from 'next/server'

// IPFS节点配置
const IPFS_API_URL = 'http://localhost:5001'

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    console.log('IPFS仓库统计代理收到请求:', {
      searchParams: Object.fromEntries(searchParams.entries())
    })

    // 构建目标URL
    const targetUrl = new URL(`${IPFS_API_URL}/api/v0/repo/stat`)
    searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value)
    })

    console.log('IPFS仓库统计代理请求:', {
      targetUrl: targetUrl.toString(),
      method: request.method
    })

    // 转发请求到IPFS节点 - repo/stat不需要body
    const response = await fetch(targetUrl.toString(), {
      method: 'POST',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('IPFS仓库统计代理错误:', response.status, errorText)
      return NextResponse.json(
        { error: `IPFS仓库统计请求失败: ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('IPFS仓库统计代理错误:', error)
    return NextResponse.json(
      { error: '仓库统计代理服务器错误' },
      { status: 500 }
    )
  }
}