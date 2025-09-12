import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts';
import {
  Transfer as TransferEvent,
  Mint as MintEvent,
  Burn as BurnEvent,
  BatchTransfer as BatchTransferEvent,
  WhitelistUpdate as WhitelistUpdateEvent,
  Approval as ApprovalEvent,
  ApprovalForAll as ApprovalForAllEvent,
  URI as URIEvent,
  Paused as PausedEvent,
  Unpaused as UnpausedEvent
} from '../generated/RWA1155/RWA1155';
import { RWA1155, RWA1155TokenType, RWA1155Holder, RWA1155Transfer, RWA1155Mint, RWA1155Burn, RWA1155Royalty, RWA1155VersionUpdate, RWA1155Stats } from '../generated/schema';

// 处理合约部署
export function handleContractDeployed(event: any): void {
  let contract = new RWA1155(event.address.toHexString());
  contract.name = "RWA1155";
  contract.symbol = "RWA1155";
  contract.createdAt = event.block.timestamp;
  contract.creator = event.transaction.from;
  contract.baseURI = "";
  contract.paused = false;
  contract.save();
  
  // 初始化统计信息
  let stats = new RWA1155Stats(event.address.toHexString());
  stats.totalTransfers = BigInt.fromI32(0);
  stats.totalMints = BigInt.fromI32(0);
  stats.totalBurns = BigInt.fromI32(0);
  stats.uniqueHolders = BigInt.fromI32(0);
  stats.totalVolume = BigInt.fromI32(0);
  stats.lastUpdated = event.block.timestamp;
  stats.contract = contract.id;
  stats.save();
}

// 处理代币类型创建
export function handleTokenTypeCreated(event: any): void {
  let tokenTypeId = event.params.tokenId.toString() + "_" + event.address.toHexString();
  let tokenType = new RWA1155TokenType(tokenTypeId);
  tokenType.tokenId = event.params.tokenId;
  tokenType.name = event.params.name;
  tokenType.symbol = event.params.symbol;
  tokenType.tokenURI = event.params.uri;
  tokenType.totalSupply = event.params.initialSupply;
  tokenType.mintable = event.params.mintable;
  tokenType.burnable = event.params.burnable;
  tokenType.transferable = event.params.transferable;
  tokenType.createdAt = event.block.timestamp;
  tokenType.updatedAt = event.block.timestamp;
  tokenType.contract = event.address.toHexString();
  tokenType.save();
}

// 处理转账事件
export function handleTransfer(event: TransferEvent): void {
  let transactionId = event.transaction.hash.toHexString() + "_" + event.logIndex.toString();
  let transfer = new RWA1155Transfer(transactionId);
  
  transfer.transactionHash = event.transaction.hash.toHexString();
  transfer.blockNumber = event.block.number;
  transfer.timestamp = event.block.timestamp;
  transfer.from = event.params.from;
  transfer.to = event.params.to;
  transfer.tokenId = event.params.id;
  transfer.value = event.params.value;
  transfer.contract = event.address.toHexString();
  
  transfer.save();
  
  // 更新持有者
  updateHolder(event.params.to, event.params.id, event.params.value, event.address, event.block.timestamp);
  updateHolder(event.params.from, event.params.id, event.params.value.neg(), event.address, event.block.timestamp);
  
  // 更新统计信息
  updateStats(event.address, BigInt.fromI32(1), BigInt.fromI32(0), BigInt.fromI32(0), event.params.value);
}

// 处理批量转账事件
export function handleTransferBatch(event: any): void {
  let ids = event.params.ids;
  let values = event.params.values;
  let from = event.params.from;
  let to = event.params.to;
  
  for (let i = 0; i < ids.length; i++) {
    let transactionId = event.transaction.hash.toHexString() + "_" + event.logIndex.toString() + "_" + i.toString();
    let transfer = new RWA1155Transfer(transactionId);
    
    transfer.transactionHash = event.transaction.hash.toHexString();
    transfer.blockNumber = event.block.number;
    transfer.timestamp = event.block.timestamp;
    transfer.from = from;
    transfer.to = to;
    transfer.tokenId = ids[i];
    transfer.value = values[i];
    transfer.contract = event.address.toHexString();
    
    transfer.save();
    
    // 更新持有者
    updateHolder(to, ids[i], values[i], event.address, event.block.timestamp);
    updateHolder(from, ids[i], values[i].neg(), event.address, event.block.timestamp);
    
    // 更新统计信息
    updateStats(event.address, BigInt.fromI32(1), BigInt.fromI32(0), BigInt.fromI32(0), values[i]);
  }
}

// 处理铸造事件
export function handleMint(event: any): void {
  let transactionId = event.transaction.hash.toHexString() + "_" + event.logIndex.toString();
  let mint = new RWA1155Mint(transactionId);
  
  mint.transactionHash = event.transaction.hash.toHexString();
  mint.blockNumber = event.block.number;
  mint.timestamp = event.block.timestamp;
  mint.to = event.params.to;
  mint.tokenId = event.params.tokenId;
  mint.value = event.params.amount;
  mint.minter = event.transaction.from;
  mint.contract = event.address.toHexString();
  
  mint.save();
  
  // 更新代币类型供应量
  let tokenTypeId = event.params.tokenId.toString() + "_" + event.address.toHexString();
  let tokenType = RWA1155TokenType.load(tokenTypeId);
  if (tokenType) {
    tokenType.totalSupply = tokenType.totalSupply.plus(event.params.amount);
    tokenType.updatedAt = event.block.timestamp;
    tokenType.save();
  }
  
  // 更新持有者
  updateHolder(event.params.to, event.params.tokenId, event.params.amount, event.address, event.block.timestamp);
  
  // 更新统计信息
  updateStats(event.address, BigInt.fromI32(0), BigInt.fromI32(1), BigInt.fromI32(0), event.params.amount);
}

// 处理销毁事件
export function handleBurn(event: any): void {
  let transactionId = event.transaction.hash.toHexString() + "_" + event.logIndex.toString();
  let burn = new RWA1155Burn(transactionId);
  
  burn.transactionHash = event.transaction.hash.toHexString();
  burn.blockNumber = event.block.number;
  burn.timestamp = event.block.timestamp;
  burn.from = event.params.from;
  burn.tokenId = event.params.tokenId;
  burn.value = event.params.amount;
  burn.contract = event.address.toHexString();
  
  burn.save();
  
  // 更新代币类型供应量
  let tokenTypeId = event.params.tokenId.toString() + "_" + event.address.toHexString();
  let tokenType = RWA1155TokenType.load(tokenTypeId);
  if (tokenType) {
    tokenType.totalSupply = tokenType.totalSupply.minus(event.params.amount);
    tokenType.updatedAt = event.block.timestamp;
    tokenType.save();
  }
  
  // 更新持有者
  updateHolder(event.params.from, event.params.tokenId, event.params.amount.neg(), event.address, event.block.timestamp);
  
  // 更新统计信息
  updateStats(event.address, BigInt.fromI32(0), BigInt.fromI32(0), BigInt.fromI32(1), event.params.amount);
}

// 处理URI更新事件
export function handleURI(event: URIEvent): void {
  let updateId = event.transaction.hash.toHexString() + "_" + event.logIndex.toString();
  let update = new RWA1155VersionUpdate(updateId);
  
  update.transactionHash = event.transaction.hash.toHexString();
  update.blockNumber = event.block.number;
  update.timestamp = event.block.timestamp;
  update.newURI = event.params.value;
  update.updater = event.transaction.from;
  update.contract = event.address.toHexString();
  
  update.save();
  
  // 更新合约基础URI
  let contract = RWA1155.load(event.address.toHexString());
  if (contract) {
    contract.baseURI = event.params.value;
    contract.save();
  }
}

// 处理暂停事件
export function handlePaused(event: PausedEvent): void {
  let contract = RWA1155.load(event.address.toHexString());
  if (contract) {
    contract.paused = true;
    contract.save();
  }
}

// 处理恢复事件
export function handleUnpaused(event: UnpausedEvent): void {
  let contract = RWA1155.load(event.address.toHexString());
  if (contract) {
    contract.paused = false;
    contract.save();
  }
}

// 更新持有者信息
function updateHolder(address: Address, tokenId: BigInt, value: BigInt, contractAddress: Address, timestamp: BigInt): void {
  if (address.toHexString() == Address.zero().toHexString()) return;
  
  let holderId = address.toHexString() + "_" + tokenId.toString();
  let holder = RWA1155Holder.load(holderId);
  
  if (!holder) {
    holder = new RWA1155Holder(holderId);
    holder.address = address;
    holder.tokenId = tokenId;
    holder.balance = BigInt.fromI32(0);
    holder.firstAcquiredAt = timestamp;
    holder.updatedAt = timestamp;
    holder.tokenType = tokenId.toString() + "_" + contractAddress.toHexString();
  }
  
  holder.balance = holder.balance.plus(value);
  holder.updatedAt = timestamp;
  holder.save();
}

// 更新统计信息
function updateStats(contractAddress: Address, transfers: BigInt, mints: BigInt, burns: BigInt, volume: BigInt): void {
  let stats = RWA1155Stats.load(contractAddress.toHexString());
  if (stats) {
    stats.totalTransfers = stats.totalTransfers.plus(transfers);
    stats.totalMints = stats.totalMints.plus(mints);
    stats.totalBurns = stats.totalBurns.plus(burns);
    stats.totalVolume = stats.totalVolume.plus(volume);
    stats.lastUpdated = stats.block.timestamp;
    stats.save();
  }
}