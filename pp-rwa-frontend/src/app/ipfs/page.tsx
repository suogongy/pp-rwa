'use client'

import { useState } from 'react'
import { Navigation } from '@/components/Navigation'
import { WalletConnect } from '@/components/WalletConnect'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { IPFSDiagnostic } from '@/components/IPFSDiagnostic'
import { IPFSAPITester } from '@/components/IPFSAPITester'
import { IPFSHistoryViewer } from '@/components/IPFSHistoryViewer'

export default function IPFSManagementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            IPFS管理中心
          </h1>
          <p className="text-xl text-gray-600">
            去中心化文件存储和管理系统
          </p>
        </header>

        <Navigation />

        <main className="mt-8">
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <WalletConnect />
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>快速导航</CardTitle>
                  <CardDescription>IPFS相关功能</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.location.href = '/stage2?tab=ipfs'}
                  >
                    📤 返回IPFS上传
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open('http://localhost:5001/webui', '_blank')}
                  >
                    🌐 IPFS WebUI
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open('http://localhost:8080', '_blank')}
                  >
                    🚀 本地网关
                  </Button>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>系统状态</CardTitle>
                  <CardDescription>IPFS节点状态</CardDescription>
                </CardHeader>
                <CardContent>
                  <IPFSDiagnostic />
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-3">
              <Tabs defaultValue="history" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="history">历史记录</TabsTrigger>
                  <TabsTrigger value="diagnostic">诊断工具</TabsTrigger>
                  <TabsTrigger value="api-test">API测试</TabsTrigger>
                </TabsList>
                
                <TabsContent value="history" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>IPFS历史记录</CardTitle>
                      <CardDescription>
                        查看和管理您的IPFS上传历史
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <IPFSHistoryViewer />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="diagnostic" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>IPFS节点诊断工具</CardTitle>
                      <CardDescription>
                        检查IPFS节点状态、文件pin情况和仓库信息
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <IPFSDiagnostic />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="api-test" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>IPFS API测试工具</CardTitle>
                      <CardDescription>
                        测试IPFS代理API是否正常工作
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <IPFSAPITester />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* 使用说明和帮助 */}
          <div className="mt-8 grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>使用说明</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">环境变量配置</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>• NEXT_PUBLIC_IPFS_API_URL: 本地IPFS节点URL</div>
                      <div>• NEXT_PUBLIC_IPFS_GATEWAY_URL: IPFS网关URL</div>
                      <div>• 确保IPFS节点正在运行 (ipfs daemon)</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">IPFS数据访问</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>• 本地网关: http://localhost:8080/ipfs/[CID]</div>
                      <div>• 公共网关: https://ipfs.io/ipfs/[CID]</div>
                      <div>• 上传后可直接点击预览按钮访问</div>
                    </div>
                  </div>
                </div>
                
                <Alert>
                  <AlertDescription>
                    <strong>注意：</strong>上传到IPFS的数据是永久性的，请确保您有权利分享这些内容。
                    当前使用本地IPFS节点，请确保IPFS节点正在运行。
                  </AlertDescription>
                </Alert>

                <Alert className="border-blue-200 bg-blue-50">
                  <AlertDescription className="text-blue-700">
                    <strong>💡 WebUI中看不到文件？</strong><br/>
                    • 这是正常现象，上传的文件需要pin后才会在WebUI中显示<br/>
                    • 使用"手动Pin工具"确保文件被正确pin<br/>
                    • 文件可能被存储在IPFS的临时缓存中<br/>
                    • 通过网关URL仍可正常访问文件
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>常见问题</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm">Q: 为什么文件上传后看不到？</h4>
                    <p className="text-sm text-gray-600">A: IPFS文件需要pin操作才能永久保存。系统会自动pin重要文件，但某些文件可能需要手动pin。</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm">Q: 如何查看上传的文件？</h4>
                    <p className="text-sm text-gray-600">A: 使用本地网关 http://localhost:8080/ipfs/[CID] 或公共网关 https://ipfs.io/ipfs/[CID]</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm">Q: IPFS节点连接失败怎么办？</h4>
                    <p className="text-sm text-gray-600">A: 确保IPFS节点正在运行，使用命令 `ipfs daemon` 启动节点。</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm">Q: 如何删除IPFS文件？</h4>
                    <p className="text-sm text-gray-600">A: IPFS是去中心化存储，无法真正删除文件。但可以取消pin操作，让文件从本地节点中移除。</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}