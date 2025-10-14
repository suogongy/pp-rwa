import { NextRequest, NextResponse } from 'next/server'

// IPFS节点配置
const IPFS_API_URL = 'http://localhost:5001'

export async function POST(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname
    const searchParams = request.nextUrl.searchParams
    
    console.log('IPFS代理收到请求:', {
      pathname,
      searchParams: Object.fromEntries(searchParams.entries())
    })
    
    // 从路径中提取IPFS操作
    // 例如: /api/ipfs/add -> add
    // 例如: /api/ipfs/pin/ls -> pin/ls
    // 例如: /api/ipfs/id -> id
    // 例如: /api/ipfs/files/ls -> files/ls
    const pathParts = pathname.split('/')
    console.log('路径部分:', pathParts)
    
    // 获取ipfs之后的所有部分作为操作
    const ipfsIndex = pathParts.indexOf('ipfs')
    if (ipfsIndex === -1 || ipfsIndex === pathParts.length - 1) {
      return NextResponse.json(
        { error: '无效的IPFS路径' },
        { status: 400 }
      )
    }
    
    const fullOperation = pathParts.slice(ipfsIndex + 1).join('/')
    console.log('完整操作:', fullOperation)
    
    if (!fullOperation) {
      return NextResponse.json(
        { error: '无效的IPFS操作' },
        { status: 400 }
      )
    }

    // 构建目标URL
    const targetUrl = new URL(`${IPFS_API_URL}/api/v0/${fullOperation}`)
    searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value)
    })

    console.log('IPFS代理请求:', {
      operation: fullOperation,
      targetUrl: targetUrl.toString(),
      method: request.method
    })

    // 转发请求到IPFS节点
    let body
    const headers: Record<string, string> = {}
    
    const contentType = request.headers.get('content-type')
    
    if (contentType?.includes('multipart/form-data')) {
      // 处理文件上传
      body = await request.formData()
      // 不设置Content-Type，让浏览器自动设置boundary
    } else {
      // 对于pin/add等操作，IPFS API需要空POST请求
      if (fullOperation === 'pin/add' || fullOperation === 'pin/ls' || fullOperation === 'id' || fullOperation === 'repo/stat' || fullOperation.startsWith('files/')) {
        body = undefined
      } else {
        body = await request.text()
        headers['Content-Type'] = 'application/json'
      }
    }
    
    console.log('IPFS代理请求详情:', {
      operation: fullOperation,
      targetUrl: targetUrl.toString(),
      method: request.method,
      hasBody: !!body,
      headers
    })

    const response = await fetch(targetUrl.toString(), {
      method: 'POST',
      body,
      headers
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('IPFS代理错误:', response.status, errorText)
      return NextResponse.json(
        { error: `IPFS请求失败: ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('IPFS代理错误:', error)
    return NextResponse.json(
      { error: '代理服务器错误' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname
    const searchParams = request.nextUrl.searchParams
    
    // 从路径中提取IPFS操作
    const pathParts = pathname.split('/')
    console.log('GET路径部分:', pathParts)
    
    // 获取ipfs之后的所有部分作为操作
    const ipfsIndex = pathParts.indexOf('ipfs')
    if (ipfsIndex === -1 || ipfsIndex === pathParts.length - 1) {
      return NextResponse.json(
        { error: '无效的IPFS路径' },
        { status: 400 }
      )
    }
    
    const fullOperation = pathParts.slice(ipfsIndex + 1).join('/')
    console.log('GET完整操作:', fullOperation)
    
    if (!fullOperation) {
      return NextResponse.json(
        { error: '无效的IPFS操作' },
        { status: 400 }
      )
    }

    // 构建目标URL
    const targetUrl = new URL(`${IPFS_API_URL}/api/v0/${fullOperation}`)
    searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value)
    })

    console.log('IPFS代理GET请求:', {
      operation: fullOperation,
      targetUrl: targetUrl.toString(),
      method: request.method
    })

    // 转发请求到IPFS节点
    const response = await fetch(targetUrl.toString(), {
      method: 'POST',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('IPFS代理错误:', response.status, errorText)
      return NextResponse.json(
        { error: `IPFS请求失败: ${errorText}` },
        { status: response.status }
      )
    }

    // 对于/cat命令，直接返回二进制数据
    const data = await response.arrayBuffer()
    return new NextResponse(data, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream'
      }
    })
  } catch (error) {
    console.error('IPFS代理错误:', error)
    return NextResponse.json(
      { error: '代理服务器错误' },
      { status: 500 }
    )
  }
}