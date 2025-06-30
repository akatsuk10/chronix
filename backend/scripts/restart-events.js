const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function restartEventListener() {
  try {
    console.log('🔄 Restarting event listener...');
    const response = await axios.post(`${API_BASE_URL}/events/restart`);
    console.log('✅ Event listener restarted:', response.data);
  } catch (error) {
    console.error('❌ Failed to restart event listener:', error.response?.data || error.message);
  }
}

async function processHistoricalEvents(fromBlock = 0, toBlock = 'latest', recent = false) {
  try {
    if (recent) {
      console.log('📚 Processing recent historical events (last 1000 blocks)...');
    } else {
      console.log(`📚 Processing historical events from block ${fromBlock} to ${toBlock}...`);
    }
    
    const response = await axios.post(`${API_BASE_URL}/events/process-historical`, {
      fromBlock,
      toBlock,
      recent
    });
    console.log('✅ Historical events processed:', response.data);
  } catch (error) {
    console.error('❌ Failed to process historical events:', error.response?.data || error.message);
  }
}

async function checkStatus() {
  try {
    console.log('📊 Checking event listener status...');
    const response = await axios.get(`${API_BASE_URL}/events/status`);
    console.log('✅ Status:', response.data);
  } catch (error) {
    console.error('❌ Failed to check status:', error.response?.data || error.message);
  }
}

async function checkBets() {
  try {
    console.log('🎲 Checking bet statistics...');
    const response = await axios.get(`${API_BASE_URL}/bets/stats`);
    console.log('✅ Bet stats:', response.data);
  } catch (error) {
    console.error('❌ Failed to check bet stats:', error.response?.data || error.message);
  }
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'restart':
      await restartEventListener();
      break;
    case 'historical':
      const fromBlock = parseInt(process.argv[3]) || 0;
      const toBlock = process.argv[4] || 'latest';
      await processHistoricalEvents(fromBlock, toBlock);
      break;
    case 'recent':
      await processHistoricalEvents(0, 'latest', true);
      break;
    case 'status':
      await checkStatus();
      break;
    case 'bets':
      await checkBets();
      break;
    case 'all':
      console.log('🚀 Running all commands...');
      await restartEventListener();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      await processHistoricalEvents(0, 'latest', true); // Process recent events only
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      await checkStatus();
      await checkBets();
      break;
    default:
      console.log(`
Usage: node restart-events.js <command>

Commands:
  restart     - Restart the event listener
  historical  - Process historical events (optional: fromBlock toBlock)
  recent      - Process recent events only (last 1000 blocks)
  status      - Check event listener status
  bets        - Check bet statistics
  all         - Run all commands in sequence

Examples:
  node restart-events.js restart
  node restart-events.js historical 0 latest
  node restart-events.js recent
  node restart-events.js status
  node restart-events.js bets
  node restart-events.js all
      `);
  }
}

main().catch(console.error);