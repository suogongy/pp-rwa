import { NextRequest, NextResponse } from 'next/server'

// IPFS节点配置
const IPFS_API_URL = 'http://localhost:5001'

export async function POST(request: NextRequest) {
  try {
    console.log('IPFS cat API被调用')

    const searchParams = request.nextUrl.searchParams
    const arg = searchParams.get('arg')

    if (!arg) {
      return NextResponse.json(
        { error: '缺少CID参数' },
        { status: 400 }
      )
    }

    const targetUrl = new URL(`${IPFS_API_URL}/api/v0/cat`)
    targetUrl.searchParams.append('arg', arg)

    const response = await fetch(targetUrl.toString(), {
      method: 'POST'
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('IPFS cat请求失败:', response.status, errorText)
      return NextResponse.json(
        { error: `IPFS请求失败: ${errorText}` },
        { status: response.status }
      )
    }

    // 获取数据
    const data = await response.text()

    // 尝试解析为JSON格式
    try {
      const jsonData = JSON.parse(data)
      return NextResponse.json(jsonData)
    } catch {
      // 如果不是JSON格式，直接返回数据
      return NextResponse.json({ data })
    }
  } catch (error) {
    console.error('IPFS cat代理错误:', error)
    return NextResponse.json(
      { error: '代理服务器错误' },
      { status: 500 }
    )
  }
}