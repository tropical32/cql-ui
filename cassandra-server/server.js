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
    console.log('Connected to Cassandra');
  })
  .catch((err) => {
    console.error('Error connecting to Cassandra', err);
  });

app.get('/api/data/:table', (req, res) => {
  const table = req.params.table;
  const query = `SELECT * FROM ${table}`;

  client.execute(query, [], options)
    .then((result) => {
      res.json(result.rows);
    })
    .catch((err) => {
      console.error('Error executing query', err);
      res.status(500).json({ error: 'Error executing query' });
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
      res.status(500).json({ error: 'Error executing query' });
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
      res.status(500).json({ error: 'Error executing query' });
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
      const key_cols = table_info.filter(({ kind }) => kind === "partition_key" || kind === "clustering").map(({ column_name }) => column_name);

      const update_queries = edited_rows.map(row => {
        const update_set_part = [];
        const update_where_part = [];

        Object.entries(row).forEach(([col, val]) => {
          if (key_cols.includes(col)) {
            update_where_part.push(`${col} = ${val}`);
          } else {
            update_set_part.push(`${col} = ${val}`);
          }
        });

        return `UPDATE ${keyspace}.${table} SET ${update_set_part.join(", ")} WHERE ${update_where_part.join(" AND ")};`;
      });

      return client.batch(update_queries);
    })
    .then(() => {
      console.log('Data updated on cluster');
      res.status(200).json({ message: 'Data updated successfully' });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.message });
    });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
