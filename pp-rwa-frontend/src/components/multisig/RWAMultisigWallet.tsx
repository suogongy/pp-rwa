"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useWatchContractEvent } from 'wagmi';
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
import { RWAMultisigWallet_ADDRESS, RWAMultisigWallet_ABI } from '@/lib/wagmi';

interface Transaction {
  id: bigint;
  type: 'ETHER_TRANSFER' | 'ERC20_TRANSFER' | 'ERC721_TRANSFER' | 'ERC1155_TRANSFER' | 'CONTRACT_CALL' | 'BATCH_TRANSFER';
  destination: string;
  value: bigint;
  data: string;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED';
  signatures: { signer: string; timestamp: bigint }[];
  createdAt: bigint;
  deadline: bigint;
  executor?: string;
  gasUsed?: bigint;
}

interface Signer {
  address: string;
  active: boolean;
  joinedAt: bigint;
  transactionCount: bigint;
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
  const [signatureThreshold, setSignatureThreshold] = useState<bigint>(2n);
  const [newTransaction, setNewTransaction] = useState({
    type: 'ETHER_TRANSFER' as const,
    destination: '',
    amount: '',
    tokenAddress: '',
    tokenId: '',
    callData: '',
    deadline: '',
  });

  const { writeContract, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // 获取签名者列表
  const { data: owners, error: ownersError, isLoading: ownersLoading } = useReadContract({
    address: RWAMultisigWallet_ADDRESS,
    abi: RWAMultisigWallet_ABI,
    functionName: 'getActiveSigners',
    query: {
      enabled: !!RWAMultisigWallet_ADDRESS,
    }
  });

  // 获取签名阈值
  const { data: threshold, error: thresholdError } = useReadContract({
    address: RWAMultisigWallet_ADDRESS,
    abi: RWAMultisigWallet_ABI,
    functionName: 'signatureThreshold',
    query: {
      enabled: !!RWAMultisigWallet_ADDRESS,
    }
  });

  // 获取合约余额
  const { data: contractBalance } = useReadContract({
    address: RWAMultisigWallet_ADDRESS,
    abi: [
      {
        inputs: [],
        name: 'getBalance',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'getBalance',
  });

  // 获取交易详情
  const getTransactionDetails = useCallback(async (transactionId: bigint): Promise<Transaction | null> => {
    try {
      const txData = await fetch(`/api/transaction/${transactionId.toString()}`).then(res => res.json());
      
      if (!txData) return null;

      return {
        id: transactionId,
        type: txData.transactionType,
        destination: txData.destination,
        value: BigInt(txData.value),
        data: txData.data,
        status: txData.status === 0 ? 'PENDING' : txData.status === 1 ? 'EXECUTED' : 'CANCELLED',
        signatures: txData.signatures || [],
        createdAt: BigInt(txData.timestamp),
        deadline: BigInt(txData.deadline),
        executor: txData.executor,
        gasUsed: txData.gasUsed ? BigInt(txData.gasUsed) : undefined,
      };
    } catch (error) {
      console.error(`获取交易 ${transactionId.toString()} 详情失败:`, error);
      return null;
    }
  }, []);

  // 加载交易列表
  const loadTransactions = useCallback(async () => {
    try {
      console.log('加载交易列表...');
      const loadedTransactions: Transaction[] = [];
      
      // 遍历可能存在的交易ID
      for (let i = 1; i <= 50; i++) {
        const txDetails = await getTransactionDetails(BigInt(i));
        if (txDetails) {
          loadedTransactions.push(txDetails);
        }
      }
      
      // 按时间倒序排列
      loadedTransactions.sort((a, b) => b.createdAt > a.createdAt ? 1 : -1);
      setTransactions(loadedTransactions);
      console.log(`成功加载 ${loadedTransactions.length} 笔交易`);
    } catch (error) {
      console.error('加载交易列表失败:', error);
    }
  }, [getTransactionDetails]);

  // 监听交易事件
  useWatchContractEvent({
    address: RWAMultisigWallet_ADDRESS,
    abi: RWAMultisigWallet_ABI,
    eventName: 'TransactionCreated',
    onLogs: () => {
      console.log('监听到新交易创建');
      loadTransactions();
    },
  });

  useWatchContractEvent({
    address: RWAMultisigWallet_ADDRESS,
    abi: RWAMultisigWallet_ABI,
    eventName: 'TransactionSigned',
    onLogs: () => {
      console.log('监听到交易签名');
      loadTransactions();
    },
  });

  useWatchContractEvent({
    address: RWAMultisigWallet_ADDRESS,
    abi: RWAMultisigWallet_ABI,
    eventName: 'TransactionExecuted',
    onLogs: () => {
      console.log('监听到交易执行');
      loadTransactions();
    },
  });

  // 初始化数据
  useEffect(() => {
    if (owners && Array.isArray(owners)) {
      const formattedSigners: Signer[] = owners.map((owner, index) => ({
        address: owner,
        active: true,
        joinedAt: BigInt(Date.now() - index * 86400000),
        transactionCount: BigInt(0),
      }));
      setSigners(formattedSigners);
    }
  }, [owners]);

  useEffect(() => {
    if (threshold) {
      setSignatureThreshold(BigInt(threshold));
    }
  }, [threshold]);

  useEffect(() => {
    if (RWAMultisigWallet_ADDRESS) {
      loadTransactions();
    }
  }, [RWAMultisigWallet_ADDRESS, loadTransactions]);

  // 更新资产列表
  useEffect(() => {
    const updatedAssets: Asset[] = [];
    
    if (contractBalance) {
      updatedAssets.push({
        type: 'ETH',
        address: 'native',
        symbol: 'ETH',
        balance: formatEther(contractBalance),
      });
    }
    
    setAssets(updatedAssets);
  }, [contractBalance]);

  const handleSignTransaction = async (transactionId: bigint) => {
    if (!isConnected || !address) {
      alert('请先连接钱包');
      return;
    }

    try {
      // 这里需要实现真实的签名逻辑
      // 由于签名需要用户的私钥，这里简化处理
      writeContract({
        address: RWAMultisigWallet_ADDRESS as `0x${string}`,
        abi: RWAMultisigWallet_ABI,
        functionName: 'signTransaction',
        args: [transactionId, '0x'], // 真实应用中需要生成正确的签名
      });
    } catch (error) {
      console.error('签名失败:', error);
      alert('签名失败，请查看控制台');
    }
  };

  const handleExecuteTransaction = async (transactionId: bigint) => {
    if (!isConnected || !address) {
      alert('请先连接钱包');
      return;
    }

    try {
      writeContract({
        address: RWAMultisigWallet_ADDRESS as `0x${string}`,
        abi: RWAMultisigWallet_ABI,
        functionName: 'executeTransaction',
        args: [transactionId],
      });
    } catch (error) {
      console.error('执行失败:', error);
      alert('执行失败，请查看控制台');
    }
  };

  const handleCreateTransaction = async () => {
    if (!isConnected || !address || !newTransaction.destination) {
      alert('请填写完整的交易信息');
      return;
    }

    try {
      let data = '0x';
      let value = 0n;
      
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400); // 24小时后过期
      
      switch (newTransaction.type) {
        case 'ETHER_TRANSFER':
          value = parseEther(newTransaction.amount || '0');
          break;
        case 'ERC20_TRANSFER':
          if (!newTransaction.tokenAddress) {
            alert('请输入代币地址');
            return;
          }
          // ERC20 transfer function signature
          data = '0xa9059cbb' + 
                  newTransaction.destination.slice(2).padStart(64, '0') + 
                  parseEther(newTransaction.amount || '0').toString(16).padStart(64, '0');
          break;
        case 'CONTRACT_CALL':
          data = newTransaction.callData || '0x';
          value = parseEther(newTransaction.amount || '0');
          break;
      }

      writeContract({
        address: RWAMultisigWallet_ADDRESS as `0x${string}`,
        abi: RWAMultisigWallet_ABI,
        functionName: 'createEtherTransaction',
        args: [
          newTransaction.destination as `0x${string}`,
          value,
          deadline
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
    } catch (error) {
      console.error('创建交易失败:', error);
      alert('创建交易失败，请查看控制台');
    }
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
    if (!isConnected || !address || transaction.status !== 'PENDING') return false;
    const signerAddress = address.toLowerCase();
    return signers.some(s => s.address.toLowerCase() === signerAddress && s.active);
  };

  const canExecute = (transaction: Transaction) => {
    return transaction.status === 'PENDING' && 
           transaction.signatures.length >= Number(signatureThreshold) &&
           transaction.deadline > BigInt(Math.floor(Date.now() / 1000));
  };

  if (!RWAMultisigWallet_ADDRESS) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">多签钱包未配置</h1>
            <p className="text-xl text-gray-600">请先部署多重签名钱包合约</p>
          </div>
        </div>
      </div>
    );
  }

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
                {RWAMultisigWallet_ADDRESS}
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
              <p className="text-xs text-muted-foreground">{signatureThreshold.toString()} 签名阈值</p>
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
                {contractBalance ? formatEther(contractBalance) : '0'} ETH
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

                    <Button onClick={handleCreateTransaction} className="w-full" disabled={isPending}>
                      {isPending ? '创建中...' : '创建交易'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-6">
              {transactions.map((transaction) => (
                <Card key={transaction.id.toString()} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(transaction.type)}
                        <div>
                          <CardTitle className="text-lg">交易 #{transaction.id.toString()}</CardTitle>
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
                        <p className="text-lg">{formatEther(transaction.value)} {transaction.type === 'ETHER_TRANSFER' ? 'ETH' : ''}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">创建时间</Label>
                        <p className="text-sm">{formatDistanceToNow(new Date(Number(transaction.createdAt) * 1000), { addSuffix: true })}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">截止时间</Label>
                        <p className="text-sm">{formatDistanceToNow(new Date(Number(transaction.deadline) * 1000), { addSuffix: true })}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">签名进度</Label>
                        <p className="text-sm">{transaction.signatures.length} / {signatureThreshold.toString()}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <Progress value={(transaction.signatures.length / Number(signatureThreshold)) * 100} className="h-2" />
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {transaction.signatures.map((sig, index) => (
                        <Badge key={index} variant="outline">
                          {sig.signer.slice(0, 6)}...{sig.signer.slice(-4)}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      {canSign(transaction) && (
                        <Button onClick={() => handleSignTransaction(transaction.id)} disabled={isPending}>
                          签名
                        </Button>
                      )}
                      {canExecute(transaction) && (
                        <Button onClick={() => handleExecuteTransaction(transaction.id)} className="bg-green-600 hover:bg-green-700" disabled={isPending}>
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
                          加入于 {formatDistanceToNow(new Date(Number(signer.joinedAt) * 1000), { addSuffix: true })}
                        </p>
                        <p className="text-sm text-gray-600">
                          交易数量: {signer.transactionCount.toString()}
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
                    value={signatureThreshold.toString()}
                    onChange={(e) => setSignatureThreshold(BigInt(e.target.value))}
                    min="1"
                    max={signers.length}
                    className="w-20"
                  />
                  <span>/ {signers.length}</span>
                  <Button disabled>更新阈值</Button>
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