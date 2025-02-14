import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import React, { useState } from 'react'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Table } from '../Table'
import { useEvents } from '../../hooks/useEvents'

export function BundleCommittedEvents () {
  const eventName = 'BundleCommitted'
  const [filterBy, setFilterBy] = useState('bundleId')
  const [filterValue, setFilterValue] = useState('')
  const filter = { [filterBy]: filterValue }
  const { events, nextPage, previousPage, showNextButton, showPreviousButton, limit, loading } = useEvents(eventName, filter)

  const headers = [
    {
      key: 'timestamp',
      value: 'Timestamp'
    },
    {
      key: 'transactionHash',
      value: 'Transaction Hash'
    },
    {
      key: 'bundleId',
      value: 'Bundle ID'
    },
    {
      key: 'bundleRoot',
      value: 'Bundle Root'
    },
    {
      key: 'bundleFees',
      value: 'Bundle Fees'
    },
    {
      key: 'toChainId',
      value: 'To Chain ID'
    },
    {
      key: 'commitTime',
      value: 'Commit Time'
    },
    {
      key: 'eventChainId',
      value: 'Event Chain ID',
    },
  ]

  const rows = events.map((event: any) => {
    return [
      {
        key: 'timestamp',
        value: `${event.context.blockTimestamp} (${event.context.blockTimestampRelative})`,
        clipboardValue: event.context.blockTimestamp
      },
      {
        key: 'transactionHash',
        value: event.context.transactionHashTruncated,
        valueUrl: event.context.transactionHashExplorerUrl,
        clipboardValue: event.context.transactionHash
      },
      {
        key: 'bundleId',
        value: event.bundleIdTruncated,
        clipboardValue: event.bundleId
      },
      {
        key: 'bundleRoot',
        value: event.bundleRootTruncated,
        clipboardValue: event.bundleRoot
      },
      {
        key: 'bundleFees',
        value: event.bundleFeesDisplay,
        clipboardValue: event.bundleFees
      },
      {
        key: 'toChainId',
        value: event.toChainLabel,
        clipboardValue: event.toChainId
      },
      {
        key: 'commitTime',
        value: event.commitTime,
        clipboardValue: event.commitTime
      },
      {
        key: 'eventChainId',
        value: event.context.chainLabel,
        clipboardValue: event.context.chainId
      },
    ]
  })

  function handleFilterByChange (event: any) {
    setFilterBy(event.target.value)
  }

  return (
    <Box>
      <Table title={`${eventName} Events`} headers={headers} rows={rows} showNextButton={showNextButton} showPreviousButton={showPreviousButton} nextPage={nextPage} previousPage={previousPage} limit={limit} loading={loading} filters={
      <Box display="flex" justifyContent="flex-end" alignItems="center">
        <Box mr={2}>
          <Typography variant="body1">Filter</Typography>
        </Box>
        <Box mr={2}>
          <Select
            value={filterBy}
            onChange={handleFilterByChange}>
              <MenuItem value={'bundleId'}>Bundle ID</MenuItem>
              <MenuItem value={'bundleRoot'}>Bundle Root</MenuItem>
              <MenuItem value={'transactionHash'}>Transaction Hash</MenuItem>
          </Select>
        </Box>
        <Box>
          <TextField placeholder="0x" value={filterValue} onChange={(event: any) => setFilterValue(event.target.value)} />
        </Box>
      </Box>
        } />
    </Box>
  )
}
