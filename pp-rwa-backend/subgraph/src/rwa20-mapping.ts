import { BigDecimal, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  Transfer,
  TokensMinted,
  TokensBurned,
  BatchTransferExecuted,
  WhitelistUpdated
} from "../generated/RWA20/RWA20"
import {
  Token,
  Transfer as TransferEntity,
  Mint,
  Burn,
  BatchTransfer,
  WhitelistUpdate,
  Account
} from "../generated/schema"

// Helper function to get or create token entity
export function getOrCreateToken(address: Address): Token {
  let token = Token.load(address.toHexString())
  if (token == null) {
    token = new Token(address.toHexString())
    token.address = address
    token.transfers = []
    token.mints = []
    token.burns = []
    token.batchTransfers = []
    token.whitelistUpdates = []
    token.createdAt = BigInt.zero()
    token.updatedAt = BigInt.zero()
    token.save()
  }
  return token
}

// Helper function to get or create account entity
export function getOrCreateAccount(address: Address): Account {
  let account = Account.load(address.toHexString())
  if (account == null) {
    account = new Account(address.toHexString())
    account.address = address
    account.transfersFrom = []
    account.transfersTo = []
    account.mintsReceived = []
    account.burnsFrom = []
    account.batchTransfersFrom = []
    account.whitelistUpdates = []
    account.createdAt = BigInt.zero()
    account.updatedAt = BigInt.zero()
    account.save()
  }
  return account
}

export function handleTransfer(event: Transfer): void {
  let token = getOrCreateToken(event.address)
  let fromAccount = getOrCreateAccount(event.params.from)
  let toAccount = getOrCreateAccount(event.params.to)

  // Create transfer entity
  let transferId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let transfer = new TransferEntity(transferId)
  transfer.token = token.id
  transfer.from = event.params.from
  transfer.to = event.params.to
  transfer.amount = event.params.value
  transfer.blockNumber = event.block.number
  transfer.transactionHash = event.transaction.hash
  transfer.timestamp = event.block.timestamp
  transfer.save()

  // Update token's updatedAt timestamp
  token.updatedAt = event.block.timestamp
  token.save()

  // Update accounts' updatedAt timestamp
  fromAccount.updatedAt = event.block.timestamp
  toAccount.updatedAt = event.block.timestamp
  fromAccount.save()
  toAccount.save()
}

export function handleTokensMinted(event: TokensMinted): void {
  let token = getOrCreateToken(event.address)
  let toAccount = getOrCreateAccount(event.params.to)

  // Create mint entity
  let mintId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let mint = new Mint(mintId)
  mint.token = token.id
  mint.to = event.params.to
  mint.amount = event.params.amount
  mint.txId = event.params.txId
  mint.blockNumber = event.block.number
  mint.transactionHash = event.transaction.hash
  mint.timestamp = event.block.timestamp
  mint.save()

  // Update token's updatedAt timestamp
  token.updatedAt = event.block.timestamp
  token.save()

  // Update account's updatedAt timestamp
  toAccount.updatedAt = event.block.timestamp
  toAccount.save()
}

export function handleTokensBurned(event: TokensBurned): void {
  let token = getOrCreateToken(event.address)
  let fromAccount = getOrCreateAccount(event.params.from)

  // Create burn entity
  let burnId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let burn = new Burn(burnId)
  burn.token = token.id
  burn.from = event.params.from
  burn.amount = event.params.amount
  burn.txId = event.params.txId
  burn.blockNumber = event.block.number
  burn.transactionHash = event.transaction.hash
  burn.timestamp = event.block.timestamp
  burn.save()

  // Update token's updatedAt timestamp
  token.updatedAt = event.block.timestamp
  token.save()

  // Update account's updatedAt timestamp
  fromAccount.updatedAt = event.block.timestamp
  fromAccount.save()
}

export function handleBatchTransferExecuted(event: BatchTransferExecuted): void {
  let token = getOrCreateToken(event.address)
  let fromAccount = getOrCreateAccount(event.params.from)

  // Calculate total amount
  let totalAmount = BigInt.zero()
  for (let i = 0; i < event.params.amounts.length; i++) {
    totalAmount = totalAmount.plus(event.params.amounts[i])
  }

  // Create batch transfer entity
  let batchId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let batchTransfer = new BatchTransfer(batchId)
  batchTransfer.token = token.id
  batchTransfer.from = event.params.from
  batchTransfer.recipients = event.params.recipients
  batchTransfer.amounts = event.params.amounts
  batchTransfer.batchId = event.params.batchId
  batchTransfer.totalAmount = totalAmount
  batchTransfer.blockNumber = event.block.number
  batchTransfer.transactionHash = event.transaction.hash
  batchTransfer.timestamp = event.block.timestamp
  batchTransfer.save()

  // Update token's updatedAt timestamp
  token.updatedAt = event.block.timestamp
  token.save()

  // Update account's updatedAt timestamp
  fromAccount.updatedAt = event.block.timestamp
  fromAccount.save()
}

export function handleWhitelistUpdated(event: WhitelistUpdated): void {
  let token = getOrCreateToken(event.address)
  let account = getOrCreateAccount(event.params.account)

  // Create whitelist update entity
  let whitelistId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let whitelistUpdate = new WhitelistUpdate(whitelistId)
  whitelistUpdate.token = token.id
  whitelistUpdate.account = event.params.account
  whitelistUpdate.status = event.params.status
  whitelistUpdate.blockNumber = event.block.number
  whitelistUpdate.transactionHash = event.transaction.hash
  whitelistUpdate.timestamp = event.block.timestamp
  whitelistUpdate.save()

  // Update token's updatedAt timestamp
  token.updatedAt = event.block.timestamp
  token.save()

  // Update account's updatedAt timestamp
  account.updatedAt = event.block.timestamp
  account.save()
}