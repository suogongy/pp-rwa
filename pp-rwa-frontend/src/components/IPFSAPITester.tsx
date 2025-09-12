import { useState } from 'react'

export function IPFSAPITester() {
  const [results, setResults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  const testAPI = async (endpoint: string, description: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ipfs/${endpoint}`, { method: 'POST' })
      const result = {
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : await response.text()
      }
      setResults(prev => ({ ...prev, [endpoint]: { ...result, description } }))
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [endpoint]: { 
          error: error instanceof Error ? error.message : '未知错误', 
          description 
        } 
      }))
    } finally {
      setLoading(false)
    }
  }

  const testAllAPIs = () => {
    const apis = [
      { endpoint: 'id', description: '节点ID' },
      { endpoint: 'pin/ls', description: '列出所有pin' },
      { endpoint: 'repo/stat', description: '仓库统计' },
      { endpoint: 'version', description: 'IPFS版本' }
    ]

    apis.forEach(api => testAPI(api.endpoint, api.description))
  }

  const testFileUpload = async () => {
    setLoading(true)
    try {
      // 创建一个测试文件
      const testContent = '这是一个测试文件，用于IPFS上传测试'
      const blob = new Blob([testContent], { type: 'text/plain' })
      const formData = new FormData()
      formData.append('file', blob, 'test.txt')

      const response = await fetch('/api/ipfs/add?pin=true', {
        method: 'POST',
        body: formData
      })
      
      const result = {
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : await response.text()
      }
      setResults(prev => ({ ...prev, 'file-upload': { ...result, description: '文件上传API' } }))
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        'file-upload': { 
          error: error instanceof Error ? error.message : '未知错误', 
          description: '文件上传API'
        } 
      }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">IPFS API 测试工具</h3>
        <div className="space-x-2">
          <button
            onClick={testFileUpload}
            disabled={loading}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? '测试中...' : '测试文件上传'}
          </button>
          <button
            onClick={testAllAPIs}
            disabled={loading}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '测试中...' : '测试其他API'}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(results).map(([endpoint, result]: [string, any]) => (
          <div key={endpoint} className="p-3 bg-white border rounded">
            <div className="font-medium text-sm">{result.description}</div>
            <div className="text-xs text-gray-600">端点: {endpoint}</div>
            
            {result.status && (
              <div className={`text-xs mt-1 ${
                result.ok ? 'text-green-600' : 'text-red-600'
              }`}>
                状态: {result.status} {result.ok ? '✅' : '❌'}
              </div>
            )}
            
            {result.error && (
              <div className="text-xs text-red-600 mt-1">
                错误: {result.error}
              </div>
            )}
            
            {result.data && (
              <details className="mt-2">
                <summary className="text-xs cursor-pointer text-blue-600">查看响应数据</summary>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}