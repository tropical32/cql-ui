import { useEffect, useState } from "react";
import axios from "axios";

import Table from "./components/Table.js";
import TableSelector from "./components/TableSelector.js";
import SaveButton from "./components/SaveButton.js";

import logo from "./logo.svg";
import "./App.css";

function App() {
  let [table_name, set_table_name] = useState("");
  let [tables, set_tables] = useState([]);
  let [table_data, set_table_data] = useState([]);
  let [table_info, set_table_info] = useState({});
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

  function fetch_table_info(table_name) {
    axios_instance
      .get(`/api/info/${table_name}`)
      .then((response) => {
        console.log(response);
        set_table_info(response.data);
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
        onChange={(event) => {
          set_table_name(event.target.value);
          fetch_table_info(event.target.value);
          fetch_table_data(event.target.value);
        }}
      />
      <SaveButton />
      <Table 
        name={table_name}
        columns={table_info.columns}
        primary_key={table_info.primary_key}
        data={table_data}
      />
    </div>
  );
}

export default App;
