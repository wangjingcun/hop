import Box from '@mui/material/Box'
import React, { FC } from 'react'
import Typography from '@mui/material/Typography'
import { DetailRow } from '#components/InfoTooltip/DetailRow.js'
import { makeStyles } from '@mui/styles'

const useStyles = makeStyles(theme => ({
  root: {
    padding: `${theme.padding.extraLight} !important`,
    width: '32.0rem !important',
  },
  text: {
    color: `${theme.palette.primary.contrastText} !important`,
    paddingBottom: `${theme.padding.extraLight} !important`,
  },
}))

type Props = {
  bonderFee?: string
  bonderFeeUsd?: string
  destinationTxFee?: string
  destinationTxFeeUsd?: string
  relayFee?: string
  relayFeeUsd?: string
}

export const FeeDetails: FC<Props> = props => {
  const styles = useStyles()
  const { bonderFee, bonderFeeUsd, destinationTxFee, destinationTxFeeUsd, relayFee, relayFeeUsd } = props

  return (
    <div className={styles.root}>
      <Typography variant="body1" className={styles.text}>
        The total fee covers the bonder fee and the destination transaction cost paid by the Bonder.
      </Typography>
      <Typography variant="body1" className={styles.text}>
        On Optimism, Base, Arbitrum, and Nova the destination tx fee fluctuates with L1 gas price.
      </Typography>
      <Typography variant="body1" className={styles.text}>
        LP fees are included in the swap price.
      </Typography>
      {!!relayFee && (
        <Typography variant="body1" className={styles.text}>
          The relay fee is set by the L1 bridge.
        </Typography>
      )}
      {!!relayFee && (
        <DetailRow title="Message Relay Fee" value={<>
          {relayFeeUsd && (
            <Box mr={0.5} display="inline-block" style={{ opacity: 0.6 }}><small>{relayFeeUsd}</small></Box>
          )}
          <Box display="inline-block">{relayFee}</Box>
        </>} contrastText />
      )}
      <DetailRow title="Bonder fee" value={<>
        {!!bonderFeeUsd && (
          <Box mr={0.5} display="inline-block" style={{ opacity: 0.6 }}><small>{bonderFeeUsd}</small></Box>
        )}
        <Box display="inline-block">{bonderFee}</Box>
      </>} contrastText />
      <DetailRow title="Destination tx cost" value={<>
        {!!bonderFeeUsd && (
          <Box mr={0.5} display="inline-block" style={{ opacity: 0.6 }}><small>{destinationTxFeeUsd}</small></Box>
        )}
        <Box display="inline-block">{destinationTxFee}</Box>
      </>} contrastText />
    </div>
  )
}
