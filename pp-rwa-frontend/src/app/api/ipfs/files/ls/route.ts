import { NextRequest, NextResponse } from 'next/server'

// IPFS节点配置
const IPFS_API_URL = 'http://localhost:5001'

export async function POST() {
  try {
    console.log('IPFS files/ls API被调用')
    
    const targetUrl = `${IPFS_API_URL}/api/v0/files/ls`
    
    const response = await fetch(targetUrl, {
      method: 'POST',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('IPFS files/ls请求失败:', response.status, errorText)
      return NextResponse.json(
        { error: `IPFS请求失败: ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('IPFS files/ls代理错误:', error)
    return NextResponse.json(
      { error: '代理服务器错误' },
      { status: 500 }
    )
  }
}