export default [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bytes",
        "name": "message",
        "type": "bytes"
      }
    ],
    "name": "MessageSent",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "fxChild",
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
    "name": "fxRootTunnel",
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "stateId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "rootMessageSender",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "processMessageFromRoot",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_fxRootTunnel",
        "type": "address"
      }
    ],
    "name": "setFxRootTunnel",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
