import { ethers } from "ethers";
import prisma from "../lib/prisma";
import BTCBettingABI from "../abi/BTCBetting.json";

const CONTRACT_ADDRESS = process.env.BTC_BETTING_CONTRACT_ADDRESS || "0x4d2Fb695465c8fbbCFb2b9E424093BBdFC4E612B";
const RPC_URL = process.env.AVALANCHE_FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";

let provider: ethers.JsonRpcProvider;
let contract: ethers.Contract;
let isListening = false;
let lastProcessedBlock = 0;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000; // 5 seconds
const MAX_BLOCK_RANGE = 2000; // Maximum blocks to query at once (under 2048 limit)

// Track pending bets with their positions
const pendingBets = new Map<string, { position: number; amount: string; blockNumber: number }>();

// Initialize the provider and contract
function initialize() {
  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    contract = new ethers.Contract(CONTRACT_ADDRESS, BTCBettingABI.abi, provider);
    console.log("Provider and contract initialized successfully");
  } catch (error) {
    console.error("Error initializing provider and contract:", error);
    throw error;
  }
}

// Save bet settlement to database
async function saveBetSettlement(
  user: string,
  won: boolean,
  startPrice: string,
  endPrice: string,
  position: number,
  txHash: string,
  blockNumber: number
) {
  try {
    // Check if user exists, if not create them
    let dbUser = await prisma.user.findUnique({
      where: { walletAddress: user.toLowerCase() }
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          walletAddress: user.toLowerCase(),
          nonceSigned: false
        }
      });
    }

    // Check if bet already exists to avoid duplicates
    const existingBet = await prisma.bet.findFirst({
      where: { txHash }
    });

    if (existingBet) {
      console.log("Bet already exists in database:", txHash);
      return;
    }

    // Save the bet settlement
    const bet = await prisma.bet.create({
      data: {
        user: user.toLowerCase(),
        won,
        startPrice,
        endPrice,
        position,
        txHash,
        blockNumber,
        userAddress: user.toLowerCase()
      }
    });

    console.log("Bet settlement saved to database:", {
      id: bet.id,
      user,
      won,
      position,
      txHash
    });
  } catch (error) {
    console.error("Error saving bet settlement to database:", error);
  }
}

// Process events with error handling
async function processEvent(event: any) {
  try {
    const parsedEvent = contract.interface.parseLog(event);
    if (parsedEvent && parsedEvent.args) {
      const { user, won, startPrice, endPrice } = parsedEvent.args;
      
      // Try to find the position from pending bets
      let position = -1; // Default to -1 if not found
      const userKey = user.toLowerCase();
      
      if (pendingBets.has(userKey)) {
        const pendingBet = pendingBets.get(userKey)!;
        position = pendingBet.position;
        // Remove from pending bets after settlement
        pendingBets.delete(userKey);
        console.log(`Found position ${position} for user ${user} from pending bets`);
      } else {
        console.log(`No pending bet found for user ${user}, position will be -1`);
      }
      
      console.log("Processing BetSettled event:", {
        user,
        won,
        startPrice: startPrice.toString(),
        endPrice: endPrice.toString(),
        position,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber
      });

      await saveBetSettlement(
        user,
        won,
        startPrice.toString(),
        endPrice.toString(),
        position,
        event.transactionHash,
        event.blockNumber
      );
    }
  } catch (error) {
    console.error("Error processing event:", error);
  }
}

// Process BetPlaced events to track positions
async function processBetPlacedEvent(event: any) {
  try {
    const parsedEvent = contract.interface.parseLog(event);
    if (parsedEvent && parsedEvent.args) {
      const { user, position, amount } = parsedEvent.args;
      
      const userKey = user.toLowerCase();
      pendingBets.set(userKey, {
        position: Number(position),
        amount: amount.toString(),
        blockNumber: event.blockNumber
      });
      
      console.log("BetPlaced event tracked:", {
        user,
        position: Number(position),
        amount: amount.toString(),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    }
  } catch (error) {
    console.error("Error processing BetPlaced event:", error);
  }
}

// Improved polling fallback with better error handling and block range limits
async function startPolling() {
  console.log("Starting polling fallback for events...");
  
  const pollInterval = setInterval(async () => {
    if (!isListening) {
      clearInterval(pollInterval);
      return;
    }

    try {
      const currentBlock = await provider.getBlockNumber();
      
      if (lastProcessedBlock === 0) {
        lastProcessedBlock = currentBlock - 1;
      }

      if (currentBlock > lastProcessedBlock) {
        // Limit the block range to avoid "too many blocks" error
        const fromBlock = lastProcessedBlock + 1;
        const toBlock = Math.min(currentBlock, fromBlock + MAX_BLOCK_RANGE - 1);
        
        console.log(`Polling blocks ${fromBlock} to ${toBlock} (limited range)`);
        
        try {
          // Query both BetPlaced and BetSettled events with error handling
          const betPlacedEvents = await contract.queryFilter(
            contract.filters.BetPlaced(),
            fromBlock,
            toBlock
          );

          const betSettledEvents = await contract.queryFilter(
            contract.filters.BetSettled(),
            fromBlock,
            toBlock
          );

          console.log(`Found ${betPlacedEvents.length} BetPlaced events and ${betSettledEvents.length} BetSettled events`);

          // Process BetPlaced events first to track positions
          for (const event of betPlacedEvents) {
            await processBetPlacedEvent(event);
          }

          // Then process BetSettled events
          for (const event of betSettledEvents) {
            await processEvent(event);
          }

          lastProcessedBlock = toBlock;
        } catch (filterError) {
          console.error("Filter query error, trying alternative approach:", filterError);
          
          // Alternative: Query all events and filter manually
          try {
            const allEvents = await contract.queryFilter(
              null as any, // Query all events
              fromBlock,
              toBlock
            );
            
            for (const event of allEvents) {
              // Check if it's a BetPlaced or BetSettled event by trying to parse it
              try {
                const parsedEvent = contract.interface.parseLog(event);
                if (parsedEvent) {
                  if (parsedEvent.name === 'BetPlaced') {
                    await processBetPlacedEvent(event);
                  } else if (parsedEvent.name === 'BetSettled') {
                    await processEvent(event);
                  }
                }
              } catch (parseError) {
                // Skip events that can't be parsed (not from our contract)
                continue;
              }
            }
            
            lastProcessedBlock = toBlock;
          } catch (altError) {
            console.error("Alternative query also failed:", altError);
            // Don't update lastProcessedBlock to retry later
          }
        }
      }
    } catch (error) {
      console.error("Error in polling:", error);
      // Don't update lastProcessedBlock to retry later
    }
  }, 15000); // Poll every 15 seconds (increased interval)

  return pollInterval;
}

// Start listening for events with improved error handling
export async function startListening() {
  if (isListening) {
    console.log("Event listener is already running");
    return;
  }

  if (!provider || !contract) {
    initialize();
  }

  console.log("Starting event listener for BetSettled events...");
  isListening = true;
  reconnectAttempts = 0;

  // Get current block number for polling fallback
  try {
    lastProcessedBlock = await provider.getBlockNumber();
    console.log(`Starting from block: ${lastProcessedBlock}`);
  } catch (error) {
    console.error("Error getting current block number:", error);
    lastProcessedBlock = 0;
  }

  // Start polling as primary method (more reliable than event listeners)
  const pollInterval = await startPolling();

  // Set up event listeners as backup (but don't rely on them due to filter issues)
  const setupEventListeners = () => {
    try {
      // Listen for BetPlaced events to track positions
      contract.on("BetPlaced", async (user, position, amount, event) => {
        try {
          const userKey = user.toLowerCase();
          pendingBets.set(userKey, {
            position: Number(position),
            amount: amount.toString(),
            blockNumber: event.blockNumber
          });
          
          console.log("BetPlaced event received:", {
            user,
            position: Number(position),
            amount: amount.toString(),
            txHash: event.transactionHash,
            blockNumber: event.blockNumber
          });
        } catch (error) {
          console.error("Error processing BetPlaced event:", error);
        }
      });

      // Listen for BetSettled events
      contract.on("BetSettled", async (user, won, startPrice, endPrice, event) => {
        try {
          // Try to find the position from pending bets
          let position = -1; // Default to -1 if not found
          const userKey = user.toLowerCase();
          
          if (pendingBets.has(userKey)) {
            const pendingBet = pendingBets.get(userKey)!;
            position = pendingBet.position;
            // Remove from pending bets after settlement
            pendingBets.delete(userKey);
            console.log(`Found position ${position} for user ${user} from pending bets`);
          } else {
            console.log(`No pending bet found for user ${user}, position will be -1`);
          }

          console.log("BetSettled event received:", {
            user,
            won,
            startPrice: startPrice.toString(),
            endPrice: endPrice.toString(),
            position,
            txHash: event.transactionHash,
            blockNumber: event.blockNumber
          });

          await saveBetSettlement(
            user,
            won,
            startPrice.toString(),
            endPrice.toString(),
            position,
            event.transactionHash,
            event.blockNumber
          );

        } catch (error) {
          console.error("Error processing BetSettled event:", error);
        }
      });

      // Handle provider errors
      provider.on("error", (error) => {
        console.error("Provider error:", error);
        handleReconnection();
      });

      console.log("Event listeners set up successfully");
      reconnectAttempts = 0; // Reset reconnect attempts on successful setup

    } catch (error) {
      console.error("Error setting up event listeners:", error);
      // Don't call handleReconnection here as polling is the primary method
    }
  };

  // Handle reconnection logic
  const handleReconnection = async () => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error("Max reconnection attempts reached. Stopping event listener.");
      isListening = false;
      return;
    }

    reconnectAttempts++;
    console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

    try {
      // Remove existing listeners
      contract.removeAllListeners();
      
      // Wait before reconnecting
      await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY));
      
      // Reinitialize provider and contract
      initialize();
      
      // Set up listeners again
      setupEventListeners();
      
    } catch (error) {
      console.error("Reconnection failed:", error);
      // Try again after delay
      setTimeout(handleReconnection, RECONNECT_DELAY);
    }
  };

  // Initial setup
  setupEventListeners();

  console.log("Event listener started successfully");
}

// Stop listening for events
export async function stopListening() {
  if (!isListening) {
    console.log("Event listener is not running");
    return;
  }

  console.log("Stopping event listener...");
  isListening = false;
  
  if (contract) {
    contract.removeAllListeners();
  }
  
  console.log("Event listener stopped");
}

// Process historical events with block range limits
export async function processHistoricalEvents(fromBlock: number, toBlock: number | string = "latest") {
  if (!provider || !contract) {
    initialize();
  }

  try {
    let endBlock: number;
    
    if (toBlock === "latest") {
      endBlock = await provider.getBlockNumber();
    } else {
      endBlock = toBlock as number;
    }

    console.log(`Processing historical events from block ${fromBlock} to ${endBlock}`);
    
    // Process in chunks to avoid "too many blocks" error
    let currentBlock = fromBlock;
    
    while (currentBlock < endBlock) {
      const chunkEndBlock = Math.min(currentBlock + MAX_BLOCK_RANGE - 1, endBlock);
      
      console.log(`Processing chunk: blocks ${currentBlock} to ${chunkEndBlock}`);
      
      try {
        // Process BetPlaced events first to build position tracking
        const betPlacedEvents = await contract.queryFilter(
          contract.filters.BetPlaced(),
          currentBlock,
          chunkEndBlock
        );

        console.log(`Found ${betPlacedEvents.length} BetPlaced events in chunk`);

        for (const event of betPlacedEvents) {
          await processBetPlacedEvent(event);
        }

        // Then process BetSettled events
        const betSettledEvents = await contract.queryFilter(
          contract.filters.BetSettled(),
          currentBlock,
          chunkEndBlock
        );

        console.log(`Found ${betSettledEvents.length} BetSettled events in chunk`);

        for (const event of betSettledEvents) {
          await processEvent(event);
        }
        
        currentBlock = chunkEndBlock + 1;
        
        // Small delay between chunks to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing chunk ${currentBlock} to ${chunkEndBlock}:`, error);
        currentBlock = chunkEndBlock + 1; // Move to next chunk even if this one failed
      }
    }

    console.log("Historical events processing completed");
  } catch (error) {
    console.error("Error processing historical events:", error);
  }
} 