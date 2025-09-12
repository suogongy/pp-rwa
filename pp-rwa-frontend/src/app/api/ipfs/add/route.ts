import { NextRequest, NextResponse } from 'next/server'

// IPFS节点配置
const IPFS_API_URL = 'http://localhost:5001'

export async function POST(request: NextRequest) {
  try {
    console.log('IPFS add API被调用')
    
    const searchParams = request.nextUrl.searchParams
    const pin = searchParams.get('pin') === 'true'
    
    const targetUrl = new URL(`${IPFS_API_URL}/api/v0/add`)
    if (pin) {
      targetUrl.searchParams.append('pin', 'true')
    }
    
    const contentType = request.headers.get('content-type')
    
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData()
      
      const response = await fetch(targetUrl.toString(), {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('IPFS add请求失败:', response.status, errorText)
        return NextResponse.json(
          { error: `IPFS请求失败: ${errorText}` },
          { status: response.status }
        )
      }

      const data = await response.json()
      return NextResponse.json(data)
    } else {
      return NextResponse.json(
        { error: '需要multipart/form-data格式' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('IPFS add代理错误:', error)
    return NextResponse.json(
      { error: '代理服务器错误' },
      { status: 500 }
    )
  }
}