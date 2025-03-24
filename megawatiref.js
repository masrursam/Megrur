const ethers = require('ethers');
const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
const { SocksProxyAgent } = require('socks-proxy-agent');
const chalk = require('chalk');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const proxyList = fs.readFileSync('proxy.txt', 'utf8').split('\n').filter(Boolean);

async function generateWallet() {
    const wallet = ethers.Wallet.createRandom();
    return wallet;
}

async function getWithProxy(url, proxy) {
    try {
        const agent = new SocksProxyAgent(proxy);
        const response = await axios.get(url, {
            httpsAgent: agent,
            httpAgent: agent,
            headers: getHeaders()
        });
        return response.data;
    } catch (error) {
        console.error(chalk.red(`Proxy ${proxy} failed: ${error.message}`));
        return null;
    }
}

function getHeaders() {
    return {
        'Host': 'api.meganet.app',
        'Connection': 'keep-alive',
        'sec-ch-ua-platform': '"Windows"',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'Accept': '*/*',
        'Origin': 'https://meganet.app',
        'Sec-Fetch-Site': 'same-site',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
        'Referer': 'https://meganet.app/',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-US,en;q=0.9'
    };
}

async function main() {
    rl.question(chalk.yellow('Enter refcode: '), async (refcode) => {
        rl.question(chalk.yellow('Enter number of accounts to create: '), async (numAccounts) => {
            rl.question(chalk.yellow('Use proxy? (yes/no): '), async (useProxy) => {
                for (let i = 0; i < numAccounts; i++) {
                    const wallet = await generateWallet();
                    const address = wallet.address;
                    const url = `https://api.meganet.app/wallets?address=${address}&refcode=${refcode}`;

                    if (useProxy.toLowerCase() === 'yes') {
                        for (const proxy of proxyList) {
                            const result = await getWithProxy(url, proxy);
                            if (result) {
                                console.log(chalk.green(`Account ${i + 1}: ${address} - Success with proxy ${proxy}`));
                                break;
                            }
                        }
                    } else {
                        try {
                            const response = await axios.get(url, {
                                headers: getHeaders()
                            });
                            console.log(chalk.green(`Account ${i + 1}: ${address} - Success without proxy`));
                        } catch (error) {
                            console.error(chalk.red(`Account ${i + 1}: ${address} - Failed without proxy: ${error.message}`));
                        }
                    }
                }
                rl.close();
            });
        });
    });
}

main();