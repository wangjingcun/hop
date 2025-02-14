export default [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_l2Messenger",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_l1ERC20BridgeAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "l1ERC20BridgeAddress",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "l2Messenger",
    "outputs": [
      {
        "internalType": "contract IArbSys",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_l1TokenAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_l2TokenAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
