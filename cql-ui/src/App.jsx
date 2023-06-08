import React, {
  useEffect, useState, useRef, useCallback,
} from 'react';
import axios from 'axios';

import { objectsEqual } from './utils';

import Table from './components/Table';
import KeyspaceSelector from './components/KeyspaceSelector';
import TableSelector from './components/TableSelector';
import SaveButton from './components/SaveButton';
import DiscardButton from './components/DiscardButton';
import Filters from './components/Filters';
import AddButton from './components/AddButton';

import './App.css';

function App() {
  const rowCounter = useRef(0);
  const keyspace = useRef('');
  const [keyspaces, setKeyspaces] = useState([]);
  const [tableName, setTableName] = useState('');
  const [tables, setTables] = useState([]);
  const [tableData, setTableData] = useState({});
  const [tableDataShadow, setTableDataShadow] = useState({});
  const [tableColumns, setTableColumns] = useState([]);
  const [error, setError] = useState(null);
  const [addRows, setAddRows] = useState({});
  const [rowsToDelete, setRowsToDelete] = useState([]);

  const axiosInstance = axios.create({
    baseURL: 'http://127.0.0.1:7777',
  });

  function copyShadowRowsToRows() {
    setTableData(structuredClone(tableDataShadow));
  }

  function updateTableEntry(key, column, value) {
    setTableData((currTableData) => {
      const nextTableData = structuredClone(currTableData);
      nextTableData[key][column] = value;

      return nextTableData;
    });
  }

  function updateAddableTableEntry(key, column, value) {
    setAddRows((currAddRows) => {
      const nextAddRows = structuredClone(currAddRows);
      nextAddRows[key][column] = value;

      return nextAddRows;
    });
  }

  function decrementAddRowCounter() {
    rowCounter.current -= 1;

    return rowCounter.current;
  }

  function addToDeleteRow(rowId) {
    setRowsToDelete([...rowsToDelete, rowId]);
  }

  function addRow() {
    setAddRows((currAddRows) => {
      const nextAddRowCounter = decrementAddRowCounter();
      const emptyColumns = Object.fromEntries(
        tableColumns.map(({ column_name: columnName }) => [columnName, '']),
      );

      return { ...currAddRows, [nextAddRowCounter]: emptyColumns };
    });
  }

  function fetchTableData(tableNameToFetch, queryParams) {
    axiosInstance
      .get(`/api/data/${tableNameToFetch}`, { params: { ...queryParams, keyspace: keyspace.current } })
      .then((response) => {
        const rowsStringified = response.data.map((row) => Object.fromEntries(
          Object.entries(row).map(([col, val]) => ([col, val == null ? null : val.toString()])),
        ));

        const orderedTableData = Object.fromEntries(
          rowsStringified.map((row) => [decrementAddRowCounter(), row]),
        );

        setTableData(orderedTableData);
        setTableDataShadow(structuredClone(orderedTableData));
        setError(null);
      })
      .catch((err) => {
        setError(err);
      });
  }

  function updateTableDataOnSuccess() {
    setError(null);
    setTableData({});
    setTableDataShadow({});
    setRowsToDelete([]);
    setAddRows({});

    fetchTableData(tableName);
  }

  function onSave() {
    const editedRowsIds = Object
      .entries(tableData)
      .filter(([id, dataRow]) => {
        const shadowRow = tableDataShadow[id];
        return !objectsEqual(dataRow, shadowRow);
      })
      .map(([id]) => id);

    const editedRows = editedRowsIds.map((id) => tableData[id]);
    const addRowsArray = Object.values(addRows);
    const rowsToDeleteArray = rowsToDelete.map((id) => tableData[id]);

    const data = {
      edited_rows: editedRows,
      added_rows: addRowsArray,
      deleted_rows: rowsToDeleteArray,
    };

    if (editedRows.length > 0 || addRowsArray.length > 0 || rowsToDelete.length > 0) {
      axiosInstance
        .post(`/api/data/${tableName}`, { ...data, keyspace: keyspace.current })
        .then(updateTableDataOnSuccess)
        .catch((err) => setError(err));
    }
  }

  function removeAddableRow(id) {
    const nextAddableRows = structuredClone(addRows);
    delete nextAddableRows[id];

    setAddRows(nextAddableRows);
  }

  function removeFromToDeleteRow(retainedRowId) {
    setRowsToDelete((currRowsToDelete) => currRowsToDelete.filter((id) => id !== retainedRowId));
  }

  function fetchTableColumns(tableNameToFetch) {
    axiosInstance
      .get(`/api/columns/${tableNameToFetch}`, { params: { keyspace: keyspace.current } })
      .then((response) => {
        setTableColumns(response.data);
        setError(null);
      })
      .catch((err) => {
        setError(err);
      });
  }

  function onFilterSubmit(formElements) {
    fetchTableData(tableName, { filters: formElements });
  }

  function onKeyspaceChanged(nextKeyspace) {
    keyspace.current = nextKeyspace;

    setTableData({});
    setTableDataShadow({});
    setRowsToDelete([]);
    setTableName('');
    setTableColumns([]);
    setAddRows([]);
    setTables([]);

    if (nextKeyspace !== '') {
      axiosInstance
        .get('/api/tables', { params: { keyspace: keyspace.current } })
        .then((response) => {
          setTables(response.data);
          setError(null);
        })
        .catch((err) => {
          setError(err);
        });
    }
  }

  function onTableChange(nextTableName) {
    setTableData({});
    setTableDataShadow({});
    setRowsToDelete([]);
    setTableName('');
    setTableColumns([]);
    setAddRows([]);

    if (nextTableName !== '') {
      setTableName(nextTableName);
      fetchTableColumns(nextTableName);
      fetchTableData(nextTableName);
    }
  }

  function onDiscardChanges() {
    setRowsToDelete([]);
    setAddRows([]);
    copyShadowRowsToRows();
  }

  const onKeyspaceChangedCallback = useCallback((nextKeyspace) => onKeyspaceChanged(nextKeyspace));
  const onSaveCallback = useCallback(onSave);
  const addRowCallback = useCallback(addRow);
  const onFilterSubmitCallback = useCallback(onFilterSubmit);
  const addToDeleteRowCallback = useCallback(addToDeleteRow);
  const removeFromToDeleteRowCallback = useCallback(removeFromToDeleteRow);
  const removeAddableRowCallback = useCallback(removeAddableRow);
  const updateTableEntryCallback = useCallback(updateTableEntry);
  const onTableChangeCallback = useCallback(onTableChange);
  const onDiscardChangesCallback = useCallback(onDiscardChanges);
  const updateAddableTableEntryCallback = useCallback(
    (key, column, value) => updateAddableTableEntry(key, column, value),
  );

  useEffect(() => {
    axiosInstance
      .get('/api/keyspaces')
      .then((response) => {
        setKeyspaces(response.data);
      })
      .catch((err) => {
        setError(err);
      });
  }, []);

  return (
    <div className="main">
      {error && <div className="error">{error?.response?.data?.error}</div>}
      <KeyspaceSelector onChange={onKeyspaceChangedCallback} keyspaces={keyspaces} />
      <TableSelector
        tables={tables}
        onChange={onTableChangeCallback}
      />
      <div className="buttons-group">
        <SaveButton onSave={onSaveCallback} />
        <DiscardButton
          onDiscardChanges={onDiscardChangesCallback}
        />
        <AddButton isActive={tableName !== ''} onAddRow={addRowCallback} />
      </div>
      <div className="buttons-group">
        <Filters tableColumns={tableColumns} onSubmit={onFilterSubmitCallback} />
      </div>
      <Table
        columns={tableColumns}
        updateAddableTableEntry={updateAddableTableEntryCallback}
        name={tableName}
        data={tableData}
        dataShadow={tableDataShadow}
        addToDeleteRow={addToDeleteRowCallback}
        removeFromToDeleteRow={removeFromToDeleteRowCallback}
        rowsToDelete={rowsToDelete}
        addRows={addRows}
        removeAddableRow={removeAddableRowCallback}
        updateTableEntry={updateTableEntryCallback}
      />
    </div>
  );
}

export default App;
