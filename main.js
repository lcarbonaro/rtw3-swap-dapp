import "./style.css";
import qs from 'qs';
//import Web3 from 'web3';
import BigNumber from "bignumber.js";

// element refs
const btnLogin = document.getElementById("login_button");
const btnSwap  = document.getElementById("swap_button");

const fromTokenSelect = document.getElementById("from_token_select");
const toTokenSelect = document.getElementById("to_token_select");
const modalClose = document.getElementById("modal_close");
const tokenModal = document.getElementById("token_modal");

const fromAmount = document.getElementById("from_amount");

const toAmount = document.getElementById("to_amount");
const gasEstimate = document.getElementById("gas_estimate");

// event listeners
btnLogin.addEventListener('click', async () => {
  await connect();
});

btnSwap.addEventListener('click', async () => {
  await trySwap();
});

fromTokenSelect.addEventListener('click', () => {
  openModal('from');
});

toTokenSelect.addEventListener('click', () => {
  openModal('to');
});

modalClose.addEventListener('click', () => {
  closeModal();
});

fromAmount.addEventListener('blur', async () => {
  await getPrice();
});

let currentTrade = {};
let currentSelectSide;

init();

// functions 
async function connect() {
  if (typeof window.ethereum !== "undefined") {
    try {
      console.log("connecting");
      await ethereum.request({ method: "eth_requestAccounts" });
    } catch (error) {
      console.log(error);
    }
    btnLogin.innerHTML = "Connected";
    btnSwap.disabled = false;
  } else {
    btnLogin.innerHTML = "Please install MetaMask";
  }
}

function openModal(side){
  tokenModal.style.display = "block";
  currentSelectSide = side;
}

function closeModal(){
  tokenModal.style.display = "none";
}

async function init() {
  await listAvailableTokens();
}

async function listAvailableTokens(){
  //console.log("initializing");
  let response = await fetch('https://tokens.coingecko.com/uniswap/all.json');
  let tokenListJSON = await response.json();
  //console.log("listing available tokens: ", tokenListJSON);
  let tokens = tokenListJSON.tokens;
  //console.log("tokens: ", tokens);

  // Create token list for modal
  let parent = document.getElementById("token_list");
  let div;
  let html;
  for (const i in tokens){
      // Token row in the modal token list
      div = document.createElement("div");
      div.className = "token_row";
      html = `<img class="token_list_img" src="${tokens[i].logoURI}"><span class="token_list_text">${tokens[i].symbol}</span>`;
      div.innerHTML = html;
      div.onclick = () => {
        selectToken(tokens[i]);
      };
      parent.appendChild(div);
  };
}

function selectToken(token) {
  closeModal();
  currentTrade[currentSelectSide] = token;
  //console.log("currentTrade:" , currentTrade);
  renderInterface();
}

function renderInterface(){
  if (currentTrade.from) {
    //console.log(currentTrade.from)
    document.getElementById("from_token_img").src = currentTrade.from.logoURI;
    document.getElementById("from_token_text").innerHTML = currentTrade.from.symbol;
  }
  if (currentTrade.to) {
    document.getElementById("to_token_img").src = currentTrade.to.logoURI;
    document.getElementById("to_token_text").innerHTML = currentTrade.to.symbol;
  }
}

async function getPrice() {
  console.log("Getting Price");

  if (!currentTrade.from || !currentTrade.to || !fromAmount.value) return;
  let amount = Number(fromAmount.value * 10 ** currentTrade.from.decimals);

  const params = {
    sellToken: currentTrade.from.address,
    buyToken: currentTrade.to.address,
    sellAmount: amount,
  };

  //console.log( qs.stringify(params) );

  // Fetch the swap price.
  const response = await fetch(`https://api.0x.org/swap/v1/price?${qs.stringify(params)}`);
  
  let swapPriceJSON = await response.json();
  //console.log("Price: ", swapPriceJSON);
  
  toAmount.value = swapPriceJSON.buyAmount / (10 ** currentTrade.to.decimals);
  gasEstimate.innerHTML = swapPriceJSON.estimatedGas;
}

async function getQuote(account){
  console.log("Getting Quote");

  if (!currentTrade.from || !currentTrade.to || !fromAmount.value) return;
  let amount = Number(fromAmount.value * 10 ** currentTrade.from.decimals);

  const params = {
      sellToken: currentTrade.from.address,
      buyToken: currentTrade.to.address,
      sellAmount: amount,
      takerAddress: account,
  };

  // Fetch the swap quote.
  const response = await fetch(`https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`);
  
  let swapQuoteJSON = await response.json();
  console.log("Quote: ", swapQuoteJSON);
  
  toAmount.value = swapQuoteJSON.buyAmount / (10 ** currentTrade.to.decimals);
  gasEstimate.innerHTML = swapQuoteJSON.estimatedGas;

  return swapQuoteJSON;
}

async function trySwap() {
  const erc20abi = [{ "inputs": [ { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "symbol", "type": "string" }, { "internalType": "uint256", "name": "max_supply", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "Transfer", "type": "event" }, { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" } ], "name": "allowance", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "approve", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "account", "type": "address" } ], "name": "balanceOf", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "burn", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "account", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "burnFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [ { "internalType": "uint8", "name": "", "type": "uint8" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "subtractedValue", "type": "uint256" } ], "name": "decreaseAllowance", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "addedValue", "type": "uint256" } ], "name": "increaseAllowance", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "name", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "transfer", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "transferFrom", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }];
  console.log("trying swap");

  // Only work if MetaMask is connect
  // Connecting to Ethereum: Metamask
  const web3 = new Web3(Web3.givenProvider);

  // The address, if any, of the most recently used account that the caller is permitted to access
  let accounts = await window.ethereum.request({ method: "eth_accounts" });
  let takerAddress = accounts[0];
  console.log("takerAddress: ", takerAddress);

  const swapQuoteJSON = await getQuote(takerAddress);

  // Set Token Allowance
  // Set up approval amount
  const fromTokenAddress = currentTrade.from.address;
  const maxApproval = new BigNumber(2).pow(256).minus(1);
  console.log("approval amount: ", maxApproval);
  const ERC20TokenContract = new web3.eth.Contract(erc20abi, fromTokenAddress);
  console.log("setup ERC20TokenContract: ", ERC20TokenContract);

  // Grant the allowance target an allowance to spend our tokens.
  const tx = await ERC20TokenContract.methods.approve(
      swapQuoteJSON.allowanceTarget,
      maxApproval,
  )
  .send({ from: takerAddress })
  .then(tx => {
      console.log("tx: ", tx)
  });
}
