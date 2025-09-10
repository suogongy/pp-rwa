/**
 * IPFS 工具类
 * 用于处理NFT元数据的IPFS上传和管理
 */

export interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
  external_url?: string
  animation_url?: string
  background_color?: string
}

export interface UploadResult {
  success: boolean
  cid?: string
  url?: string
  error?: string
}

/**
 * IPFS 客户端类
 */
export class IPFSClient {
  private apiUrl: string
  private apiKey?: string

  constructor(apiUrl: string = 'https://api.pinata.cloud', apiKey?: string) {
    this.apiUrl = apiUrl
    this.apiKey = apiKey
  }

  /**
   * 上传JSON元数据到IPFS
   * @param metadata NFT元数据
   * @returns 上传结果
   */
  async uploadMetadata(metadata: NFTMetadata): Promise<UploadResult> {
    try {
      const response = await fetch(`${this.apiUrl}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          pinataMetadata: {
            name: metadata.name,
            keyvalues: {
              type: 'nft-metadata',
              project: 'rwa-tokenization'
            }
          },
          pinataContent: metadata
        })
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      return {
        success: true,
        cid: data.IpfsHash,
        url: `ipfs://${data.IpfsHash}`
      }
    } catch (error) {
      console.error('IPFS上传失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 上传文件到IPFS
   * @param file 文件对象
   * @returns 上传结果
   */
  async uploadFile(file: File): Promise<UploadResult> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const metadata = JSON.stringify({
        name: file.name,
        keyvalues: {
          type: 'nft-image',
          project: 'rwa-tokenization'
        }
      })
      
      formData.append('pinataMetadata', metadata)

      const response = await fetch(`${this.apiUrl}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      return {
        success: true,
        cid: data.IpfsHash,
        url: `ipfs://${data.IpfsHash}`
      }
    } catch (error) {
      console.error('文件上传失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 从IPFS获取数据
   * @param cid IPFS CID
   * @returns 数据对象
   */
  async fetchFromIPFS<T>(cid: string): Promise<T | null> {
    try {
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`)
      if (!response.ok) {
        throw new Error('获取数据失败')
      }
      return await response.json()
    } catch (error) {
      console.error('从IPFS获取数据失败:', error)
      return null
    }
  }

  /**
   * 创建NFT元数据并上传
   * @param name NFT名称
   * @param description NFT描述
   * @param imageFile 图片文件
   * @param attributes 属性
   * @returns 完整的上传结果
   */
  async createAndUploadNFTMetadata(
    name: string,
    description: string,
    imageFile: File,
    attributes?: Array<{
      trait_type: string
      value: string | number
    }>
  ): Promise<{
    imageResult: UploadResult
    metadataResult: UploadResult
  }> {
    // 首先上传图片
    const imageResult = await this.uploadFile(imageFile)
    
    if (!imageResult.success) {
      return {
        imageResult,
        metadataResult: { success: false, error: '图片上传失败' }
      }
    }

    // 创建元数据
    const metadata: NFTMetadata = {
      name,
      description,
      image: imageResult.url!,
      attributes,
      external_url: 'https://your-project-url.com',
      background_color: '000000'
    }

    // 上传元数据
    const metadataResult = await this.uploadMetadata(metadata)

    return {
      imageResult,
      metadataResult
    }
  }
}

/**
 * 预设的NFT模板
 */
export const NFTTemplates = {
  realEstate: (address: string, value: number) => ({
    name: `RWA房地产代币 #${address.slice(-6)}`,
    description: `现实世界资产代币化 - 位于${address}的房地产，估值${value}美元`,
    attributes: [
      { trait_type: '资产类型', value: '房地产' },
      { trait_type: '位置', value: address },
      { trait_type: '估值', value: `$${value.toLocaleString()}` },
      { trait_type: '代币化日期', value: new Date().toLocaleDateString('zh-CN') }
    ]
  }),

  artwork: (title: string, artist: string, year: number) => ({
    name: `RWA艺术品代币 - ${title}`,
    description: `${artist}创作的艺术品《${title}》，创作于${year}年`,
    attributes: [
      { trait_type: '艺术品类型', value: '绘画' },
      { trait_type: '艺术家', value: artist },
      { trait_type: '创作年份', value: year.toString() },
      { trait_type: '认证状态', value: '已认证' }
    ]
  }),

  commodity: (type: string, weight: number, purity: number) => ({
    name: `RWA大宗商品代币 - ${type}`,
    description: `${type}，重量${weight}克，纯度${purity}%`,
    attributes: [
      { trait_type: '商品类型', value: type },
      { trait_type: '重量', value: `${weight}g` },
      { trait_type: '纯度', value: `${purity}%` },
      { trait_type: '存储状态', value: '安全存储' }
    ]
  })
}

// 创建默认IPFS客户端实例
export const ipfsClient = new IPFSClient(
  process.env.NEXT_PUBLIC_IPFS_API_URL || 'https://api.pinata.cloud',
  process.env.NEXT_PUBLIC_IPFS_API_KEY
)

/**
 * 工具函数：验证IPFS CID
 */
export function isValidIPFSCID(cid: string): boolean {
  // CIDv0 (base58btc)
  const cidv0Regex = /^[1-9A-HJ-NP-Za-km-z]{46}$/
  // CIDv1 (base32)
  const cidv1Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/
  
  return cidv0Regex.test(cid) || cidv1Regex.test(cid)
}

/**
 * 工具函数：将IPFS URI转换为HTTP网关URL
 */
export function ipfsToHttpUrl(ipfsUri: string): string {
  if (ipfsUri.startsWith('ipfs://')) {
    const cid = ipfsUri.replace('ipfs://', '')
    return `https://gateway.pinata.cloud/ipfs/${cid}`
  }
  return ipfsUri
}

/**
 * 工具函数：将HTTP网关URL转换为IPFS URI
 */
export function httpToIpfsUrl(httpUrl: string): string {
  if (httpUrl.includes('gateway.pinata.cloud/ipfs/')) {
    const cid = httpUrl.split('gateway.pinata.cloud/ipfs/')[1]
    return `ipfs://${cid}`
  }
  return httpUrl
}