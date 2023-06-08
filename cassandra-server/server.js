/* eslint-disable no-console */
const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('cassandra-driver');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const contactPoints = [process.env.NODE_CONTACT_POINT];
const localDataCenter = process.env.LOCAL_DATA_CENTER || 'datacenter1';
const serverPort = process.env.SERVER_PORT || 7777;

const client = new Client({
  contactPoints,
  localDataCenter,
});
const options = { fetchSize: 200 };

client.connect()
  .then(() => {
    console.log('Connected to DB');
  })
  .catch((err) => {
    console.error('Error connecting to DB', err);
  });

app.get('/api/data/:table', (req, res) => {
  const keyspace = req.query.keyspace || req.body.keyspace;
  const { table } = req.params;
  let query = `SELECT * FROM ${keyspace}.${table}`;

  const filters = req.query.filters || req.body.filters;
  const filterParams = [];

  if (filters) {
    const filterConditions = [];

    Object.entries(filters).forEach(([col, val]) => {
      filterConditions.push(`${col} = ?`);
      filterParams.push(val);
    });

    if (filterConditions.length > 0) {
      query += ` WHERE ${filterConditions.join(' AND ')}`;
    }
  }

  client.execute(query, filterParams, { ...options, prepare: true })
    .then((result) => {
      res.json(result.rows);
    })
    .catch((err) => {
      console.error('Error executing query', err);
      res.status(500).json({ error: err.message });
    });
});

app.get('/api/columns/:table', (req, res) => {
  const keyspace = req.query.keyspace || req.body.keyspace;
  const { table } = req.params;
  const query = 'SELECT column_name, kind, type FROM system_schema.columns WHERE keyspace_name = ? AND table_name = ?;';
  const params = [keyspace, table];

  client.execute(query, params, options)
    .then((result) => {
      res.json(result.rows);
    })
    .catch((err) => {
      console.error('Error executing query', err);
      res.status(500).json({ error: err.message });
    });
});

app.get('/api/tables', (req, res) => {
  const query = 'SELECT table_name FROM system_schema.tables WHERE keyspace_name = ?;';
  const keyspace = req.query.keyspace || req.body.keyspace;
  const params = [keyspace];

  client.execute(query, params, options)
    .then((result) => {
      res.json(result.rows.map(({ table_name: tableName }) => tableName));
    })
    .catch((err) => {
      console.error('Error executing query', err);
      res.status(500).json({ error: err.message });
    });
});

app.get('/api/keyspaces', (req, res) => {
  const query = 'SELECT keyspace_name FROM system_schema.keyspaces';

  client.execute(query, [], options)
    .then((result) => {
      console.log(result);
      res.json(result.rows.map(({ keyspace_name: keyspaceName }) => keyspaceName));
    })
    .catch((err) => {
      console.error('Error executing query', err);
      res.status(500).json({ error: err.message });
    });
});

app.post('/api/data/:table', (req, res) => {
  const keyspace = req.query.keyspace || req.body.keyspace;
  const { table } = req.params;
  const query = 'SELECT column_name, kind, type FROM system_schema.columns WHERE keyspace_name = ? AND table_name = ?;';
  const params = [keyspace, table];

  const { edited_rows: editedRows, added_rows: addedRows, deleted_rows: deletedRows } = req.body;

  client.execute(query, params, options)
    .then((result) => {
      const tableInfo = result.rows;
      const keyCols = tableInfo
        .filter(({ kind }) => kind === 'partition_key' || kind === 'clustering')
        .map(({ column_name: columnName }) => columnName);

      const updateQueries = editedRows.map((row) => {
        const updateSetPart = [];
        const updateWherePart = [];
        const queryParams = [];

        const rowEntries = Object.entries(row);
        const keyPairs = rowEntries.filter(([col]) => keyCols.includes(col));
        const regularPairs = rowEntries.filter(([col]) => !keyCols.includes(col));

        regularPairs.forEach(([col, val]) => {
          updateSetPart.push(`${col} = ?`);
          queryParams.push(val || null);
        });

        keyPairs.forEach(([col, val]) => {
          updateWherePart.push(`${col} = ?`);
          queryParams.push(val);
        });

        const updateQuery = `UPDATE ${keyspace}.${table} SET ${updateSetPart.join(',')} WHERE ${updateWherePart.join(' AND ')};`;
        return { query: updateQuery, params: queryParams };
      });

      const insertQueries = addedRows.map((row) => {
        const colNames = Object.keys(row);
        const colVals = Object.values(row);
        const valuePlaceholders = colVals.map(() => '?');
        const insertQuery = `INSERT INTO ${keyspace}.${table} (${colNames.join(', ')}) VALUES (${valuePlaceholders.join(', ')});`;
        const insertParams = colVals.map((val) => val || null);
        return { query: insertQuery, params: insertParams };
      });

      const deleteQueries = deletedRows.map((row) => {
        const wherePart = keyCols.map((colName) => `${colName} = ?`);
        const deleteQuery = `DELETE FROM ${keyspace}.${table} WHERE ${wherePart.join(' AND ')};`;
        const deleteParams = keyCols.map((colName) => row[colName]);
        return { query: deleteQuery, params: deleteParams };
      });

      return client.batch(
        [...updateQueries, ...insertQueries, ...deleteQueries],
        { prepare: true },
      );
    })
    .then(() => {
      console.log('Data updated on cluster');
      res.status(200).json({ message: 'Data updated successfully.' });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.message });
    });
});

app.listen(serverPort, () => {
  console.log(`Server running on port ${serverPort}`);
});
