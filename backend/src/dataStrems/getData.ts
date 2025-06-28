import ChainlinkDatastreamsConsumer from '@hackbg/chainlink-datastreams-consumer'

const STREAMS_API_KEY = "4e9d2636-c489-4b2d-a369-9dba6db5c389";
const STREAMS_API_SECRET = "D84SC*eKH9*f6rHSHPqp0IITD0Ixd^B4b>Y3N-X_9T-0w)@c(XKFbd^OxUX#VTq>w?7t!n+18%YEp!iT&%<w7q^RFb%2DHoiMEsrlah8e%PG(J?2rK#Y9bw!vVUC=V1C";

// Initialize the API client
const api = new ChainlinkDatastreamsConsumer({
  apiUrl: 'https://api.testnet-dataengine.chain.link', // Added https://
  wsUrl: 'wss://api.testnet-dataengine.chain.link',    // WebSocket URL
  clientId: STREAMS_API_KEY,
  clientSecret: STREAMS_API_SECRET,
  reconnect:true,
})

async function trysdk() {
  try {
    console.log("Fetching feed data...");

    const timestampInSeconds = Math.floor(Date.now() / 1000);

    
    const report = await api.fetchFeed({
      timestamp: timestampInSeconds, // Optional timestamp parameter
      feed: '0x00037da06d56d083fe599397a4769a042d63aa73dc4ef57709d31e9971a5b439',
    })

    console.log("Report received:");
    console.log(report);
    
    return report;
  } catch (error) {
    console.error("Error fetching feed:", error);
    throw error;
  }
}

// Execute and handle promise
trysdk()
  .then(() => console.log("Operation completed successfully"))
  .catch(err => console.error("Operation failed:", err));