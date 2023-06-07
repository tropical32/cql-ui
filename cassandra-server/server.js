const express = require('express');
const { Client } = require('cassandra-driver');
const cors = require('cors'); // Import the cors package

const app = express();
const port = 7777;
const keyspace = 'ks';

app.use(cors()); // Enable CORS for all routes

// Create a new Cassandra client instance
const client = new Client({
  contactPoints: ['172.18.0.7'], // Replace with your Cassandra cluster contact points
  localDataCenter: 'datacenter1', // Replace with your Cassandra data center
  keyspace: keyspace // Replace with your Cassandra keyspace
});

// Connect to the Cassandra cluster
client.connect()
  .then(() => {
    console.log('Connected to Cassandra');
  })
  .catch((err) => {
    console.error('Error connecting to Cassandra', err);
  });

// Define a route to fetch data from Cassandra
app.get('/api/data/:table', (req, res) => {
  const table = req.params.table; // Extract the table parameter from the request
  const query = `SELECT * FROM ${table}`; // Use the table parameter in the query

  // Execute the query
  client.execute(query)
    .then((result) => {
      res.json(result.rows); // Send the retrieved data as JSON
    })
    .catch((err) => {
      console.error('Error executing query', err);
      res.status(500).json({ error: 'Error executing query' });
    });
});

app.get('/api/tables', (req, res) => {
  const query = `SELECT table_name FROM system_schema.tables WHERE keyspace_name = '${keyspace}';`;

  // Execute the query
  client.execute(query)
    .then((result) => {
      res.json(result.rows.map(({ table_name }) => table_name)); // Send the retrieved data as JSON
    })
    .catch((err) => {
      console.error('Error executing query', err);
      res.status(500).json({ error: 'Error executing query' });
    });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
