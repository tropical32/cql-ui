const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('cassandra-driver');
const cors = require('cors');

const app = express();
const port = 7777;
const keyspace = 'ks';

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const client = new Client({
  contactPoints: ['172.18.0.7'],
  localDataCenter: 'datacenter1',
  keyspace: keyspace,
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
  const table = req.params.table;
  let query = `SELECT * FROM ${table}`;

  const filters = req.query.filters || req.body.filters;
  const filterParams = [];

  if (filters) {
    const filterConditions = [];

    Object.entries(filters).map(([col, val]) => {
      filterConditions.push(`${col} = ?`);
      filterParams.push(val);
    });

    console.log(filterConditions);

    if (filterConditions.length > 0) {
      query += ` WHERE ${filterConditions.join(' AND ')}`;
    }
  }

  console.log(query, filterParams);

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
  const table = req.params.table;
  const query = `SELECT column_name, kind, type FROM system_schema.columns WHERE keyspace_name = ? AND table_name = ?;`;
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
  const query = `SELECT table_name FROM system_schema.tables WHERE keyspace_name = ?;`;
  const params = [keyspace];

  client.execute(query, params, options)
    .then((result) => {
      res.json(result.rows.map(({ table_name }) => table_name));
    })
    .catch((err) => {
      console.error('Error executing query', err);
      res.status(500).json({ error: err.message });
    });
});

app.post('/api/data/:table', (req, res) => {
  const table = req.params.table;
  const query = `SELECT column_name, kind, type FROM system_schema.columns WHERE keyspace_name = ? AND table_name = ?;`;
  const params = [keyspace, table];

  const { edited_rows, added_rows, deleted_rows } = req.body;

  client.execute(query, params, options)
    .then((result) => {
      const table_info = result.rows;
      const key_cols = table_info
        .filter(({ kind }) => kind === "partition_key" || kind === "clustering")
        .map(({ column_name }) => column_name);

      const update_queries = edited_rows.map(row => {
        const update_set_part = [];
        const update_where_part = [];
        const query_params = [];

        const row_entries = Object.entries(row);
        const key_pairs = row_entries.filter(([col, val]) => key_cols.includes(col));
        const regular_pairs = row_entries.filter(([col, val]) => !key_cols.includes(col));

        regular_pairs.forEach(([col, val]) => {
          update_set_part.push(`${col} = ?`);
          query_params.push(val || null);
        });

        key_pairs.forEach(([col, val]) => {
          update_where_part.push(`${col} = ?`);
          query_params.push(val);
        });

        const update_query = `UPDATE ${keyspace}.${table} SET ${update_set_part.join(",")} WHERE ${update_where_part.join(" AND ")};`;
        return { query: update_query, params: query_params };
      });

      const insert_queries = added_rows.map(row => {
        const col_names = Object.keys(row);
        const col_vals = Object.values(row);
        const value_placeholders = col_vals.map(() => '?');
        const insert_query = `INSERT INTO ${keyspace}.${table} (${col_names.join(", ")}) VALUES (${value_placeholders.join(", ")});`;
        const insert_params = col_vals.map(val => val || null);
        return { query: insert_query, params: insert_params };
      });

      const delete_queries = deleted_rows.map(row => {
        const where_part = key_cols.map(col_name => `${col_name} = ?`);
        const delete_query = `DELETE FROM ${keyspace}.${table} WHERE ${where_part.join(" AND ")};`;
        const delete_params = key_cols.map(col_name => row[col_name]);
        return { query: delete_query, params: delete_params };
      });

      return client.batch([...update_queries, ...insert_queries, ...delete_queries], { prepare: true });
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
