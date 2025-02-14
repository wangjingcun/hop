import { ChainSlug, NetworkSlug, getChain } from '@hop-protocol/sdk'
import { Contract, utils } from 'ethers'
import { SignerConfig } from '#config/index.js'

export function getAttestationUrl (messageHash: string): string {
  const attestationUrlSubdomain = SignerConfig.network === NetworkSlug.Mainnet ? 'iris-api' : 'iris-api-sandbox'
  const baseUrl = `https://${attestationUrlSubdomain}.circle.com/v1/attestations`
  return `${baseUrl}/${messageHash}`
}

// Based on docs with an added buffer as observed in practice
// https://developers.circle.com/stablecoins/docs/required-block-confirmations
export const AttestationTimeForChainIdMs: Record<string, Partial<Record<ChainSlug, number>>> = {
  [NetworkSlug.Mainnet]: {
    [ChainSlug.Ethereum]: 20 * 60 * 1000,
    [ChainSlug.Optimism]: 20 * 60 * 1000,
    [ChainSlug.Arbitrum]: 20 * 60 * 1000,
    [ChainSlug.Base]: 20 * 60 * 1000,
    [ChainSlug.Polygon]: 30 * 60 * 1000
  },
  [NetworkSlug.Sepolia]: {
    [ChainSlug.Ethereum]: 2 * 60 * 1000,
    [ChainSlug.Optimism]: 1 * 60 * 1000,
    [ChainSlug.Arbitrum]: 1 * 60 * 1000,
    [ChainSlug.Base]: 1 * 60 * 1000
  }
}

export function getAttestationTimeFromChainIdMs (chainId: string): number {
  const chainSlug = getChain(chainId).slug
  return (AttestationTimeForChainIdMs as any)[SignerConfig.network as NetworkSlug][chainSlug]!
}

// Remove all this in favor of the contract instance from the SDK when available
export const MessageTransmitterAddresses: Record<string, Partial<Record<ChainSlug, string>>> = {
  [NetworkSlug.Mainnet]: {
    [ChainSlug.Ethereum]: '0x0a992d191deec32afe36203ad87d7d289a738f81',
    [ChainSlug.Optimism]: '0x4d41f22c5a0e5c74090899e5a8fb597a8842b3e8',
    [ChainSlug.Arbitrum]: '0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca',
    [ChainSlug.Base]: '0xAD09780d193884d503182aD4588450C416D6F9D4',
    [ChainSlug.Polygon]: '0xF3be9355363857F3e001be68856A2f96b4C39Ba9',
  },
  [NetworkSlug.Sepolia]: {
    [ChainSlug.Ethereum]: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
    [ChainSlug.Optimism]: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
    [ChainSlug.Arbitrum]: '0xaCF1ceeF35caAc005e15888dDb8A3515C41B4872',
    [ChainSlug.Base]: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD'
  }
}

export const TOKEN_MESSENGER_ADDRESSES: Record<string, Partial<Record<string, string>>> = {
  [NetworkSlug.Mainnet]: {
    '1': '0xBd3fa81B58Ba92a82136038B25aDec7066af3155',
    '10': '0x2B4069517957735bE00ceE0fadAE88a26365528f',
    '42161': '0x19330d10D9Cc8751218eaf51E8885D058642E08A',
    '8453': '0x1682Ae6375C4E4A97e4B583BC394c861A46D8962',
    '137': '0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE',
  },
  [NetworkSlug.Sepolia]: {
    '11155111': '',
    '11155420': '',
    '421614': '',
    '84532': '',
  }
}


// Remove all this in favor of the contract instance from the SDK when available
export const HopCCTPAddresses : Record<string, Partial<Record<ChainSlug, string>>> = {
  [NetworkSlug.Mainnet]: {
    [ChainSlug.Ethereum]: '0x7e77461CA2a9d82d26FD5e0Da2243BF72eA45747',
    [ChainSlug.Optimism]: '0x469147af8Bde580232BE9DC84Bb4EC84d348De24',
    [ChainSlug.Arbitrum]: '0x6504BFcaB789c35325cA4329f1f41FaC340bf982',
    [ChainSlug.Base]: '0xe7F40BF16AB09f4a6906Ac2CAA4094aD2dA48Cc2',
    [ChainSlug.Polygon]: '0x1CD391bd1D915D189dE162F0F1963C07E60E4CD6'
  },
  [NetworkSlug.Sepolia]: {
    [ChainSlug.Ethereum]: '',
    [ChainSlug.Optimism]: '',
    [ChainSlug.Arbitrum]: '',
    [ChainSlug.Base]: ''
  }
}

export const USDC_ADDRESSES: Partial<Record<NetworkSlug, Record<string, string>>> = {
  [NetworkSlug.Mainnet]: {
    '1': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // Ethereum
    '10': '0x0b2c639c533813f4aa9d7837caf62653d097ff85', // Optimism
    '42161': '0xaf88d065e77c8cc2239327c5edb3a432268e5831', // Arbitrum
    '8453': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
    '137': '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', // Polygon PoS
  }
}

export const CCTP_DOMAIN_TO_CHAIN_ID_MAP: Partial<Record<NetworkSlug, Record<number, number>>> = {
  [NetworkSlug.Mainnet]: {
    0: 1, // Ethereum
    2: 10, // Optimism
    3: 42161, // Arbitrum
    6: 8453, // Base
    7: 137, // Polygon PoS
  },
  [NetworkSlug.Sepolia]: {
    0: 11155111, // Ethereum
    2: 11155420, // Optimism
    3: 421614, // Arbitrum
    6: 84532, // Base
  }
}

export const CCTP_CHAIN_ID_TO_DOMAIN_MAP: Partial<Record<NetworkSlug, Record<number, number>>> = {
  [NetworkSlug.Mainnet]: {
    1: 0, // Ethereum
    10: 2, // Optimism
    42161: 3, // Arbitrum
    8453: 6, // Base
    137: 7, // Polygon PoS
  },
  [NetworkSlug.Sepolia]: {
    11155111: 0, // Ethereum
    11155420: 2, // Optimism
    421614: 3, // Arbitrum
    84532: 6, // Base
  }
}

// Remove all this in favor of the contract instance from the SDK when available
export function getMessageTransmitterContract (chainId: string): Contract {
  const iface = getCCTPMessageTransmitterContractInterface()
  const chainSlug = getChain(chainId).slug
  return new Contract(
    MessageTransmitterAddresses[SignerConfig.network]![chainSlug as ChainSlug]!,
    iface
  )
}

// Remove all this in favor of the contract instance from the SDK when available
export function getHopCCTPContract (chainId: string): Contract {
  const iface = getHopCCTPInterface()
  const chainSlug = getChain(chainId).slug
  return new Contract(
    HopCCTPAddresses[SignerConfig.network]![chainSlug as ChainSlug]!,
    iface
  )
}

export function getCCTPMessageTransmitterContractInterface (): utils.Interface {
  const abi: string[] = [
    'function usedNonces(bytes32 nonce) public pure returns (uint256)',
    'function receiveMessage(bytes message, bytes attestation)',
    'event MessageReceived(address indexed caller, uint32 sourceDomain, uint64 indexed nonce, bytes32 sender, bytes messageBody)',
    'event MessageSent(bytes message)'
  ]
  return new utils.Interface(abi)
}

export function getHopCCTPInterface (): utils.Interface {
  const abi: string[] = [
    'event CCTPTransferSent(uint64 indexed cctpNonce,uint256 indexed chainId,address indexed recipient,uint256 amount,uint256 bonderFee)'
  ]
  return new utils.Interface(abi)
}