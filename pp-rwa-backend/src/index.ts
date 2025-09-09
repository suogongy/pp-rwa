import express from 'express';
import cors from 'cors';
import { GraphQLClient } from 'graphql-request';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Environment configuration
interface EnvironmentConfig {
  graphUrl: string;
  rpcUrl: string;
  contractAddress: string;
  name: string;
}

const environments: Record<string, EnvironmentConfig> = {
  local: {
    graphUrl: process.env.LOCAL_GRAPH_URL || 'http://localhost:8000/subgraphs/name/pp-rwa',
    rpcUrl: process.env.LOCAL_RPC_URL || 'http://localhost:8545',
    contractAddress: process.env.LOCAL_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    name: 'Local Anvil'
  },
  sepolia: {
    graphUrl: process.env.SEPOLIA_GRAPH_URL || 'https://api.thegraph.com/subgraphs/name/YOUR_USERNAME/YOUR_SUBGRAPH_NAME',
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    contractAddress: process.env.SEPOLIA_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    name: 'Sepolia Testnet'
  }
};

const currentEnv = process.env.CURRENT_ENV || 'local';
const currentConfig = environments[currentEnv];

// Middleware
app.use(cors());
app.use(express.json());

// Environment info endpoint
app.get('/api/env', (req, res) => {
  res.json({
    current: currentEnv,
    config: {
      name: currentConfig.name,
      graphUrl: currentConfig.graphUrl,
      contractAddress: currentConfig.contractAddress
    },
    available: Object.keys(environments)
  });
});

// GraphQL client setup with current environment
const graphQLClient = new GraphQLClient(currentConfig.graphUrl);

// GraphQL queries
const GET_TOKEN_QUERY = `
  query GetToken($address: String!) {
    token(id: $address) {
      id
      address
      name
      symbol
      decimals
      totalSupply
      owner
      isPaused
      version
      createdAt
      updatedAt
    }
  }
`;

const GET_TRANSFERS_BY_TOKEN = `
  query GetTransfersByToken($tokenAddress: String!, $first: Int, $skip: Int) {
    transfers(first: $first, skip: $skip, orderBy: timestamp, orderDirection: desc, where: { token: $tokenAddress }) {
      id
      from
      to
      amount
      blockNumber
      transactionHash
      timestamp
    }
  }
`;

const GET_TRANSFERS_BY_ACCOUNT = `
  query GetTransfersByAccount($accountAddress: String!, $first: Int, $skip: Int) {
    transfersFrom: transfers(first: $first, skip: $skip, orderBy: timestamp, orderDirection: desc, where: { from: $accountAddress }) {
      id
      from
      to
      amount
      blockNumber
      transactionHash
      timestamp
    }
    transfersTo: transfers(first: $first, skip: $skip, orderBy: timestamp, orderDirection: desc, where: { to: $accountAddress }) {
      id
      from
      to
      amount
      blockNumber
      transactionHash
      timestamp
    }
  }
`;

const GET_MINTS_BY_TOKEN = `
  query GetMintsByToken($tokenAddress: String!, $first: Int, $skip: Int) {
    mints(first: $first, skip: $skip, orderBy: timestamp, orderDirection: desc, where: { token: $tokenAddress }) {
      id
      to
      amount
      txId
      blockNumber
      transactionHash
      timestamp
    }
  }
`;

const GET_BURNS_BY_TOKEN = `
  query GetBurnsByToken($tokenAddress: String!, $first: Int, $skip: Int) {
    burns(first: $first, skip: $skip, orderBy: timestamp, orderDirection: desc, where: { token: $tokenAddress }) {
      id
      from
      amount
      txId
      blockNumber
      transactionHash
      timestamp
    }
  }
`;

const GET_BATCH_TRANSFERS_BY_TOKEN = `
  query GetBatchTransfersByToken($tokenAddress: String!, $first: Int, $skip: Int) {
    batchTransfers(first: $first, skip: $skip, orderBy: timestamp, orderDirection: desc, where: { token: $tokenAddress }) {
      id
      from
      recipients
      amounts
      batchId
      totalAmount
      blockNumber
      transactionHash
      timestamp
    }
  }
`;

// Helper function to handle GraphQL errors
async function executeGraphQLQuery(query: string, variables: any) {
  try {
    const result = await graphQLClient.request(query, variables);
    return result;
  } catch (error) {
    console.error('GraphQL Query Error:', error);
    throw error;
  }
}

// API Routes

// Get token information
app.get('/api/token/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const result = await executeGraphQLQuery(GET_TOKEN_QUERY, { address });
    res.json(result);
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({ 
      error: 'Failed to fetch token data',
      environment: currentEnv,
      graphUrl: currentConfig.graphUrl
    });
  }
});

// Get transfers by token address
app.get('/api/transfers/token/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { first = 10, skip = 0 } = req.query;
    const result = await executeGraphQLQuery(GET_TRANSFERS_BY_TOKEN, {
      tokenAddress: address.toLowerCase(),
      first: parseInt(first as string),
      skip: parseInt(skip as string)
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transfers',
      environment: currentEnv,
      graphUrl: currentConfig.graphUrl
    });
  }
});

// Get transfers by account address
app.get('/api/transfers/account/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { first = 10, skip = 0 } = req.query;
    const result = await executeGraphQLQuery(GET_TRANSFERS_BY_ACCOUNT, {
      accountAddress: address.toLowerCase(),
      first: parseInt(first as string),
      skip: parseInt(skip as string)
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching account transfers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch account transfers',
      environment: currentEnv,
      graphUrl: currentConfig.graphUrl
    });
  }
});

// Get mints by token address
app.get('/api/mints/token/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { first = 10, skip = 0 } = req.query;
    const result = await executeGraphQLQuery(GET_MINTS_BY_TOKEN, {
      tokenAddress: address.toLowerCase(),
      first: parseInt(first as string),
      skip: parseInt(skip as string)
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching mints:', error);
    res.status(500).json({ 
      error: 'Failed to fetch mints',
      environment: currentEnv,
      graphUrl: currentConfig.graphUrl
    });
  }
});

// Get burns by token address
app.get('/api/burns/token/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { first = 10, skip = 0 } = req.query;
    const result = await executeGraphQLQuery(GET_BURNS_BY_TOKEN, {
      tokenAddress: address.toLowerCase(),
      first: parseInt(first as string),
      skip: parseInt(skip as string)
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching burns:', error);
    res.status(500).json({ 
      error: 'Failed to fetch burns',
      environment: currentEnv,
      graphUrl: currentConfig.graphUrl
    });
  }
});

// Get batch transfers by token address
app.get('/api/batch-transfers/token/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { first = 10, skip = 0 } = req.query;
    const result = await executeGraphQLQuery(GET_BATCH_TRANSFERS_BY_TOKEN, {
      tokenAddress: address.toLowerCase(),
      first: parseInt(first as string),
      skip: parseInt(skip as string)
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching batch transfers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch batch transfers',
      environment: currentEnv,
      graphUrl: currentConfig.graphUrl
    });
  }
});

// Health check endpoint with environment info
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: currentEnv,
    config: {
      name: currentConfig.name,
      graphUrl: currentConfig.graphUrl,
      contractAddress: currentConfig.contractAddress
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 RWA Backend API server running at http://localhost:${port}`);
  console.log(`🌍 Environment: ${currentConfig.name} (${currentEnv})`);
  console.log(`📊 GraphQL endpoint: ${currentConfig.graphUrl}`);
  console.log(`🔗 Contract address: ${currentConfig.contractAddress}`);
  console.log(`📡 Health check: http://localhost:${port}/health`);
  console.log(`🔧 Environment info: http://localhost:${port}/api/env`);
});

export default app;