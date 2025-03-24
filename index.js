const WebSocket = require('ws');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

function readConfig() {
  try {
    const configPath = path.join(__dirname, 'config.txt');
    const configData = fs.readFileSync(configPath, 'utf8');
    
    const walletAddress = configData.match(/WALLET_ADDRESS=(.+)/)?.[1]?.trim();
    const walletId = configData.match(/WALLET_ID=(.+)/)?.[1]?.trim();
    
    if (!walletAddress || !walletId) {
      console.error('Error: Cannot find WALLET_ADDRESS or WALLET_ID in config.txt');
      process.exit(1);
    }
    
    return { walletAddress, walletId };
  } catch (error) {
    console.error(`Error reading config file: ${error.message}`);
    process.exit(1);
  }
}

const config = readConfig();

const WS_URL = 'wss://metamask-sdk.api.cx.metamask.io/socket.io/?EIO=4&transport=websocket';
const API_BASE_URL = 'https://api.meganet.app';
const WALLET_ID = config.walletId;
const WALLET_ADDRESS = config.walletAddress;

const CHANNEL_ID = '9ff14555-f33a-4444-a211-5ba52cf9460d';

const headers = {
  'accept': '*/*',
  'accept-language': 'en-US,en;q=0.9',
  'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Brave";v="134"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site',
  'sec-gpc': '1',
  'Referer': 'https://meganet.app/',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
};

const wsHeaders = {
  'accept-language': 'en-US,en;q=0.9',
  'cache-control': 'no-cache',
  'pragma': 'no-cache',
  'sec-websocket-extensions': 'permessage-deflate; client_max_window_bits',
  'sec-websocket-version': '13'
};

let lastPointsData = null;
let cycleCount = 0;

function getFormattedDateTime() {
  const now = new Date();
  return now.toLocaleString();
}

function formatPointsData(data) {
  if (!data) return "No points data available";
  
  return `
=========== MEGANET POINTS ===========
Points Today: ${data.today}
Points Earned (All time): ${data.points}
Points Per Minute: ${data.pointsPerMinute}
Last Updated: ${getFormattedDateTime()}
Cycle Count: ${cycleCount}
=======================================
`;
}

async function getPointsFromWalletInfo() {
  try {
    const url = `${API_BASE_URL}/wallets?address=${WALLET_ADDRESS}`;
    console.log(`[${getFormattedDateTime()}] Fetching wallet information...`);
    
    const response = await axios({
      method: 'GET',
      url: url,
      headers: headers
    });
    
    if (response.data && response.data.point) {
      const pointData = response.data.point;
      
      const todayPoints = pointData.pointsFarmToday || 0;
      
      lastPointsData = {
        today: todayPoints.toString(),
        points: (pointData.totalPointsReceived || 0).toString(),
        pointsPerMinute: (pointData.pointsPerMinutes || 0).toString()
      };
      
      cycleCount++;
      
      console.log(formatPointsData(lastPointsData));
      
      return { 
        success: true, 
        data: {
          today: todayPoints,
          points: pointData.totalPointsReceived || 0,
          pointsPerMinute: pointData.pointsPerMinutes || 0
        }
      };
    } else {
      console.error(`[${getFormattedDateTime()}] Invalid wallet data format received`);
      return { success: false, error: "Invalid data format" };
    }
  } catch (error) {
    console.error(`[${getFormattedDateTime()}] Error fetching wallet information: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function checkWalletInfo() {
  try {
    const url = `${API_BASE_URL}/wallets?address=${WALLET_ADDRESS}`;
    console.log(`[${getFormattedDateTime()}] Checking wallet information...`);
    
    const response = await axios({
      method: 'GET',
      url: url,
      headers: headers
    });
    
    if (response.data && response.data.point) {
      const pointData = response.data.point;
      
      const todayPoints = pointData.pointsFarmToday || 0;
      
      lastPointsData = {
        today: todayPoints.toString(),
        points: (pointData.totalPointsReceived || 0).toString(),
        pointsPerMinute: (pointData.pointsPerMinutes || 0).toString()
      };
      
      cycleCount++;
    }
    
    console.log(`[${getFormattedDateTime()}] Wallet info retrieved successfully`);
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`[${getFormattedDateTime()}] Error checking wallet information: ${error.message}`);
    return { success: false, error: error.message };
  }
}

function connectMetaMaskWebSocket() {
  const ws = new WebSocket(WS_URL, {
    headers: wsHeaders
  });

  let pingInterval;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 10;
  
  const messageSequence = [
    '40',
    (sid) => `42["join_channel",{"channelId":"${CHANNEL_ID}","context":"dapp_connectToChannel","clientType":"dapp"}]`
  ];
  
  let currentMessageIndex = 0;

  ws.on('open', () => {
    console.log(`[${getFormattedDateTime()}] ✓ Connected to MetaMask WebSocket for bandwidth sharing`);
    reconnectAttempts = 0;
    
    if (messageSequence.length > 0 && typeof messageSequence[0] === 'string') {
      ws.send(messageSequence[0]);
      console.log(`[${getFormattedDateTime()}] → Sent initial handshake message`);
      currentMessageIndex++;
    }
  });

  ws.on('message', (data) => {
    const messageStr = data.toString();
    
    if (messageStr.startsWith('0{')) {
      console.log(`[${getFormattedDateTime()}] ← Received connection setup message`);
      
      try {
        const setupData = JSON.parse(messageStr.substring(1));
        pingInterval = setupData.pingInterval;
        
        setInterval(() => {
          ws.send('2'); 
        }, pingInterval);
        
        console.log(`[${getFormattedDateTime()}] ✓ Ping interval established (${pingInterval/1000}s)`);
      } catch (e) {
        console.error(`[${getFormattedDateTime()}] ! Error parsing setup data: ${e.message}`);
      }
    }
    
    if (messageStr.startsWith('40{') && messageStr.includes('"sid"')) {
      console.log(`[${getFormattedDateTime()}] ← Received socket ID`);
      
      try {
        const sidMatch = messageStr.match(/"sid":"([^"]+)"/);
        if (sidMatch && sidMatch[1]) {
          const sid = sidMatch[1];
          
          if (currentMessageIndex < messageSequence.length && typeof messageSequence[currentMessageIndex] === 'function') {
            const nextMessage = messageSequence[currentMessageIndex](sid);
            ws.send(nextMessage);
            console.log(`[${getFormattedDateTime()}] → Sent join channel message`);
            currentMessageIndex++;
          }
        }
      } catch (e) {
        console.error(`[${getFormattedDateTime()}] ! Error processing socket ID message: ${e.message}`);
      }
    }
    
    if (messageStr.includes('"ping"')) {
      const pingResponse = `42["ping",{"id":"${CHANNEL_ID}","clientType":"dapp","context":"on_channel_config","message":""}]`;
      ws.send(pingResponse);
    }
    
    if (messageStr === '430[null,{}]') {
      console.log(`[${getFormattedDateTime()}] ✓ Successfully joined channel`);
    }
  });

  ws.on('error', (error) => {
    console.error(`[${getFormattedDateTime()}] ! WebSocket error: ${error.message}`);
  });

  ws.on('close', () => {
    console.log(`[${getFormattedDateTime()}] ! WebSocket connection closed`);
    
    reconnectAttempts++;
    if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(30000, Math.pow(2, reconnectAttempts) * 1000); 
      console.log(`[${getFormattedDateTime()}] ⟳ Attempting to reconnect in ${delay/1000}s... (Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
      
      setTimeout(() => {
        console.log(`[${getFormattedDateTime()}] ⟳ Reconnecting now...`);
        currentMessageIndex = 0; 
        connectMetaMaskWebSocket();
      }, delay);
    } else {
      console.log(`[${getFormattedDateTime()}] ! Max reconnection attempts reached. Stopping reconnection attempts.`);
    }
  });

  return ws;
}

function displayStatus() {
  console.clear(); 
  
  console.log(`
============================================
MEGANET BANDWIDTH SHARING - AIRDROP INSIDERS      
============================================
`);
  
  if (lastPointsData) {
    console.log(formatPointsData(lastPointsData));
  }
  
  console.log(`
Status: RUNNING
Connection: ACTIVE
Last Check: ${getFormattedDateTime()}

Press Ctrl+C to exit the bot
`);
}

async function retryableApiCall(apiCallFn, maxRetries = 3, initialDelay = 2000) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await apiCallFn();
    } catch (error) {
      retries++;
      
      if (retries >= maxRetries) {
        throw error; 
      }
      
      const delay = initialDelay * Math.pow(2, retries - 1); 
      console.log(`[${getFormattedDateTime()}] API call failed. Retrying in ${delay/1000}s... (Attempt ${retries}/${maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function main() {
  console.log(`
=======================================
      MEGANET BANDWIDTH SHARING       
              STARTED                 
=======================================
Wallet Address: ${WALLET_ADDRESS}
Wallet ID: ${WALLET_ID}
`);
  
  const ws = connectMetaMaskWebSocket();
  
  await retryableApiCall(getPointsFromWalletInfo);
  
  setInterval(async () => {
    await retryableApiCall(checkWalletInfo);
  }, 300000); 
  
  setInterval(() => {
    displayStatus();
  }, 60000);
  
  console.log(`[${getFormattedDateTime()}] Bot is running for bandwidth sharing. Press Ctrl+C to exit.`);
  
  process.on('SIGINT', () => {
    console.log(`
[${getFormattedDateTime()}] Shutting down bot...
Thank you for using Meganet Bandwidth Sharing Bot!
`);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
    process.exit(0);
  });
}

main().catch(error => {
  console.error(`[${getFormattedDateTime()}] ! Unhandled error in main execution: ${error.message}`);
});