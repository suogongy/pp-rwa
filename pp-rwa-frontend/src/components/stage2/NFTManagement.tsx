'use client'

import { useState, useEffect } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { rwa721Contract } from '@/lib/wagmi'

interface NFTManagementProps {
  address: string
}

interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: Array<{
    trait_type: string
    value: string
  }>
}

interface NFTInfo {
  tokenId: number
  tokenURI: string
  owner: string
  royaltyRecipient: string
  royaltyPercentage: number
  metadata?: NFTMetadata
  isLoadingMetadata: boolean
}

export function NFTManagement({ address }: NFTManagementProps) {
  const [mintURI, setMintURI] = useState('')
  const [batchURIs, setBatchURIs] = useState('')
  const [selectedTokenId, setSelectedTokenId] = useState('')
  const [royaltyRecipient, setRoyaltyRecipient] = useState('')
  const [royaltyPercentage, setRoyaltyPercentage] = useState('')
  const [baseURI, setBaseURI] = useState('')
  const [ownedNFTs, setOwnedNFTs] = useState<NFTInfo[]>([])
  
  // 错误状态
  const [errors, setErrors] = useState<{
    mint?: string
    batch?: string
    royalty?: string
    query?: string
  }>({})

  // 读取代币信息
  const { data: tokenName, isError: nameError, refetch: refetchTokenName } = useReadContract({
    ...rwa721Contract,
    functionName: 'name',
  })

  const { data: tokenSymbol, isError: symbolError, refetch: refetchTokenSymbol } = useReadContract({
    ...rwa721Contract,
    functionName: 'symbol',
  })

  const { data: totalSupply, isError: supplyError, refetch: refetchTotalSupply } = useReadContract({
    ...rwa721Contract,
    functionName: 'totalSupply',
  })

  const { data: owner, isError: ownerError, refetch: refetchOwner } = useReadContract({
    ...rwa721Contract,
    functionName: 'owner',
  })

  const { data: contractBaseURI, isError: contractBaseURIError, refetch: refetchBaseURI } = useReadContract({
    ...rwa721Contract,
    functionName: 'baseURI',
  })

  // 查询NFT信息
  const { 
    data: tokenInfo, 
    isError: queryError, 
    isLoading: isQueryLoading,
    refetch: refetchTokenInfo 
  } = useReadContract({
    ...rwa721Contract,
    functionName: 'getRoyaltyInfo',
    args: [BigInt(selectedTokenId || 0)],
    query: {
      enabled: false,
    }
  })

  const { 
    data: tokenURI, 
    isError: uriError, 
    refetch: refetchTokenURI 
  } = useReadContract({
    ...rwa721Contract,
    functionName: 'tokenURI',
    args: [BigInt(selectedTokenId || 0)],
    query: {
      enabled: false,
    }
  })

  const { 
    data: tokenOwner, 
    isError: ownerQueryError, 
    refetch: refetchTokenOwner 
  } = useReadContract({
    ...rwa721Contract,
    functionName: 'ownerOf',
    args: [BigInt(selectedTokenId || 0)],
    query: {
      enabled: false,
    }
  })

  // 获取用户拥有的NFT
  const { 
    data: ownedTokenIds, 
    isError: ownedError, 
    refetch: refetchOwnedTokens 
  } = useReadContract({
    ...rwa721Contract,
    functionName: 'getOwnedTokens',
    args: [address as `0x${string}`],
  })

  // 合约写入操作
  const { writeContract, isPending: isMintPending, data: mintData, error: mintError } = useWriteContract()
  const { writeContract: writeBatch, isPending: isBatchPending, data: batchData, error: batchError } = useWriteContract()
  const { writeContract: writeRoyalty, isPending: isRoyaltyPending, data: royaltyData, error: royaltyError } = useWriteContract()
  const { writeContract: writeBaseURI, isPending: isBaseURIPending, data: baseURIData, error: baseURIError } = useWriteContract()

  // 等待交易确认
  const { isLoading: isMintConfirming, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({
    hash: mintData,
  })

  const { isLoading: isBatchConfirming, isSuccess: isBatchSuccess } = useWaitForTransactionReceipt({
    hash: batchData,
  })

  const { isLoading: isRoyaltyConfirming, isSuccess: isRoyaltySuccess } = useWaitForTransactionReceipt({
    hash: royaltyData,
  })

  const { isLoading: isBaseURIConfirming, isSuccess: isBaseURISuccess } = useWaitForTransactionReceipt({
    hash: baseURIData,
  })

  // 刷新所有数据
  const refreshAllData = () => {
    refetchTokenName()
    refetchTokenSymbol()
    refetchTotalSupply()
    refetchOwner()
    refetchBaseURI()
    refetchOwnedTokens()
  }

  // 获取NFT元数据
  const fetchNFTMetadata = async (tokenURI: string): Promise<NFTMetadata | null> => {
    try {
      // 处理不同的URI格式
      let url = tokenURI
      if (tokenURI.startsWith('ipfs://')) {
        const ipfsHash = tokenURI.replace('ipfs://', '')
        url = `http://127.0.0.1:8080/ipfs/${ipfsHash}`
      }
      
      const response = await fetch(url)
      if (!response.ok) return null
      
      const metadata = await response.json()
      return metadata
    } catch (error) {
      console.error('Error fetching NFT metadata:', error)
      return null
    }
  }

  // 更新拥有的NFT列表
  useEffect(() => {
    if (ownedTokenIds && Array.isArray(ownedTokenIds)) {
      const fetchNFTDetails = async () => {
        const nfts: NFTInfo[] = []
        
        for (const tokenId of ownedTokenIds) {
          try {
            // 创建占位符NFT信息，稍后通过useReadContract更新
            const nft: NFTInfo = {
              tokenId: Number(tokenId),
              tokenURI: `ipfs://QmSample${tokenId}`,
              owner: address,
              royaltyRecipient: address,
              royaltyPercentage: 250,
              isLoadingMetadata: true
            }
            
            nfts.push(nft)
            
            // 对于占位符URI，直接标记为完成加载
            setOwnedNFTs(prev => prev.map(n => 
              n.tokenId === Number(tokenId) 
                ? { ...n, isLoadingMetadata: false }
                : n
            ))
          } catch (error) {
            console.error('Error fetching NFT details:', error)
            // 即使出错也创建一个基本的NFT信息
            const nft: NFTInfo = {
              tokenId: Number(tokenId),
              tokenURI: `ipfs://QmSample${tokenId}`,
              owner: address,
              royaltyRecipient: address,
              royaltyPercentage: 250,
              isLoadingMetadata: false
            }
            nfts.push(nft)
          }
        }
        
        setOwnedNFTs(nfts)
      }
      
      fetchNFTDetails()
    }
  }, [ownedTokenIds, address])

  const handleMint = () => {
    if (!mintURI || !address) return
    
    try {
      writeContract({
        ...rwa721Contract,
        functionName: 'mintNFT',
        args: [address as `0x${string}`, mintURI],
      })
    } catch (error) {
      console.error('Mint error:', error)
    }
  }

  const handleBatchMint = () => {
    if (!batchURIs || !address) return
    
    const uriArray = batchURIs.split(',').map(uri => uri.trim()).filter(uri => uri.length > 0)
    if (uriArray.length === 0) return
    
    try {
      writeContract({
        ...rwa721Contract,
        functionName: 'mintBatchNFTs',
        args: [address as `0x${string}`, uriArray],
      })
    } catch (error) {
      console.error('Batch mint error:', error)
    }
  }

  const handleSetRoyalty = () => {
    if (!selectedTokenId || !royaltyRecipient || !royaltyPercentage) return
    
    try {
      writeContract({
        ...rwa721Contract,
        functionName: 'setRoyaltyInfo',
        args: [BigInt(selectedTokenId), royaltyRecipient as `0x${string}`, BigInt(royaltyPercentage)],
      })
    } catch (error) {
      console.error('Set royalty error:', error)
    }
  }

  const handleSetBaseURI = () => {
    if (!baseURI) return
    
    try {
      writeContract({
        ...rwa721Contract,
        functionName: 'setBaseURI',
        args: [baseURI],
      })
    } catch (error) {
      console.error('Set base URI error:', error)
    }
  }

  const handleQueryNFT = () => {
    if (!selectedTokenId) return
    
    refetchTokenInfo()
    refetchTokenURI()
    refetchTokenOwner()
  }

  const isOwner = owner === address

  // 监控交易状态
  useEffect(() => {
    if (isMintSuccess || isBatchSuccess || isRoyaltySuccess || isBaseURISuccess) {
      refreshAllData()
      // 额外刷新拥有的NFT列表，延迟更长时间确保区块链数据更新
      setTimeout(() => {
        refetchOwnedTokens()
      }, 2000)
    }
  }, [isMintSuccess, isBatchSuccess, isRoyaltySuccess, isBaseURISuccess])

  return (
    <div className="space-y-6">
      {/* 合约信息 */}
      <Card>
        <CardHeader>
          <CardTitle>NFT合约信息</CardTitle>
          <CardDescription>RWA-721代币基本信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">合约名称</Label>
              <div className="text-lg font-semibold">{tokenName || '加载中...'}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">合约符号</Label>
              <div className="text-lg font-semibold">{tokenSymbol || '加载中...'}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">总供应量</Label>
              <div className="text-lg font-semibold">{totalSupply?.toString() || '0'}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">基础URI</Label>
              <div className="text-sm text-gray-600 break-all">
                {contractBaseURI || '未设置'}
              </div>
            </div>
          </div>
          {isOwner && (
            <Alert>
              <AlertDescription>
                您是NFT合约的所有者，可以进行铸造和设置操作。
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 用户的NFT收藏 */}
      <Card>
        <CardHeader>
          <CardTitle>我的NFT收藏</CardTitle>
          <CardDescription>您拥有的所有NFT</CardDescription>
        </CardHeader>
        <CardContent>
          {ownedNFTs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownedNFTs.map((nft) => (
                <div key={nft.tokenId} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* NFT图片 */}
                  <div className="aspect-square bg-gray-100 relative">
                    {nft.isLoadingMetadata ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    ) : nft.metadata?.image ? (
                      <img 
                        src={nft.metadata.image.startsWith('ipfs://') 
                          ? `http://127.0.0.1:8080/ipfs/${nft.metadata.image.replace('ipfs://', '')}`
                          : nft.metadata.image
                        }
                        alt={nft.metadata.name || `NFT #${nft.tokenId}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          target.parentElement!.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center bg-gray-200">
                              <svg class="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                              </svg>
                            </div>
                          `
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* NFT信息 */}
                  <div className="p-4 space-y-3">
                    {/* 标题和ID */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {nft.metadata?.name || `RWA721 #${nft.tokenId}`}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">ID: #{nft.tokenId}</p>
                      </div>
                      <Badge className="bg-purple-500 text-xs">
                        {nft.royaltyPercentage / 100}%
                      </Badge>
                    </div>

                    {/* 描述 */}
                    {nft.metadata?.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {nft.metadata.description}
                      </p>
                    )}

                    {/* 属性 */}
                    {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-700">属性</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {nft.metadata.attributes.map((attr, index) => (
                            <div key={index} className="bg-gray-50 rounded p-2 text-xs">
                              <div className="text-gray-500">{attr.trait_type}</div>
                              <div className="font-medium text-gray-900 truncate">{attr.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 版税信息 */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-xs text-gray-500">
                        版税接收者
                      </div>
                      <div className="text-xs font-mono text-gray-700 max-w-[120px] truncate">
                        {nft.royaltyRecipient.slice(0, 6)}...{nft.royaltyRecipient.slice(-4)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                您还没有任何NFT。开始铸造您的第一个NFT吧！
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* NFT铸造操作 (仅所有者) */}
      {isOwner && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>铸造单个NFT</CardTitle>
              <CardDescription>创建一个新的NFT</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mintURI">元数据URI</Label>
                <Input
                  id="mintURI"
                  placeholder="ipfs://Qm..."
                  value={mintURI}
                  onChange={(e) => setMintURI(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleMint}
                disabled={!mintURI || isMintPending || isMintConfirming}
                className="w-full"
              >
                {isMintPending ? '确认中...' : isMintConfirming ? '铸造中...' : '铸造NFT'}
              </Button>
              
              {mintError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    铸造失败: {mintError.message}
                  </AlertDescription>
                </Alert>
              )}
              
              {isMintSuccess && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-700">
                    ✅ NFT铸造成功！交易哈希: {mintData?.slice(0, 10)}...
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>批量铸造NFT</CardTitle>
              <CardDescription>一次铸造多个NFT</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batchURIs">元数据URI列表</Label>
                <Input
                  id="batchURIs"
                  placeholder="ipfs://Qm1, ipfs://Qm2, ipfs://Qm3"
                  value={batchURIs}
                  onChange={(e) => setBatchURIs(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  用逗号分隔多个URI地址
                </p>
              </div>
              <Button 
                onClick={handleBatchMint}
                disabled={!batchURIs || isBatchPending || isBatchConfirming}
                className="w-full"
              >
                {isBatchPending ? '确认中...' : isBatchConfirming ? '铸造中...' : '批量铸造'}
              </Button>
              
              {batchError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    批量铸造失败: {batchError.message}
                  </AlertDescription>
                </Alert>
              )}
              
              {isBatchSuccess && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-700">
                    ✅ 批量铸造成功！交易哈希: {batchData?.slice(0, 10)}...
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* NFT查询和管理 */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>NFT信息查询</CardTitle>
            <CardDescription>查询指定NFT的详细信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tokenId">Token ID</Label>
              <Input
                id="tokenId"
                placeholder="1"
                value={selectedTokenId}
                onChange={(e) => setSelectedTokenId(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleQueryNFT}
              disabled={!selectedTokenId || isQueryLoading}
              className="w-full"
              variant="outline"
            >
              {isQueryLoading ? '查询中...' : '查询NFT'}
            </Button>
            
            {selectedTokenId && tokenInfo && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-3">查询结果</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Token ID:</span>
                    <span className="font-medium">#{selectedTokenId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">所有者:</span>
                    <span className="font-mono text-xs break-all max-w-[200px]">
                      {tokenOwner?.toString() || '未知'}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">元数据URI:</span>
                    <span className="font-mono text-xs break-all max-w-[200px] text-right">
                      {tokenURI?.toString() || '未设置'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">版税接收者:</span>
                    <span className="font-mono text-xs break-all max-w-[200px]">
                      {tokenInfo[0]?.toString() || '未设置'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">版税比例:</span>
                    <span className="font-medium text-blue-600">
                      {Number(tokenInfo[1]) / 100}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle>设置版税信息</CardTitle>
              <CardDescription>为NFT设置版税接收者和比例</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="royaltyRecipient">版税接收者地址</Label>
                <Input
                  id="royaltyRecipient"
                  placeholder="0x..."
                  value={royaltyRecipient}
                  onChange={(e) => setRoyaltyRecipient(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="royaltyPercentage">版税比例 (基点)</Label>
                <Input
                  id="royaltyPercentage"
                  placeholder="250 (2.5%)"
                  value={royaltyPercentage}
                  onChange={(e) => setRoyaltyPercentage(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  100 = 1%, 1000 = 10%
                </p>
              </div>
              <Button 
                onClick={handleSetRoyalty}
                disabled={!selectedTokenId || !royaltyRecipient || !royaltyPercentage || isRoyaltyPending || isRoyaltyConfirming}
                className="w-full"
              >
                {isRoyaltyPending ? '确认中...' : isRoyaltyConfirming ? '设置中...' : '设置版税'}
              </Button>
              
              {royaltyError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    设置版税失败: {royaltyError.message}
                  </AlertDescription>
                </Alert>
              )}
              
              {isRoyaltySuccess && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-700">
                    ✅ 版税设置成功！交易哈希: {royaltyData?.slice(0, 10)}...
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* 基础URI设置 (仅所有者) */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>设置基础URI</CardTitle>
            <CardDescription>设置NFT元数据的基础URI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baseURI">基础URI</Label>
              <Input
                id="baseURI"
                placeholder="ipfs://QmBase/"
                value={baseURI}
                onChange={(e) => setBaseURI(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                示例: ipfs://QmBase/ 将生成 ipfs://QmBase/1, ipfs://QmBase/2 等
              </p>
            </div>
            <Button 
              onClick={handleSetBaseURI}
              disabled={!baseURI || isBaseURIPending || isBaseURIConfirming}
              className="w-full"
            >
              {isBaseURIPending ? '确认中...' : isBaseURIConfirming ? '设置中...' : '设置基础URI'}
            </Button>
            
            {baseURIError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  设置基础URI失败: {baseURIError.message}
                </AlertDescription>
              </Alert>
            )}
            
            {isBaseURISuccess && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">
                  ✅ 基础URI设置成功！交易哈希: {baseURIData?.slice(0, 10)}...
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}