import { useState, useEffect, useMemo } from 'react'
import { BigNumber, Signer } from 'ethers'
import { getAddress, parseEther, parseUnits } from 'ethers/lib/utils'
import { useWeb3Context } from 'src/contexts/Web3Context'
import logger from 'src/logger'
import Transaction from 'src/models/Transaction'
import { getBonderFeeWithId } from 'src/utils'
import { createTransaction } from 'src/utils/createTransaction'
import { amountToBN, formatError } from 'src/utils/format'
import { Hop, HopBridge } from '@hop-protocol/sdk'
import { useTransactionReplacement } from 'src/hooks'
import EventEmitter from 'eventemitter3'
import { isGoerli } from 'src/config'

export type TransactionHandled = {
  transaction: any
  txModel: Transaction
}

function handleTransaction(
  tx: any,
  fromNetwork: any,
  toNetwork: any,
  sourceToken: any,
  addTransaction: any
): TransactionHandled {
  const txModel = createTransaction(tx, fromNetwork, toNetwork, sourceToken)
  addTransaction(txModel)

  return {
    transaction: tx,
    txModel,
  }
}

export function useSendTransaction (props: any) {
  const {
    amountOutMin,
    customRecipient,
    deadline,
    totalFee,
    fromNetwork,
    fromTokenAmount,
    intermediaryAmountOutMin = BigNumber.from(0),
    sdk,
    setError,
    sourceToken,
    toNetwork,
    txConfirm,
    estimatedReceived,
  } = props
  const [tx, setTx] = useState<Transaction>()
  const [sending, setSending] = useState<boolean>(false)
  const [isGnosisSafeWallet, setIsGnosisSafeWallet] = useState<boolean>(false)
  const { provider, address, checkConnectedNetworkId, walletName } = useWeb3Context()
  const [recipient, setRecipient] = useState<string>()
  const [signer, setSigner] = useState<Signer>()
  const [bridge, setBridge] = useState<HopBridge>()
  const [lastPathSent, setLastPathSent] = useState<string | null>(null)
  const { waitForTransaction, addTransaction, updateTransaction } =
    useTransactionReplacement(walletName)
  const parsedAmount = useMemo(() => {
    if (!fromTokenAmount || !sourceToken) return BigNumber.from(0)
    return amountToBN(fromTokenAmount, sourceToken.decimals)
  }, [fromTokenAmount, sourceToken?.decimals])

  // Set signer
  useEffect(() => {
    if (provider) {
      const s = provider.getSigner()
      setSigner(s)
    }
  }, [provider, address]) // trigger on address change (ie metamask wallet change)

  // Set recipient and bridge
  useEffect(() => {
    async function setRecipientAndBridge() {
      if (signer) {
        try {
          const r = customRecipient || (await signer.getAddress())
          setRecipient(r)

          if (sourceToken) {
            const b = sdk.bridge(sourceToken.symbol).connect(signer)
            setBridge(b)
          }
        } catch (error) {}
      }
    }

    setRecipientAndBridge()
  }, [signer, sourceToken, customRecipient])

  // Master send method
  const send = async () => {
    try {
      if (!fromNetwork || !toNetwork) {
        throw new Error('A network is undefined')
      }
      setError(null)
      setTx(undefined)

      const networkId = Number(fromNetwork.networkId)
      const isNetworkConnected = await checkConnectedNetworkId(networkId)
      if (!isNetworkConnected) {
        throw new Error('wrong network connected')
      }

      try {
        if (customRecipient) {
          getAddress(customRecipient) // attempts to checksum
        }
      } catch (err) {
        throw new Error('Custom recipient address is invalid')
      }

      if (!signer) {
        throw new Error('Cannot send: signer does not exist.')
      }
      if (!sourceToken) {
        throw new Error('No from token selected')
      }

      setSending(true)
      logger.debug(`recipient: ${recipient}`)

      let txHandled: TransactionHandled

      if (fromNetwork.isLayer1) {
        txHandled = await sendl1ToL2()
        logger.debug(`sendl1ToL2 tx:`, txHandled.txModel)
      } else if (!fromNetwork.isLayer1 && toNetwork.isLayer1) {
        txHandled = await sendl2ToL1()
        logger.debug(`sendl2ToL1 tx:`, txHandled.txModel)
      } else {
        txHandled = await sendl2ToL2()
        logger.debug(`sendl2ToL2 tx:`, txHandled.txModel)
      }

      const { transaction, txModel } = txHandled

      const watcher = (sdk as Hop).watch(
        txModel.hash,
        sourceToken.symbol,
        fromNetwork.slug,
        toNetwork.slug
      )

      if (watcher instanceof EventEmitter) {
        watcher.once(sdk.Event.DestinationTxReceipt, async (data: any) => {
          logger.debug(`dest tx receipt event data:`, data)
          if (txModel && !txModel.destTxHash) {
            const opts = {
              destTxHash: data.receipt.transactionHash,
              pendingDestinationConfirmation: false,
            }
            updateTransaction(txModel, opts)
          }
        })
      }

      setLastPathSent(`${fromNetwork.slug}-${toNetwork.slug}-${sourceToken.symbol}`)

      setTx(txModel)

      const txModelArgs = {
        networkName: fromNetwork.slug,
        destNetworkName: toNetwork.slug,
        token: sourceToken,
      }

      const res = await waitForTransaction(transaction, txModelArgs)

      if (res && 'replacementTxModel' in res) {
        setTx(res.replacementTxModel)
        const { replacementTxModel: txModelReplacement } = res

        // Replace watcher
        const replacementWatcher = sdk.watch(
          txModelReplacement.hash,
          sourceToken!.symbol,
          fromNetwork.slug,
          toNetwork.slug
        )
        replacementWatcher.once(sdk.Event.DestinationTxReceipt, async (data: any) => {
          logger.debug(`replacement dest tx receipt event data:`, data)
          if (txModelReplacement && !txModelReplacement.destTxHash) {
            const opts = {
              destTxHash: data.receipt.transactionHash,
              pendingDestinationConfirmation: false,
              replaced: transaction.hash,
            }
            updateTransaction(txModelReplacement, opts)
          }
        })
      }
    } catch (err: any) {
      if (!/cancelled/gi.test(err.message)) {
        setError(formatError(err, fromNetwork))
      }
      logger.error(err)
    }
    setSending(false)
  }

  const sendl1ToL2 = async () => {
    if (sourceToken.symbol === sdk.Token.ETH && fromNetwork.isL1 && toNetwork.slug === sdk.Chain.Linea.slug) {
      if (parsedAmount.gt(parseEther('10'))) {
        throw new Error('Deposits into Linea are limited to 10 ETH maximum. Please send 10 ETH or less.')
      }
    }

    const tx: any = await txConfirm?.show({
      kind: 'send',
      inputProps: {
        customRecipient,
        isGnosisSafeWallet,
        source: {
          amount: fromTokenAmount,
          token: sourceToken,
          network: fromNetwork,
        },
        dest: {
          network: toNetwork,
        },
        estimatedReceived,
      },
      onConfirm: async () => {
        if (!amountOutMin || !bridge) return

        const networkId = Number(fromNetwork.networkId)
        const isNetworkConnected = await checkConnectedNetworkId(networkId)
        if (!isNetworkConnected) {
          throw new Error('wrong network connected')
        }

        let relayerFeeWithId = getBonderFeeWithId(totalFee)
        if (isGoerli) {
          // Do not use an ID for a relayer fee on Goerli
          relayerFeeWithId = getBonderFeeWithId(totalFee, '')
        }

        return bridge.send(parsedAmount, sdk.Chain.Ethereum, toNetwork?.slug, {
          deadline: deadline(),
          relayerFee: relayerFeeWithId,
          recipient,
          amountOutMin: amountOutMin.sub(relayerFeeWithId)
        })
      },
    })

    return handleTransaction(tx, fromNetwork, toNetwork, sourceToken, addTransaction)
  }

  const sendl2ToL1 = async () => {
    const tx: any = await txConfirm?.show({
      kind: 'send',
      inputProps: {
        customRecipient,
        isGnosisSafeWallet,
        source: {
          amount: fromTokenAmount,
          token: sourceToken,
          network: fromNetwork,
        },
        dest: {
          network: toNetwork,
        },
        estimatedReceived,
      },
      onConfirm: async () => {
        if (!amountOutMin || !totalFee || !bridge) return
        if (totalFee.gt(parsedAmount)) {
          throw new Error('Amount must be greater than bonder fee')
        }

        const networkId = Number(fromNetwork.networkId)
        const isNetworkConnected = await checkConnectedNetworkId(networkId)
        if (!isNetworkConnected) {
          throw new Error('wrong network connected')
        }

        const bonderFeeWithId = getBonderFeeWithId(totalFee)

        return bridge.send(parsedAmount, fromNetwork?.slug as string, toNetwork?.slug as string, {
          recipient,
          bonderFee: bonderFeeWithId,
          amountOutMin: amountOutMin.sub(bonderFeeWithId),
          deadline: deadline(),
          destinationAmountOutMin: 0,
          destinationDeadline: 0,
        })
      },
    })

    return handleTransaction(tx, fromNetwork, toNetwork, sourceToken, addTransaction)
  }

  const sendl2ToL2 = async () => {
    const tx = await txConfirm?.show({
      kind: 'send',
      inputProps: {
        customRecipient,
        isGnosisSafeWallet,
        source: {
          amount: fromTokenAmount,
          token: sourceToken,
          network: fromNetwork,
        },
        dest: {
          network: toNetwork,
        },
        estimatedReceived,
      },
      onConfirm: async () => {
        if (!totalFee || !bridge) return
        if (totalFee.gt(parsedAmount)) {
          throw new Error('Amount must be greater than bonder fee')
        }

        const networkId = Number(fromNetwork.networkId)
        const isNetworkConnected = await checkConnectedNetworkId(networkId)
        if (!isNetworkConnected) {
          throw new Error('wrong network connected')
        }

        const bonderFeeWithId = getBonderFeeWithId(totalFee)

        return bridge.send(parsedAmount, fromNetwork?.slug as string, toNetwork?.slug as string, {
          recipient,
          bonderFee: bonderFeeWithId,
          amountOutMin: intermediaryAmountOutMin.sub(bonderFeeWithId),
          deadline: deadline(),
          destinationAmountOutMin: amountOutMin.sub(bonderFeeWithId),
          destinationDeadline: deadline(),
        })
      },
    })

    return handleTransaction(tx, fromNetwork, toNetwork, sourceToken, addTransaction)
  }

  return {
    send,
    sending,
    tx,
    setTx,
    setIsGnosisSafeWallet,
    lastPathSent
  }
}
