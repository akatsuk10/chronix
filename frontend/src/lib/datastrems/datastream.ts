import ChainlinkDatastreamsConsumer from '@hackbg/chainlink-datastreams-consumer';

// Configuration
const STREAMS_API_KEY = process.env.NEXT_PUBLIC_STREAMS_API_KEY;
const STREAMS_API_SECRET =process.env.NEXT_PUBLIC_STREAMS_API_SECRET;
const BTCPRICE_FEED = "0x00037da06d56d083fe599397a4769a042d63aa73dc4ef57709d31e9971a5b439";


if (!STREAMS_API_KEY || !STREAMS_API_SECRET) {
    throw new Error(
      'Missing Chainlink API credentials. Please set NEXT_PUBLIC_STREAMS_API_KEY and NEXT_PUBLIC_STREAMS_API_SECRET environment variables'
    );
  }

// State


// Initialize the API client
export const api = new ChainlinkDatastreamsConsumer({
  apiUrl: 'https://api.testnet-dataengine.chain.link',
  wsUrl: 'wss://api.testnet-dataengine.chain.link',
  clientId: STREAMS_API_KEY,
  clientSecret: STREAMS_API_SECRET,
  reconnect: true,
  feeds:["0x00037da06d56d083fe599397a4769a042d63aa73dc4ef57709d31e9971a5b439"]
});

