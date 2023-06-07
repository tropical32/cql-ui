import { useEffect, useState } from "react";
import axios from "axios";

import Table from "./components/Table.js";
import TableSelector from "./components/TableSelector.js";
import logo from "./logo.svg";
import "./App.css";

function App() {
  let [tables, set_tables] = useState([]);
  let [table_data, set_table_data] = useState([]);
  let [error, set_error] = useState(null);
  let axios_instance = axios.create({
    baseURL: "http://127.0.0.1:7777",
  });

  function fetch_table_data(table_name) {
    axios_instance
      .get(`/api/data/${table_name}`)
      .then((response) => {
        set_table_data(response.data);
      })
      .catch((error) => {
        set_error(error);
      });
  }

  useEffect(() => {
    axios_instance
      .get("/api/tables")
      .then((response) => {
        set_tables(response.data);
      })
      .catch((error) => {
        set_error(error);
      });
  }, []);

  if (error != null) {
    return <div>{error.message}</div>;
  }

  return (
    <div className="main">
      <TableSelector
        tables={tables}
        onChange={(event) => fetch_table_data(event.target.value)}
      />
      <Table data={table_data} />
    </div>
  );
}

export default App;
