import { useState } from 'react'

interface ManualPinProps {
  cid?: string
  onPinComplete?: (success: boolean) => void
}

export function ManualPin({ cid, onPinComplete }: ManualPinProps) {
  const [isPinning, setIsPinning] = useState(false)
  const [pinResult, setPinResult] = useState<string>('')

  const manualPin = async () => {
    if (!cid) {
      setPinResult('错误：没有提供CID')
      return
    }

    setIsPinning(true)
    setPinResult('')

    try {
      // 手动pin文件
      const pinResponse = await fetch(`/api/ipfs/pin/add?arg=${cid}`, {
        method: 'POST'
      })

      console.log('Pin响应:', {
        status: pinResponse.status,
        ok: pinResponse.ok,
        url: pinResponse.url
      })

      if (pinResponse.ok) {
        const pinData = await pinResponse.json()
        console.log('Pin响应数据:', pinData)
        setPinResult(`✅ Pin成功: ${pinData.Pins?.[0] || cid}`)
        onPinComplete?.(true)
      } else {
        const errorText = await pinResponse.text()
        console.error('Pin失败:', errorText)
        setPinResult(`❌ Pin失败: ${errorText}`)
        onPinComplete?.(false)
      }
    } catch (error) {
      console.error('Pin错误:', error)
      setPinResult(`❌ Pin错误: ${error instanceof Error ? error.message : '未知错误'}`)
      onPinComplete?.(false)
    } finally {
      setIsPinning(false)
    }
  }

  const checkPinStatus = async () => {
    if (!cid) {
      setPinResult('错误：没有提供CID')
      return
    }

    setIsPinning(true)
    setPinResult('')

    try {
      // 检查pin状态
      const pinResponse = await fetch(`/api/ipfs/pin/ls?arg=${cid}`, {
        method: 'POST'
      })

      console.log('Pin检查响应:', {
        status: pinResponse.status,
        ok: pinResponse.ok,
        url: pinResponse.url
      })

      if (pinResponse.ok) {
        const pinData = await pinResponse.json()
        console.log('Pin检查响应数据:', pinData)
        if (pinData.Keys && pinData.Keys[cid]) {
          setPinResult(`✅ 文件已pin: ${cid}`)
        } else {
          setPinResult(`❌ 文件未pin: ${cid}`)
        }
      } else {
        const errorText = await pinResponse.text()
        console.error('Pin检查失败:', errorText)
        setPinResult(`❌ 检查失败: ${errorText}`)
      }
    } catch (error) {
      console.error('Pin检查错误:', error)
      setPinResult(`❌ 检查错误: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsPinning(false)
    }
  }

  return (
    <div className="space-y-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
      <h4 className="font-medium text-orange-800">手动Pin工具</h4>
      <p className="text-sm text-orange-600">
        如果上传的文件在IPFS WebUI中不可见，可能需要手动pin
      </p>
      
      <div className="flex gap-2">
        <button
          onClick={manualPin}
          disabled={!cid || isPinning}
          className="px-3 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
        >
          {isPinning ? 'Pin中...' : '手动Pin'}
        </button>
        <button
          onClick={checkPinStatus}
          disabled={!cid || isPinning}
          className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          检查状态
        </button>
      </div>

      {pinResult && (
        <div className={`p-2 rounded text-sm ${
          pinResult.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {pinResult}
        </div>
      )}

      {cid && (
        <div className="text-xs text-orange-500">
          CID: {cid}
        </div>
      )}
    </div>
  )
}