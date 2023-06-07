const express = require('express');
const { Client } = require('cassandra-driver');
const cors = require('cors');

const app = express();
const port = 7777;
const keyspace = 'ks';

app.use(cors());

const client = new Client({
  contactPoints: ['172.18.0.7'],
  localDataCenter: 'datacenter1',
  keyspace: keyspace,
});

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

  client.execute(query)
    .then((result) => {
      res.json(result.rows);
    })
    .catch((err) => {
      console.error('Error executing query', err);
      res.status(500).json({ error: 'Error executing query' });
    });
});

app.get('/api/tables', (req, res) => {
  const query = `SELECT table_name FROM system_schema.tables WHERE keyspace_name = '${keyspace}';`;

  client.execute(query)
    .then((result) => {
      res.json(result.rows.map(({ table_name }) => table_name));
    })
    .catch((err) => {
      console.error('Error executing query', err);
      res.status(500).json({ error: 'Error executing query' });
    });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
