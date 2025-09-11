"use client";

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Wallet, 
  Users, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Copy,
  ExternalLink,
  Plus,
  Minus,
  Settings,
  Hash,
  DollarSign,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Transaction {
  id: number;
  type: 'ETHER_TRANSFER' | 'ERC20_TRANSFER' | 'ERC721_TRANSFER' | 'ERC1155_TRANSFER' | 'CONTRACT_CALL' | 'BATCH_TRANSFER';
  destination: string;
  value: string;
  data: string;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED';
  signatures: { signer: string; timestamp: number }[];
  createdAt: number;
  deadline: number;
  executor?: string;
  gasUsed?: number;
}

interface Signer {
  address: string;
  active: boolean;
  joinedAt: number;
  transactionCount: number;
}

interface Asset {
  type: 'ETH' | 'ERC20' | 'ERC721' | 'ERC1155';
  address: string;
  symbol: string;
  balance: string;
  decimals?: number;
  tokenId?: string;
}

const RWAMultisigWallet = () => {
  const { address, isConnected } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [signers, setSigners] = useState<Signer[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
  const [signatureThreshold, setSignatureThreshold] = useState<number>(2);
  const [newTransaction, setNewTransaction] = useState({
    type: 'ETHER_TRANSFER' as const,
    destination: '',
    amount: '',
    tokenAddress: '',
    tokenId: '',
    callData: '',
    deadline: '',
  });

  const walletAddress = '0x1234567890123456789012345678901234567890';

  const { writeContract } = useWriteContract();

  // 模拟数据
  useEffect(() => {
    const mockTransactions: Transaction[] = [
      {
        id: 1,
        type: 'ETHER_TRANSFER',
        destination: '0x8765432109876543210987654321098765432109',
        value: '1.5',
        data: '',
        status: 'PENDING',
        signatures: [
          { signer: '0x1234...5678', timestamp: Date.now() - 3600000 },
          { signer: '0x8765...4321', timestamp: Date.now() - 1800000 },
        ],
        createdAt: Date.now() - 7200000,
        deadline: Date.now() + 86400000,
      },
      {
        id: 2,
        type: 'ERC20_TRANSFER',
        destination: '0x5555555555555555555555555555555555555555',
        value: '1000',
        data: '0xa9059cbb0000000000000000000000005555555555555555555555555555555555555555000000000000000000000000000000000000000000000000000000000003e8',
        status: 'EXECUTED',
        signatures: [
          { signer: '0x1234...5678', timestamp: Date.now() - 86400000 },
          { signer: '0x8765...4321', timestamp: Date.now() - 82800000 },
          { signer: '0x1111...2222', timestamp: Date.now() - 79200000 },
        ],
        createdAt: Date.now() - 90000000,
        deadline: Date.now() + 86400000,
        executor: '0x1234...5678',
        gasUsed: 45000,
      },
      {
        id: 3,
        type: 'CONTRACT_CALL',
        destination: '0x9999999999999999999999999999999999999999',
        value: '0',
        data: '0x1234567890abcdef',
        status: 'CANCELLED',
        signatures: [
          { signer: '0x1234...5678', timestamp: Date.now() - 172800000 },
        ],
        createdAt: Date.now() - 180000000,
        deadline: Date.now() + 86400000,
      },
    ];

    const mockSigners: Signer[] = [
      {
        address: '0x1234567890123456789012345678901234567890',
        active: true,
        joinedAt: Date.now() - 2592000000,
        transactionCount: 15,
      },
      {
        address: '0x8765432109876543210987654321098765432109',
        active: true,
        joinedAt: Date.now() - 2160000000,
        transactionCount: 12,
      },
      {
        address: '0x1111111111111111111111111111111111111111',
        active: true,
        joinedAt: Date.now() - 1728000000,
        transactionCount: 8,
      },
    ];

    const mockAssets: Asset[] = [
      {
        type: 'ETH',
        address: 'native',
        symbol: 'ETH',
        balance: '2.5',
      },
      {
        type: 'ERC20',
        address: '0x2222222222222222222222222222222222222222',
        symbol: 'USDC',
        balance: '5000',
        decimals: 6,
      },
      {
        type: 'ERC20',
        address: '0x3333333333333333333333333333333333333333',
        symbol: 'RWA',
        balance: '10000',
        decimals: 18,
      },
    ];

    setTransactions(mockTransactions);
    setSigners(mockSigners);
    setAssets(mockAssets);
  }, []);

  const handleSignTransaction = (transactionId: number) => {
    if (!isConnected) {
      alert('请先连接钱包');
      return;
    }

    writeContract({
      address: walletAddress as `0x${string}`,
      abi: [
        {
          "inputs": [
            {"internalType": "uint256", "name": "transactionId", "type": "uint256"},
            {"internalType": "bytes", "name": "signature", "type": "bytes"}
          ],
          "name": "signTransaction",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
      functionName: 'signTransaction',
      args: [BigInt(transactionId), '0x1234567890abcdef'], // 模拟签名
    });
  };

  const handleExecuteTransaction = (transactionId: number) => {
    if (!isConnected) {
      alert('请先连接钱包');
      return;
    }

    writeContract({
      address: walletAddress as `0x${string}`,
      abi: [
        {
          "inputs": [{"internalType": "uint256", "name": "transactionId", "type": "uint256"}],
          "name": "executeTransaction",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
      functionName: 'executeTransaction',
      args: [BigInt(transactionId)],
    });
  };

  const handleCreateTransaction = () => {
    if (!isConnected || !newTransaction.destination) {
      alert('请填写完整的交易信息');
      return;
    }

    let data = '';
    let value = '0';
    
    switch (newTransaction.type) {
      case 'ETHER_TRANSFER':
        value = newTransaction.amount;
        break;
      case 'ERC20_TRANSFER':
        data = `0xa9059cbb000000000000000000000000${newTransaction.destination.slice(2)}${BigInt(parseEther(newTransaction.amount)).toString(16).padStart(64, '0')}`;
        break;
      case 'CONTRACT_CALL':
        data = newTransaction.callData;
        value = newTransaction.amount;
        break;
    }

    writeContract({
      address: walletAddress as `0x${string}`,
      abi: [
        {
          "inputs": [
            {"internalType": "address", "name": "destination", "type": "address"},
            {"internalType": "uint256", "name": "value", "type": "uint256"},
            {"internalType": "bytes", "name": "data", "type": "bytes"},
            {"internalType": "uint256", "name": "deadline", "type": "uint256"}
          ],
          "name": "createTransaction",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
      functionName: 'createTransaction',
      args: [
        newTransaction.destination as `0x${string}`,
        parseEther(value),
        data as `0x${string}`,
        BigInt(Math.floor(Date.now() / 1000) + 86400) // 24小时后过期
      ],
    });

    setIsCreatingTransaction(false);
    setNewTransaction({
      type: 'ETHER_TRANSFER',
      destination: '',
      amount: '',
      tokenAddress: '',
      tokenId: '',
      callData: '',
      deadline: '',
    });
  };

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'ETHER_TRANSFER': return <DollarSign className="h-4 w-4" />;
      case 'ERC20_TRANSFER': return <Copy className="h-4 w-4" />;
      case 'ERC721_TRANSFER': return <Hash className="h-4 w-4" />;
      case 'ERC1155_TRANSFER': return <Hash className="h-4 w-4" />;
      case 'CONTRACT_CALL': return <ExternalLink className="h-4 w-4" />;
      default: return <Send className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'EXECUTED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'ETHER_TRANSFER': return 'bg-blue-100 text-blue-800';
      case 'ERC20_TRANSFER': return 'bg-green-100 text-green-800';
      case 'ERC721_TRANSFER': return 'bg-purple-100 text-purple-800';
      case 'ERC1155_TRANSFER': return 'bg-indigo-100 text-indigo-800';
      case 'CONTRACT_CALL': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canSign = (transaction: Transaction) => {
    if (!isConnected || transaction.status !== 'PENDING') return false;
    const signerAddress = address?.toLowerCase();
    return signers.some(s => s.address.toLowerCase() === signerAddress && s.active) &&
           !transaction.signatures.some(sig => sig.signer.toLowerCase() === signerAddress);
  };

  const canExecute = (transaction: Transaction) => {
    return transaction.status === 'PENDING' && 
           transaction.signatures.length >= signatureThreshold &&
           new Date(transaction.deadline) > new Date();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">RWA 多签钱包</h1>
          <p className="text-xl text-gray-600">安全的多签名资产管理</p>
        </div>

        {/* 钱包信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">钱包地址</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-mono truncate">
                {walletAddress}
              </div>
              <p className="text-xs text-muted-foreground">多签钱包</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">签名者数量</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{signers.length}</div>
              <p className="text-xs text-muted-foreground">{signatureThreshold} 签名阈值</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待处理交易</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {transactions.filter(t => t.status === 'PENDING').length}
              </div>
              <p className="text-xs text-muted-foreground">需要签名</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ETH 余额</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assets.find(a => a.type === 'ETH')?.balance || '0'} ETH
              </div>
              <p className="text-xs text-muted-foreground">主网币</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="transactions">交易记录</TabsTrigger>
            <TabsTrigger value="assets">资产管理</TabsTrigger>
            <TabsTrigger value="signers">签名者</TabsTrigger>
            <TabsTrigger value="settings">设置</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">交易记录</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    创建交易
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>创建新交易</DialogTitle>
                    <DialogDescription>
                      创建一个新的多签交易，需要足够的签名才能执行。
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>交易类型</Label>
                      <Select value={newTransaction.type} onValueChange={(value) => setNewTransaction({...newTransaction, type: value as any})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ETHER_TRANSFER">ETH 转账</SelectItem>
                          <SelectItem value="ERC20_TRANSFER">ERC20 转账</SelectItem>
                          <SelectItem value="CONTRACT_CALL">合约调用</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>目标地址</Label>
                      <Input
                        value={newTransaction.destination}
                        onChange={(e) => setNewTransaction({...newTransaction, destination: e.target.value})}
                        placeholder="0x1234...5678"
                      />
                    </div>

                    {newTransaction.type === 'ETHER_TRANSFER' && (
                      <div>
                        <Label>金额 (ETH)</Label>
                        <Input
                          type="number"
                          value={newTransaction.amount}
                          onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                          placeholder="0.1"
                        />
                      </div>
                    )}

                    {newTransaction.type === 'ERC20_TRANSFER' && (
                      <>
                        <div>
                          <Label>代币地址</Label>
                          <Input
                            value={newTransaction.tokenAddress}
                            onChange={(e) => setNewTransaction({...newTransaction, tokenAddress: e.target.value})}
                            placeholder="0x2222...3333"
                          />
                        </div>
                        <div>
                          <Label>金额</Label>
                          <Input
                            type="number"
                            value={newTransaction.amount}
                            onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                            placeholder="1000"
                          />
                        </div>
                      </>
                    )}

                    {newTransaction.type === 'CONTRACT_CALL' && (
                      <>
                        <div>
                          <Label>ETH 金额 (可选)</Label>
                          <Input
                            type="number"
                            value={newTransaction.amount}
                            onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label>调用数据 (hex)</Label>
                          <Textarea
                            value={newTransaction.callData}
                            onChange={(e) => setNewTransaction({...newTransaction, callData: e.target.value})}
                            placeholder="0x1234...abcd"
                            rows={3}
                          />
                        </div>
                      </>
                    )}

                    <Button onClick={handleCreateTransaction} className="w-full">
                      创建交易
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-6">
              {transactions.map((transaction) => (
                <Card key={transaction.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(transaction.type)}
                        <div>
                          <CardTitle className="text-lg">交易 #{transaction.id}</CardTitle>
                          <CardDescription>
                            {transaction.destination}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getTypeColor(transaction.type)}>
                          {transaction.type}
                        </Badge>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label className="text-sm font-medium">金额</Label>
                        <p className="text-lg">{transaction.value} {transaction.type === 'ETHER_TRANSFER' ? 'ETH' : ''}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">创建时间</Label>
                        <p className="text-sm">{formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">截止时间</Label>
                        <p className="text-sm">{formatDistanceToNow(new Date(transaction.deadline), { addSuffix: true })}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">签名进度</Label>
                        <p className="text-sm">{transaction.signatures.length} / {signatureThreshold}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <Progress value={(transaction.signatures.length / signatureThreshold) * 100} className="h-2" />
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {transaction.signatures.map((sig, index) => (
                        <Badge key={index} variant="outline">
                          {sig.signer}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      {canSign(transaction) && (
                        <Button onClick={() => handleSignTransaction(transaction.id)}>
                          签名
                        </Button>
                      )}
                      {canExecute(transaction) && (
                        <Button onClick={() => handleExecuteTransaction(transaction.id)} className="bg-green-600 hover:bg-green-700">
                          执行
                        </Button>
                      )}
                      {transaction.status === 'EXECUTED' && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          已执行
                        </Badge>
                      )}
                      {transaction.status === 'CANCELLED' && (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="h-4 w-4 mr-1" />
                          已取消
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assets" className="space-y-6">
            <h2 className="text-2xl font-bold">资产管理</h2>
            <div className="grid gap-6">
              {assets.map((asset, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">{asset.symbol}</h3>
                        <p className="text-sm text-gray-600">{asset.type}</p>
                        <p className="text-2xl font-bold mt-2">{asset.balance}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{asset.address}</p>
                        {asset.decimals && (
                          <p className="text-xs text-gray-500">{asset.decimals} decimals</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="signers" className="space-y-6">
            <h2 className="text-2xl font-bold">签名者管理</h2>
            <div className="grid gap-6">
              {signers.map((signer, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">{signer.address}</h3>
                        <p className="text-sm text-gray-600">
                          加入于 {formatDistanceToNow(new Date(signer.joinedAt), { addSuffix: true })}
                        </p>
                        <p className="text-sm text-gray-600">
                          交易数量: {signer.transactionCount}
                        </p>
                      </div>
                      <div>
                        <Badge className={signer.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {signer.active ? '活跃' : '停用'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold">设置</h2>
            <Card>
              <CardHeader>
                <CardTitle>签名阈值</CardTitle>
                <CardDescription>
                  设置执行交易所需的最小签名数量
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    value={signatureThreshold}
                    onChange={(e) => setSignatureThreshold(parseInt(e.target.value))}
                    min="1"
                    max={signers.length}
                    className="w-20"
                  />
                  <span>/ {signers.length}</span>
                  <Button>更新阈值</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RWAMultisigWallet;