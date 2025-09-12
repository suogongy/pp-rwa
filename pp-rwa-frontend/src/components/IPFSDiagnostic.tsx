import { useState, useEffect } from 'react'

interface IPFSDiagnosticProps {
  cid?: string
}

export function IPFSDiagnostic({ cid }: IPFSDiagnosticProps) {
  const [diagnosticResults, setDiagnosticResults] = useState<{
    pinStatus?: any
    filesLs?: any
    repoStats?: any
    id?: any
    error?: string
  }>({})

  const [isLoading, setIsLoading] = useState(false)

  const runDiagnostics = async () => {
    setIsLoading(true)
    try {
      const results: any = {}

      // 检查节点ID
      try {
        const idResponse = await fetch('/api/ipfs/id', { method: 'POST' })
        if (idResponse.ok) {
          results.id = await idResponse.json()
        }
      } catch (error) {
        console.error('ID检查失败:', error)
      }

      // 检查pin状态
      if (cid) {
        try {
          const pinResponse = await fetch(`/api/ipfs/pin/ls?arg=${cid}`, { method: 'POST' })
          if (pinResponse.ok) {
            const pinData = await pinResponse.json()
            results.pinStatus = pinData
          }
        } catch (error) {
          console.error('Pin检查失败:', error)
        }
      }

      // 检查文件列表
      try {
        const lsResponse = await fetch('/api/ipfs/files/ls', { method: 'POST' })
        if (lsResponse.ok) {
          results.filesLs = await lsResponse.json()
        }
      } catch (error) {
        console.error('Files检查失败:', error)
      }

      // 检查仓库统计
      try {
        const statsResponse = await fetch('/api/ipfs/repo/stat', { method: 'POST' })
        if (statsResponse.ok) {
          results.repoStats = await statsResponse.json()
        }
      } catch (error) {
        console.error('Stats检查失败:', error)
      }

      setDiagnosticResults(results)
    } catch (error) {
      setDiagnosticResults({ error: error instanceof Error ? error.message : '诊断失败' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [cid])

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">IPFS节点诊断</h3>
        <button
          onClick={runDiagnostics}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? '诊断中...' : '重新诊断'}
        </button>
      </div>

      {diagnosticResults.error && (
        <div className="p-3 bg-red-100 border border-red-300 rounded">
          <div className="text-red-700 font-medium">诊断错误</div>
          <div className="text-red-600 text-sm">{diagnosticResults.error}</div>
        </div>
      )}

      {diagnosticResults.id && (
        <div className="p-3 bg-green-100 border border-green-300 rounded">
          <div className="text-green-700 font-medium">节点信息</div>
          <div className="text-green-600 text-sm">
            ID: {diagnosticResults.id.ID?.substring(0, 20)}...
          </div>
          <div className="text-green-600 text-sm">
            版本: {diagnosticResults.id.AgentVersion}
          </div>
        </div>
      )}

      {diagnosticResults.pinStatus && (
        <div className="p-3 bg-blue-100 border border-blue-300 rounded">
          <div className="text-blue-700 font-medium">Pin状态</div>
          <div className="text-blue-600 text-sm">
            {cid ? (
              diagnosticResults.pinStatus.Keys && diagnosticResults.pinStatus.Keys[cid] ? (
                <span className="text-green-600">✅ 文件已pin</span>
              ) : (
                <span className="text-red-600">❌ 文件未pin</span>
              )
            ) : (
              <span>无CID提供</span>
            )}
          </div>
          <div className="text-blue-600 text-xs mt-1">
            Pin总数: {Object.keys(diagnosticResults.pinStatus.Keys || {}).length}
          </div>
        </div>
      )}

      {diagnosticResults.repoStats && (
        <div className="p-3 bg-purple-100 border border-purple-300 rounded">
          <div className="text-purple-700 font-medium">仓库统计</div>
          <div className="text-purple-600 text-sm">
            仓库大小: {(diagnosticResults.repoStats.RepoSize / 1024 / 1024).toFixed(2)} MB
          </div>
          <div className="text-purple-600 text-sm">
            存储数量: {diagnosticResults.repoStats.NumObjects} 个对象
          </div>
        </div>
      )}

      {cid && (
        <div className="p-3 bg-yellow-100 border border-yellow-300 rounded">
          <div className="text-yellow-700 font-medium">访问测试</div>
          <div className="space-y-2">
            <a
              href={`http://localhost:8080/ipfs/${cid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-blue-600 hover:text-blue-800"
            >
              📂 本地网关: http://localhost:8080/ipfs/{cid}
            </a>
            <a
              href={`https://ipfs.io/ipfs/${cid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-blue-600 hover:text-blue-800"
            >
              🌐 公共网关: https://ipfs.io/ipfs/{cid}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}