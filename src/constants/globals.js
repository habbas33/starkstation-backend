const NETHERMIND_ENDPOINT = "http://45.72.96.2:8545"
const VOYGER_ENDPOINT = "https://voyager.online/api/"
const AGGREGATOR_V3_INTERFACE_ABI = [{ "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "description", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint80", "name": "_roundId", "type": "uint80" }], "name": "getRoundData", "outputs": [{ "internalType": "uint80", "name": "roundId", "type": "uint80" }, { "internalType": "int256", "name": "answer", "type": "int256" }, { "internalType": "uint256", "name": "startedAt", "type": "uint256" }, { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "latestRoundData", "outputs": [{ "internalType": "uint80", "name": "roundId", "type": "uint80" }, { "internalType": "int256", "name": "answer", "type": "int256" }, { "internalType": "uint256", "name": "startedAt", "type": "uint256" }, { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "version", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }]
const ETH_USD_PRICE_FEED_ADDRESS = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
const COIN_GECKO_ENDPOINT_ETH_PRICE = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=USD&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=true"
const USDC_CONTRACT_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const FROM_ADDRESS_ETH_MAINNET = "0xAAC8a151414D38330bd8cE9D7Abe55E92B63BE38"
const TO_ADDRESS_ETH_MAINNET = "0xaBe60d7474A41624dC72BC6FeCc19C6B9B2F9FA7"

const FROM_ADDRESS_SN_MAINNET = "0x05c04939c0e7502a3467d6881c3666d73e8b3fd84cf92264cb0b668710f8960a"
const TO_ADDRESS_SN_MAINNET = "0x06d50c1d9bc93c31e684f0f63d44d30edda4a9b1c645f81952b09194284abcec"
const USDC_CONTRACT_ADDRESS_SN = "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8"
const L2_FEE_CONTRACT_ADDRESS = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"

const starkAllowedPeriods = ["4h", "24h"];
const ethAllowedPeriods = ["1h", "4h", "24h"];

exports.L2_FEE_CONTRACT_ADDRESS = L2_FEE_CONTRACT_ADDRESS;
exports.FROM_ADDRESS_SN_MAINNET = FROM_ADDRESS_SN_MAINNET;
exports.TO_ADDRESS_SN_MAINNET = TO_ADDRESS_SN_MAINNET;
exports.USDC_CONTRACT_ADDRESS_SN = USDC_CONTRACT_ADDRESS_SN;

exports.NETHERMIND_ENDPOINT = NETHERMIND_ENDPOINT;
exports.VOYGER_ENDPOINT = VOYGER_ENDPOINT;
exports.AGGREGATOR_V3_INTERFACE_ABI = AGGREGATOR_V3_INTERFACE_ABI;
exports.ETH_USD_PRICE_FEED_ADDRESS = ETH_USD_PRICE_FEED_ADDRESS;
exports.COIN_GECKO_ENDPOINT_ETH_PRICE = COIN_GECKO_ENDPOINT_ETH_PRICE;
exports.TO_ADDRESS_ETH_MAINNET = TO_ADDRESS_ETH_MAINNET;
exports.FROM_ADDRESS_ETH_MAINNET = FROM_ADDRESS_ETH_MAINNET;
exports.USDC_CONTRACT_ADDRESS = USDC_CONTRACT_ADDRESS;

exports.starkAllowedPeriods = starkAllowedPeriods;
exports.ethAllowedPeriods = ethAllowedPeriods;