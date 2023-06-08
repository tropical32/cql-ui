import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './Table.css';

import { objectsEqual } from '../utils';

export default function Table({
  data = {},
  dataShadow = {},
  name = '',
  addToDeleteRow,
  removeFromToDeleteRow,
  rowsToDelete = [],
  addRows = [],
  removeAddableRow,
  updateTableEntry,
  updateAddableTableEntry,
  columns = [],
}) {
  if (name === '') {
    return null;
  }

  const addRowsLen = Object.keys(addRows).length;
  const dataLen = Object.keys(data).length;
  const shadowDataLen = Object.keys(dataShadow).length;

  if (addRowsLen === 0 && dataLen === 0) {
    return null;
  }

  if (dataLen !== shadowDataLen) {
    return null;
  }

  return (
    <table key={name} className="table">
      <thead>
        <tr>
          {columns.map(({ column_name: columnName, kind }) => (
            <td
              className={classNames({
                'partition-key': kind === 'partition_key',
                'clustering-key': kind === 'clustering',
              })}
              key={columnName}
            >
              {columnName}
            </td>
          ))}
          <td />
        </tr>
      </thead>
      <tbody>
        {Object.entries(addRows).map(([order, entry]) => (
          <tr key={`addable-${order}`} className="addable">
            {columns.map(({ column_name: columnName, type }) => {
              const value = entry[columnName];

              if (type === 'boolean') {
                return (
                  <td key={`addable-${columnName}${name}`}>
                    <input
                      type="checkbox"
                      onChange={(event) => updateAddableTableEntry(
                        order,
                        columnName,
                        event.target.checked,
                      )}
                      className="table-input"
                      value={value}
                      checked={value}
                    />
                  </td>
                );
              }

              return (
                <td key={`addable-${columnName}${name}`}>
                  <input
                    onChange={(event) => updateAddableTableEntry(
                      order,
                      columnName,
                      event.target.value,
                    )}
                    className="table-input"
                    value={value}
                    placeholder="null"
                    type="text"
                  />
                </td>
              );
            })}
            <td>
              <button
                type="button"
                onClick={() => {
                  removeAddableRow(order);
                }}
              >
                🗑️
              </button>
            </td>
          </tr>
        ))}
        {Object.entries(data).map(([order, entry]) => {
          const isPendingDeletion = rowsToDelete.includes(order);
          const isEdited = !objectsEqual(entry, dataShadow[order]);

          return (
            <tr
              key={order + name}
              className={classNames({
                changed: isEdited,
                'pending-del': isPendingDeletion,
              })}
            >
              {columns.map(({ column_name: columnName, kind, type }) => {
                const value = entry[columnName];
                const isPartitionKey = kind === 'partition_key';
                const isClusteringKey = kind === 'clustering';

                if (type === 'boolean') {
                  return (
                    <td key={order + columnName + name}>
                      <input
                        type="checkbox"
                        onChange={(event) => updateTableEntry(
                          order,
                          columnName,
                          event.target.checked,
                        )}
                        className="table-input"
                        value={value}
                        checked={value}
                        disabled={isClusteringKey || isPartitionKey}
                      />
                    </td>
                  );
                }

                return (
                  <td key={order + columnName + name}>
                    <input
                      onChange={(event) => updateTableEntry(
                        order,
                        columnName,
                        event.target.value,
                      )}
                      className="table-input"
                      value={value}
                      placeholder="null"
                      disabled={isClusteringKey || isPartitionKey}
                      type="text"
                    />
                  </td>
                );
              })}
              <td>
                <button
                  type="button"
                  onClick={() => {
                    if (isPendingDeletion) {
                      removeFromToDeleteRow(order);
                    } else {
                      addToDeleteRow(order);
                    }
                  }}
                >
                  🗑️
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

Table.propTypes = {
  data: PropTypes.shape().isRequired,
  dataShadow: PropTypes.shape().isRequired,
  name: PropTypes.string.isRequired,
  addToDeleteRow: PropTypes.func.isRequired,
  removeFromToDeleteRow: PropTypes.func.isRequired,
  rowsToDelete: PropTypes.arrayOf(PropTypes.shape).isRequired,
  addRows: PropTypes.objectOf(PropTypes.shape).isRequired,
  removeAddableRow: PropTypes.func.isRequired,
  updateTableEntry: PropTypes.func.isRequired,
  updateAddableTableEntry: PropTypes.func.isRequired,
  columns: PropTypes.arrayOf(PropTypes.shape).isRequired,
};
