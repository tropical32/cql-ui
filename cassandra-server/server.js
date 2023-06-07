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

app.get('/api/info/:table', (req, res) => {
  const table = req.params.table;
  const query = `DESCRIBE ${keyspace}.${table};`;

  client.execute(query)
    .then((result) => {
      let { columns } = extract_columns(
        result.rows[0].create_statement
      );

      res.json({ columns });
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


function extract_columns(create_statement) {
  const column_pattern = /^\s+(\w+)\s+(\w+)(?:,|$)/;
  const primary_key_pattern = /PRIMARY KEY \((.*?)\)/;

  const table_match = /CREATE TABLE \w+\.(.*?) \(/.exec(create_statement);
  if (!table_match) {
    throw new Error('Invalid create statement');
  }

  const tableName = table_match[1];
  const table_content = create_statement.substring(
    create_statement.indexOf('(') + 1, create_statement.lastIndexOf(')')
  );
  const lines = table_content.split(/\n|\r\n|\r/);
  const columns = [];

  let is_parsing_columns = true;

  for (const line of lines) {
    if (line.includes('PRIMARY KEY')) {
      is_parsing_columns = false;
    }

    if (is_parsing_columns) {
      const column_match = column_pattern.exec(line);
      if (column_match) {
        const column_name = column_match[1];
        const column_type = column_match[2];
        columns.push({ name: column_name, type: column_type });
      }
    }
  }

  return { columns };
}
