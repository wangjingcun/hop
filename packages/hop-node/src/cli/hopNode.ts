import OsWatcher from 'src/watchers/OsWatcher'
import { AssetSymbol } from '@hop-protocol/core/config'
import {
  BondThreshold,
  ShouldIgnoreBlockHashValidation,
  ShouldIgnoreProxy,
  bondWithdrawalBatchSize,
  gitRev,
  config as globalConfig,
  slackAuthToken,
  slackChannel,
  slackUsername
} from 'src/config'
import { HealthCheckWatcher } from 'src/watchers/HealthCheckWatcher'
import { actionHandler, logger, parseBool, parseNumber, parseString, parseStringArray, root } from './shared'
import { computeAddress } from 'ethers/lib/utils'
import { printHopArt } from './shared/art'
import { startArbBots } from 'src/arbBot'
import {
  startWatchers
} from 'src/watchers/watchers'

root
  .description('Start Hop node')
  .option(
    '--dry [boolean]',
    'Start in dry mode. If enabled, no transactions will be sent.',
    parseBool
  )
  .option(
    '--password-file <path>',
    'File containing password to unlock keystore',
    parseString
  )
  .option('--clear-db [boolean]', 'Clear cache database on start', parseBool)
  .option('--log-db-state [boolean]', 'Log db state periodically', parseBool)
  .option('--sync-from-date <string>', 'Date to start syncing db from, in ISO format YYYY-MM-DD', parseString)
  .option('--s3-upload [boolean]', 'Upload available liquidity info as JSON to S3', parseBool)
  .option('--s3-namespace <name>', 'S3 bucket namespace', parseString)
  .option('--health-check-days <number>', 'Health checker number of days to check for', parseNumber)
  .option('--health-check-cache-file <filepath>', 'Health checker cache file', parseString)
  .option('--heapdump [boolean]', 'Write heapdump snapshot to a file every 5 minutes', parseBool)
  .option('--enabled-checks <enabledChecks>', 'Enabled checks. Options are: lowBonderBalances,unbondedTransfers,unbondedTransferRoots,incompleteSettlements,challengedTransferRoots,unsyncedSubgraphs,lowAvailableLiquidityBonders', parseStringArray)
  .option('--arb-bot [boolean]', 'Run the Goerli arb bot', parseBool)
  .option(
    '--arb-bot-config <path>',
    'Arb bot(s) config JSON file',
    parseString
  )
  .action(actionHandler(main))

async function main (source: any) {
  printHopArt()
  logger.debug('starting hop node')
  logger.debug(`git revision: ${gitRev}`)

  const { config, syncFromDate, s3Upload, s3Namespace, clearDb, heapdump, healthCheckDays, healthCheckCacheFile, enabledChecks, dry: dryMode, arbBot: runArbBot, arbBotConfig } = source
  if (!config) {
    throw new Error('config file is required')
  }

  logger.warn(`dry mode: ${!!dryMode}`)
  if (s3Upload) {
    logger.info('s3 upload enabled')
  }
  if (s3Namespace) {
    logger.info(`s3 namespace: ${s3Namespace}`)
  }

  if (clearDb) {
    await clearDb()
    logger.debug(`cleared db at: ${globalConfig.db.path}`)
  }

  const tokens = []
  if (config?.tokens) {
    for (const k in config.tokens) {
      const v = config.tokens[k]
      if (v) {
        tokens.push(k)
      }
    }
  }

  const enabledNetworks: any = {}
  if (config?.chains) {
    for (const k in config.chains) {
      enabledNetworks[k] = !!config.chains[k]
    }
  }

  let commitTransfersMinThresholdAmounts: any = {}
  if (config?.commitTransfers) {
    if (config.commitTransfers?.minThresholdAmount) {
      commitTransfersMinThresholdAmounts =
        config.commitTransfers?.minThresholdAmount
    }
  }
  let settleBondedWithdrawalsThresholdPercent: any = {}
  if (config?.settleBondedWithdrawals) {
    if (config.settleBondedWithdrawals?.thresholdPercent) {
      settleBondedWithdrawalsThresholdPercent =
        config.settleBondedWithdrawals?.thresholdPercent
    }
  }
  logger.debug(`bondWithdrawalBatchSize: ${bondWithdrawalBatchSize}`)
  const slackEnabled = slackAuthToken && slackChannel && slackUsername
  if (slackEnabled) {
    logger.debug(`slack notifications enabled. channel #${slackChannel}`)
  }
  for (const k in globalConfig.networks) {
    if (!Object.keys(enabledNetworks).includes(k)) continue
    const { rpcUrl, redundantRpcUrls, subgraphUrl, customSyncType } = globalConfig.networks[k]
    logger.info(`${k} rpc: ${rpcUrl}`)
    logger.info(`${k} redundantRpcUrls: ${JSON.stringify(redundantRpcUrls)}`)
    logger.info(`${k} subgraphUrl: ${subgraphUrl}`)
    if (customSyncType) {
      logger.info(`${k} customSyncType: ${customSyncType}`)
    }
  }
  if (globalConfig.bonders) {
    const bonders: any = globalConfig.bonders
    for (const token of tokens) {
      logger.info(`config bonders for ${token}: ${JSON.stringify(bonders?.[token])}`)
    }
  }

  if (globalConfig?.bonderConfig) {
    logger.info(`using bond threshold: ${BondThreshold}`)
    const totalStake = globalConfig.bonderConfig?.totalStake
    if (totalStake) {
      for (const token of tokens) {
        if (token in totalStake) {
          logger.info(`bonder total stake for ${token}: ${totalStake[token as AssetSymbol]}`)
        }
      }
    }
  }

  for (const token of tokens) {
    for (const k in globalConfig.networks) {
      if (!Object.keys(enabledNetworks).includes(k)) continue

      const chainAddresses = globalConfig.addresses[token][k]
      if (
        chainAddresses?.proxy &&
        !ShouldIgnoreProxy
      ) {
        logger.info(`using proxy for ${token} on ${k}: ${chainAddresses.proxy}`)
      }

      if (
        chainAddresses?.validator &&
        !ShouldIgnoreBlockHashValidation
      ) {
        logger.info(`using validator for ${token} on ${k}: ${chainAddresses.validator}`)
      }
    }
  }

  if (globalConfig.bonderPrivateKey) {
    let privateKey = globalConfig.bonderPrivateKey
    if (!globalConfig.bonderPrivateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey
    }
    const bonderPublicAddress = computeAddress(privateKey)
    logger.info('Bonder public address:', bonderPublicAddress)
  }

  const { starts } = await startWatchers({
    enabledWatchers: Object.keys(config.watchers).filter(
      key => config.watchers[key]
    ),
    tokens,
    networks: Object.keys(enabledNetworks).filter(
      key => enabledNetworks[key]
    ),
    commitTransfersMinThresholdAmounts,
    settleBondedWithdrawalsThresholdPercent,
    dryMode,
    syncFromDate,
    s3Upload,
    s3Namespace
  })

  if (config?.routes) {
    for (const sourceChain in config?.routes) {
      for (const destinationChain in config.routes[sourceChain]) {
        logger.info(`route: ${sourceChain}→${destinationChain}`)
      }
    }
  }

  const promises: Array<Promise<void>> = []
  promises.push(new Promise((resolve) => {
    new OsWatcher({
      heapdump
    }).start()
    resolve()
  }))

  if (healthCheckDays) {
    let enabledChecksObj: any = null
    if (enabledChecks?.length) {
      enabledChecksObj = {
        lowBonderBalances: enabledChecks.includes('lowBonderBalances'),
        unbondedTransfers: enabledChecks.includes('unbondedTransfers'),
        unbondedTransferRoots: enabledChecks.includes('unbondedTransferRoots'),
        incompleteSettlements: enabledChecks.includes('incompleteSettlements'),
        challengedTransferRoots: enabledChecks.includes('challengedTransferRoots'),
        unsyncedSubgraphs: enabledChecks.includes('unsyncedSubgraphs'),
        lowAvailableLiquidityBonders: enabledChecks.includes('lowAvailableLiquidityBonders'),
        missedEvents: enabledChecks.includes('missedEvents'),
        invalidBondWithdrawals: enabledChecks.includes('invalidBondWithdrawals'),
        unrelayedTransfers: enabledChecks.includes('unrelayedTransfers'),
        unsetTransferRoots: enabledChecks.includes('unsetTransferRoots'),
        dnsNameserversChanged: enabledChecks.includes('dnsNameserversChanged'),
        lowOsResources: enabledChecks.includes('lowOsResources')
      }
    }

    promises.push(new Promise((resolve) => {
      new HealthCheckWatcher({
        days: healthCheckDays,
        s3Upload,
        s3Namespace,
        cacheFile: healthCheckCacheFile,
        enabledChecks: enabledChecksObj
      }).start()
      resolve()
    }))
  }

  if (runArbBot) {
    promises.push(new Promise((resolve) => {
      startArbBots({ dryMode, configFilePath: arbBotConfig })
      resolve()
    }))
  }

  await Promise.all([...starts, ...promises])
}
