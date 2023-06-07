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
      let { columns, primary_key } = extractColumnsAndPrimaryKeys(result.rows[0].create_statement);

      res.json({ columns, primary_key });
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


function extractColumnsAndPrimaryKeys(createStatement) {
  const columnPattern = /^\s+(\w+)\s+(\w+)(?:,|$)/;
  const primaryKeyPattern = /PRIMARY KEY \((.*?)\)/;

  const tableMatch = /CREATE TABLE \w+\.(.*?) \(/.exec(createStatement);
  if (!tableMatch) {
    throw new Error('Invalid create statement');
  }

  const tableName = tableMatch[1];
  const tableContent = createStatement.substring(createStatement.indexOf('(') + 1, createStatement.lastIndexOf(')'));
  const lines = tableContent.split(/\n|\r\n|\r/);
  const columns = [];
  let primary_key = [];

  let isParsingColumns = true;

  for (const line of lines) {
    if (line.includes('PRIMARY KEY')) {
      isParsingColumns = false;
    }

    if (isParsingColumns) {
      const columnMatch = columnPattern.exec(line);
      if (columnMatch) {
        const columnName = columnMatch[1];
        const columnType = columnMatch[2];
        columns.push({ name: columnName, type: columnType });
      }
    } else {
      const primaryKeyMatch = primaryKeyPattern.exec(line);
      if (primaryKeyMatch) {
        const primaryKeyColumns = primaryKeyMatch[1].split(',').map(key => key.trim());
        primary_key = primaryKeyColumns;
      }
    }
  }

  return { columns, primary_key };
}

