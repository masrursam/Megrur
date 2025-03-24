# MegaETH Auto Bot

This bot allows you to automatically participate in Meganet's bandwidth sharing program, earning points that may be valuable for future airdrops. The bot connects to Meganet's servers and tracks your point accumulation in real-time.

## Features

- Automatic connection to Meganet's bandwidth sharing network
- Real-time tracking of points earned
- Persistent connection with automatic reconnection
- Detailed logging of all activities
- Clean console display with up-to-date statistics

## Prerequisites

- Node.js (v14 or newer)
- npm (comes with Node.js)
- A Meganet wallet address and ID

## Installation

1. Clone this repository:
```bash
git clone https://github.com/airdropinsiders/Meganet-Auto-Bot.git
cd Meganet-Auto-Bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `config.txt` file in the root directory with your wallet information:
```
WALLET_ADDRESS=your_wallet_address_here
WALLET_ID=your_wallet_id_here
```

## Usage

Start the bot with:

```bash
npm start
```

Or directly with Node.js:

```bash
node index.js
```

The bot will automatically:
- Connect to Meganet's WebSocket server
- Join the bandwidth sharing channel
- Periodically check and update your point statistics
- Display your current point status in the console

## How to Get Your Wallet Information

1. Log in to your Meganet account at [https://meganet.app](https://meganet.app)
2. Navigate to your profile or wallet section
3. Your wallet address will be displayed on the page
4. The wallet ID can be found in the URL when viewing your wallet details or in network requests

## Troubleshooting

If you encounter any issues:

1. Ensure your `config.txt` file is properly formatted
2. Check that your wallet address and ID are correct
3. Make sure you have an active internet connection
4. Try restarting the bot
5. Check for any updates to the repository

## Disclaimer

This bot is provided for educational purposes only. Use at your own risk. The developers are not responsible for any potential issues that may arise from using this bot, including but not limited to account restrictions, loss of points, or any other negative consequences.

## License

MIT License

---

© 2024 Airdrop Insiders