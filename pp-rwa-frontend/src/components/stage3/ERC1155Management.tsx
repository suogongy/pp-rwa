'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { rwa1155Contract } from '@/lib/wagmi'
import { ipfsClient, NFTTemplates, ipfsToHttpUrl } from '@/lib/ipfs'

interface TokenInfo {
  name: string
  symbol: string
  totalSupply: bigint
  isMintable: boolean
  isBurnable: boolean
  isTransferable: boolean
}

interface CreateTokenFormData {
  name: string
  symbol: string
  initialSupply: string
  isMintable: boolean
  isBurnable: boolean
  isTransferable: boolean
}

interface MintFormData {
  tokenId: string
  amount: string
  to: string
}

interface TransferFormData {
  to: string
  tokenId: string
  amount: string
}

export function ERC1155Management() {
  const { address, isConnected } = useAccount()

  // 状态管理
  const [createTokenForm, setCreateTokenForm] = useState<CreateTokenFormData>({
    name: '',
    symbol: '',
    initialSupply: '0',
    isMintable: true,
    isBurnable: true,
    isTransferable: true
  })

  const [mintForm, setMintForm] = useState<MintFormData>({
    tokenId: '',
    amount: '',
    to: address || ''
  })

  const [transferForm, setTransferForm] = useState<TransferFormData>({
    to: '',
    tokenId: '',
    amount: ''
  })

  const [whitelistForm, setWhitelistForm] = useState({
    account: '',
    status: true
  })

  const [tokenWhitelistForm, setTokenWhitelistForm] = useState({
    tokenId: '',
    account: '',
    status: true
  })

  const [uriForm, setUriForm] = useState({
    newURI: ''
  })

  // IPFS相关状态
  const [metadataForm, setMetadataForm] = useState({
    name: '',
    description: '',
    tokenId: '',
    imageFile: null as File | null,
    attributes: [] as Array<{ trait_type: string; value: string }>
  })

  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedMetadata, setUploadedMetadata] = useState<{
    imageCid: string
    metadataCid: string
    imageUrl: string
    metadataUrl: string
  } | null>(null)

  const [selectedToken, setSelectedToken] = useState<string>('')

  // 合约交互
  const { writeContract, isPending: writePending, data: writeData } = useWriteContract()
  const { isLoading: confirmLoading, isSuccess: confirmSuccess } = useWaitForTransactionReceipt({
    hash: writeData
  })

  // 读取合约数据
  const { data: tokenCount } = useReadContract({
    ...rwa1155Contract,
    functionName: 'getTokenCount'
  })

  const { data: owner } = useReadContract({
    ...rwa1155Contract,
    functionName: 'owner'
  })

  const { data: tokenInfo } = useReadContract({
    ...rwa1155Contract,
    functionName: 'tokenInfos',
    args: selectedToken ? [BigInt(selectedToken)] : undefined
  })

  const { data: balance } = useReadContract({
    ...rwa1155Contract,
    functionName: 'balanceOf',
    args: address && selectedToken ? [address, BigInt(selectedToken)] : undefined
  })

  const { data: isWhitelisted } = useReadContract({
    ...rwa1155Contract,
    functionName: 'isWhitelisted',
    args: whitelistForm.account ? [whitelistForm.account as `0x${string}`] : undefined
  })

  const isOwner = owner === address

  // 处理创建代币
  const handleCreateToken = async () => {
    if (!isConnected || !isOwner) return

    try {
      await writeContract({
        ...rwa1155Contract,
        functionName: 'createToken',
        args: [
          createTokenForm.name,
          createTokenForm.symbol,
          BigInt(createTokenForm.initialSupply),
          createTokenForm.isMintable,
          createTokenForm.isBurnable,
          createTokenForm.isTransferable,
          '0x'
        ]
      })
    } catch (error) {
      console.error('创建代币失败:', error)
    }
  }

  // 处理铸造代币
  const handleMint = async () => {
    if (!isConnected || !isOwner) return

    try {
      await writeContract({
        ...rwa1155Contract,
        functionName: 'mintBatch',
        args: [
          mintForm.to as `0x${string}`,
          [BigInt(mintForm.tokenId)],
          [BigInt(mintForm.amount)],
          '0x'
        ]
      })
    } catch (error) {
      console.error('铸造代币失败:', error)
    }
  }

  // 处理转账
  const handleTransfer = async () => {
    if (!isConnected || !address) return

    try {
      await writeContract({
        ...rwa1155Contract,
        functionName: 'safeTransferFrom',
        args: [
          address,
          transferForm.to as `0x${string}`,
          BigInt(transferForm.tokenId),
          BigInt(transferForm.amount),
          '0x'
        ]
      })
    } catch (error) {
      console.error('转账失败:', error)
    }
  }

  // 处理设置白名单
  const handleSetWhitelist = async () => {
    if (!isConnected || !isOwner) return

    try {
      await writeContract({
        ...rwa1155Contract,
        functionName: 'setWhitelist',
        args: [
          whitelistForm.account as `0x${string}`,
          whitelistForm.status
        ]
      })
    } catch (error) {
      console.error('设置白名单失败:', error)
    }
  }

  // 处理设置代币白名单
  const handleSetTokenWhitelist = async () => {
    if (!isConnected || !isOwner) return

    try {
      await writeContract({
        ...rwa1155Contract,
        functionName: 'setTokenWhitelist',
        args: [
          BigInt(tokenWhitelistForm.tokenId),
          tokenWhitelistForm.account as `0x${string}`,
          tokenWhitelistForm.status
        ]
      })
    } catch (error) {
      console.error('设置代币白名单失败:', error)
    }
  }

  // 处理设置URI
  const handleSetURI = async () => {
    if (!isConnected || !isOwner) return

    try {
      await writeContract({
        ...rwa1155Contract,
        functionName: 'setURI',
        args: [uriForm.newURI]
      })
    } catch (error) {
      console.error('设置URI失败:', error)
    }
  }

  // 处理图片上传
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setMetadataForm(prev => ({
        ...prev,
        imageFile: file
      }))
    }
  }

  // 处理元数据上传
  const handleMetadataUpload = async () => {
    if (!metadataForm.imageFile || !metadataForm.name || !metadataForm.description) {
      alert('请填写完整的元数据信息')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // 上传图片
      setUploadProgress(25)
      const imageResult = await ipfsClient.uploadFile(metadataForm.imageFile)

      if (!imageResult.success) {
        throw new Error(imageResult.error || '图片上传失败')
      }

      // 创建元数据
      setUploadProgress(50)
      const metadata = {
        name: metadataForm.name,
        description: metadataForm.description,
        image: imageResult.url!,
        attributes: metadataForm.attributes,
        external_url: 'https://pp-rwa.vercel.app',
        background_color: '000000'
      }

      // 上传元数据
      setUploadProgress(75)
      const metadataResult = await ipfsClient.uploadMetadata(metadata)

      if (!metadataResult.success) {
        throw new Error(metadataResult.error || '元数据上传失败')
      }

      setUploadProgress(100)

      // 保存上传结果
      setUploadedMetadata({
        imageCid: imageResult.cid!,
        metadataCid: metadataResult.cid!,
        imageUrl: ipfsToHttpUrl(imageResult.url!),
        metadataUrl: ipfsToHttpUrl(metadataResult.url!)
      })

      // 自动填充URI表单
      const baseURI = metadataResult.url!.replace(`/${metadataResult.cid}`, '')
      setUriForm({ newURI: `${baseURI}/{id}.json` })

      alert('元数据上传成功！')
    } catch (error) {
      console.error('上传失败:', error)
      alert(`上传失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  // 使用预设模板
  const useTemplate = (templateType: 'realEstate' | 'artwork' | 'commodity') => {
    let template
    switch (templateType) {
      case 'realEstate':
        template = NFTTemplates.realEstate('北京市朝阳区', 1000000)
        break
      case 'artwork':
        template = NFTTemplates.artwork('蒙娜丽莎', '达芬奇', 1503)
        break
      case 'commodity':
        template = NFTTemplates.commodity('黄金', 1000, 99.9)
        break
    }

    setMetadataForm(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      attributes: template.attributes || []
    }))
  }

  // 渲染代币信息
  const renderTokenInfo = () => {
    if (!tokenInfo) return null

    const info = tokenInfo as TokenInfo

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>代币信息</CardTitle>
          <CardDescription>Token ID: {selectedToken}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">名称</Label>
              <p className="text-lg font-semibold">{info.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">符号</Label>
              <p className="text-lg font-semibold">{info.symbol}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">总供应量</Label>
              <p className="text-lg font-semibold">{info.totalSupply.toString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">您的余额</Label>
              <p className="text-lg font-semibold">{balance?.toString() || '0'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={info.isMintable ? "default" : "secondary"}>
              {info.isMintable ? "可铸造" : "不可铸造"}
            </Badge>
            <Badge variant={info.isBurnable ? "default" : "secondary"}>
              {info.isBurnable ? "可销毁" : "不可销毁"}
            </Badge>
            <Badge variant={info.isTransferable ? "default" : "secondary"}>
              {info.isTransferable ? "可转移" : "不可转移"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>连接钱包</CardTitle>
          <CardDescription>请连接钱包以使用ERC-1155功能</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">代币类型</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokenCount?.toString() || '0'}</div>
            <p className="text-xs text-muted-foreground">已创建类型</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">合约状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isOwner ? "管理员" : "用户"}
            </div>
            <p className="text-xs text-muted-foreground">
              {isOwner ? "拥有完整权限" : "基础功能权限"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">当前选择</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedToken || '无'}</div>
            <p className="text-xs text-muted-foreground">代币ID</p>
          </CardContent>
        </Card>
      </div>

      {/* 交易状态 */}
      {(writePending || confirmLoading) && (
        <Alert>
          <AlertDescription>
            {writePending ? "等待确认交易..." : "交易处理中..."}
          </AlertDescription>
        </Alert>
      )}

      {confirmSuccess && (
        <Alert>
          <AlertDescription className="text-green-600">
            交易执行成功！
          </AlertDescription>
        </Alert>
      )}

      {/* 主要功能 */}
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="create">创建代币</TabsTrigger>
          <TabsTrigger value="mint">铸造代币</TabsTrigger>
          <TabsTrigger value="transfer">转账</TabsTrigger>
          <TabsTrigger value="whitelist">白名单</TabsTrigger>
          <TabsTrigger value="metadata">元数据</TabsTrigger>
          <TabsTrigger value="settings">设置</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>创建新代币类型</CardTitle>
              <CardDescription>创建新的ERC-1155代币类型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">代币名称</Label>
                  <Input
                    id="name"
                    value={createTokenForm.name}
                    onChange={(e) => setCreateTokenForm({...createTokenForm, name: e.target.value})}
                    placeholder="例如：黄金代币"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="symbol">代币符号</Label>
                  <Input
                    id="symbol"
                    value={createTokenForm.symbol}
                    onChange={(e) => setCreateTokenForm({...createTokenForm, symbol: e.target.value})}
                    placeholder="例如：GOLD"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initialSupply">初始供应量</Label>
                <Input
                  id="initialSupply"
                  type="number"
                  value={createTokenForm.initialSupply}
                  onChange={(e) => setCreateTokenForm({...createTokenForm, initialSupply: e.target.value})}
                  placeholder="0"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="mintable"
                    checked={createTokenForm.isMintable}
                    onCheckedChange={(checked) => setCreateTokenForm({...createTokenForm, isMintable: checked})}
                  />
                  <Label htmlFor="mintable">可铸造</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="burnable"
                    checked={createTokenForm.isBurnable}
                    onCheckedChange={(checked) => setCreateTokenForm({...createTokenForm, isBurnable: checked})}
                  />
                  <Label htmlFor="burnable">可销毁</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="transferable"
                    checked={createTokenForm.isTransferable}
                    onCheckedChange={(checked) => setCreateTokenForm({...createTokenForm, isTransferable: checked})}
                  />
                  <Label htmlFor="transferable">可转移</Label>
                </div>
              </div>

              <Button
                onClick={handleCreateToken}
                disabled={!isOwner || writePending || confirmLoading}
                className="w-full"
              >
                {!isOwner ? "需要管理员权限" : writePending || confirmLoading ? "处理中..." : "创建代币类型"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mint" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>铸造代币</CardTitle>
              <CardDescription>向指定地址铸造代币</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tokenId">代币ID</Label>
                  <Input
                    id="tokenId"
                    type="number"
                    value={mintForm.tokenId}
                    onChange={(e) => setMintForm({...mintForm, tokenId: e.target.value})}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">数量</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={mintForm.amount}
                    onChange={(e) => setMintForm({...mintForm, amount: e.target.value})}
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to">接收地址</Label>
                  <Input
                    id="to"
                    value={mintForm.to}
                    onChange={(e) => setMintForm({...mintForm, to: e.target.value})}
                    placeholder="0x..."
                  />
                </div>
              </div>

              <Button
                onClick={handleMint}
                disabled={!isOwner || writePending || confirmLoading}
                className="w-full"
              >
                {!isOwner ? "需要管理员权限" : writePending || confirmLoading ? "处理中..." : "铸造代币"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>代币转账</CardTitle>
              <CardDescription>转移代币到其他地址</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transferTokenId">代币ID</Label>
                  <Input
                    id="transferTokenId"
                    type="number"
                    value={transferForm.tokenId}
                    onChange={(e) => setTransferForm({...transferForm, tokenId: e.target.value})}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transferAmount">数量</Label>
                  <Input
                    id="transferAmount"
                    type="number"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transferTo">接收地址</Label>
                  <Input
                    id="transferTo"
                    value={transferForm.to}
                    onChange={(e) => setTransferForm({...transferForm, to: e.target.value})}
                    placeholder="0x..."
                  />
                </div>
              </div>

              <Button
                onClick={handleTransfer}
                disabled={writePending || confirmLoading}
                className="w-full"
              >
                {writePending || confirmLoading ? "处理中..." : "转账"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whitelist" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>全局白名单</CardTitle>
                <CardDescription>管理全局白名单地址</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="whitelistAccount">地址</Label>
                    <Input
                      id="whitelistAccount"
                      value={whitelistForm.account}
                      onChange={(e) => setWhitelistForm({...whitelistForm, account: e.target.value})}
                      placeholder="0x..."
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="whitelistStatus"
                      checked={whitelistForm.status}
                      onCheckedChange={(checked) => setWhitelistForm({...whitelistForm, status: checked})}
                    />
                    <Label htmlFor="whitelistStatus">允许</Label>
                  </div>
                </div>

                <Button
                  onClick={handleSetWhitelist}
                  disabled={!isOwner || writePending || confirmLoading}
                  className="w-full"
                >
                  {!isOwner ? "需要管理员权限" : writePending || confirmLoading ? "处理中..." : "设置白名单"}
                </Button>

                {isWhitelisted !== undefined && (
                  <div className="text-sm text-muted-foreground">
                    当前状态: {isWhitelisted ? "在白名单中" : "不在白名单中"}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>代币白名单</CardTitle>
                <CardDescription>管理特定代币的白名单</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tokenWhitelistTokenId">代币ID</Label>
                    <Input
                      id="tokenWhitelistTokenId"
                      type="number"
                      value={tokenWhitelistForm.tokenId}
                      onChange={(e) => setTokenWhitelistForm({...tokenWhitelistForm, tokenId: e.target.value})}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tokenWhitelistAccount">地址</Label>
                    <Input
                      id="tokenWhitelistAccount"
                      value={tokenWhitelistForm.account}
                      onChange={(e) => setTokenWhitelistForm({...tokenWhitelistForm, account: e.target.value})}
                      placeholder="0x..."
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="tokenWhitelistStatus"
                      checked={tokenWhitelistForm.status}
                      onCheckedChange={(checked) => setTokenWhitelistForm({...tokenWhitelistForm, status: checked})}
                    />
                    <Label htmlFor="tokenWhitelistStatus">允许</Label>
                  </div>
                </div>

                <Button
                  onClick={handleSetTokenWhitelist}
                  disabled={!isOwner || writePending || confirmLoading}
                  className="w-full"
                >
                  {!isOwner ? "需要管理员权限" : writePending || confirmLoading ? "处理中..." : "设置代币白名单"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metadata" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>IPFS元数据管理</CardTitle>
              <CardDescription>上传和管理代币的元数据到IPFS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 模板选择 */}
              <div className="space-y-2">
                <Label>快速模板</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => useTemplate('realEstate')}
                  >
                    房地产模板
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => useTemplate('artwork')}
                  >
                    艺术品模板
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => useTemplate('commodity')}
                  >
                    大宗商品模板
                  </Button>
                </div>
              </div>

              {/* 基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="metadataName">代币名称</Label>
                  <Input
                    id="metadataName"
                    value={metadataForm.name}
                    onChange={(e) => setMetadataForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例如：黄金代币"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metadataTokenId">关联代币ID (可选)</Label>
                  <Input
                    id="metadataTokenId"
                    type="number"
                    value={metadataForm.tokenId}
                    onChange={(e) => setMetadataForm(prev => ({ ...prev, tokenId: e.target.value }))}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metadataDescription">描述</Label>
                <Textarea
                  id="metadataDescription"
                  value={metadataForm.description}
                  onChange={(e) => setMetadataForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="详细描述这个代币的特点和价值..."
                  rows={3}
                />
              </div>

              {/* 图片上传 */}
              <div className="space-y-2">
                <Label htmlFor="metadataImage">代币图片</Label>
                <Input
                  id="metadataImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                {metadataForm.imageFile && (
                  <div className="text-sm text-muted-foreground">
                    已选择: {metadataForm.imageFile.name}
                  </div>
                )}
              </div>

              {/* 属性 */}
              <div className="space-y-2">
                <Label>属性 (可选)</Label>
                <div className="space-y-2">
                  {metadataForm.attributes.map((attr, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="属性名"
                        value={attr.trait_type}
                        onChange={(e) => {
                          const newAttributes = [...metadataForm.attributes]
                          newAttributes[index].trait_type = e.target.value
                          setMetadataForm(prev => ({ ...prev, attributes: newAttributes }))
                        }}
                      />
                      <Input
                        placeholder="属性值"
                        value={attr.value}
                        onChange={(e) => {
                          const newAttributes = [...metadataForm.attributes]
                          newAttributes[index].value = e.target.value
                          setMetadataForm(prev => ({ ...prev, attributes: newAttributes }))
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newAttributes = metadataForm.attributes.filter((_, i) => i !== index)
                          setMetadataForm(prev => ({ ...prev, attributes: newAttributes }))
                        }}
                      >
                        删除
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMetadataForm(prev => ({
                        ...prev,
                        attributes: [...prev.attributes, { trait_type: '', value: '' }]
                      }))
                    }}
                  >
                    添加属性
                  </Button>
                </div>
              </div>

              {/* 上传进度 */}
              {isUploading && (
                <div className="space-y-2">
                  <Label>上传进度</Label>
                  <Progress value={uploadProgress} className="w-full" />
                  <div className="text-sm text-muted-foreground">
                    {uploadProgress < 25 && '准备上传...'}
                    {uploadProgress >= 25 && uploadProgress < 50 && '上传图片中...'}
                    {uploadProgress >= 50 && uploadProgress < 75 && '创建元数据中...'}
                    {uploadProgress >= 75 && uploadProgress < 100 && '上传元数据中...'}
                    {uploadProgress >= 100 && '上传完成！'}
                  </div>
                </div>
              )}

              {/* 上传结果 */}
              {uploadedMetadata && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">上传成功！</h4>
                  <div className="space-y-1 text-sm">
                    <div>图片CID: {uploadedMetadata.imageCid}</div>
                    <div>元数据CID: {uploadedMetadata.metadataCid}</div>
                    <div>图片链接: <a href={uploadedMetadata.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{uploadedMetadata.imageUrl}</a></div>
                    <div>元数据链接: <a href={uploadedMetadata.metadataUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{uploadedMetadata.metadataUrl}</a></div>
                  </div>
                </div>
              )}

              {/* 上传按钮 */}
              <Button
                onClick={handleMetadataUpload}
                disabled={!metadataForm.imageFile || !metadataForm.name || !metadataForm.description || isUploading}
                className="w-full"
              >
                {isUploading ? '上传中...' : '上传到IPFS'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>合约设置</CardTitle>
              <CardDescription>管理合约全局设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newURI">基础URI</Label>
                <Textarea
                  id="newURI"
                  value={uriForm.newURI}
                  onChange={(e) => setUriForm({...uriForm, newURI: e.target.value})}
                  placeholder="https://example.com/metadata/{id}.json"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSetURI}
                disabled={!isOwner || writePending || confirmLoading}
                className="w-full"
              >
                {!isOwner ? "需要管理员权限" : writePending || confirmLoading ? "处理中..." : "更新URI"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>代币查询</CardTitle>
              <CardDescription>查看特定代币的详细信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="queryTokenId">代币ID</Label>
                <Input
                  id="queryTokenId"
                  type="number"
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                  placeholder="输入代币ID查看详情"
                />
              </div>

              {selectedToken && renderTokenInfo()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}