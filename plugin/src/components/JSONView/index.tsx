import React, { useState } from 'react'

const JSONView = (data: JSON): JSX.Element => {
  const [expandedRows, setExpandedRows] = useState<string[]>([])

  const toggleRow = (rowId: string): void => {
    const isExpanded = expandedRows.includes(rowId)
    if (isExpanded) {
      setExpandedRows(expandedRows.filter((id) => id !== rowId))
    } else {
      setExpandedRows([...expandedRows, rowId])
    }
  }

  const renderRow = (row: any, level = 0): JSX.Element => {
    console.log(row)
    const rowId = `${level}-${row.key}`

    return (
      <React.Fragment key={rowId}>
        <tr>
          <td onClick={() => { toggleRow(rowId) }}>
            {row?.children && (
              <span>{expandedRows.includes(rowId) ? '-' : '+'}</span>
            )}
          </td>
          <td>{row.key}</td>
          <td>{row.value}</td>
        </tr>
      </React.Fragment>
    )
  }

  return (
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Key</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>{Object.entries(data).map(([key, value]) => renderRow({ key, value }))}</tbody>
    </table>
  )
}

export default JSONView
