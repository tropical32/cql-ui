import { useEffect, useState } from "react";
import axios from "axios";

import Table from "./components/Table.js";
import TableSelector from "./components/TableSelector.js";
import SaveButton from "./components/SaveButton.js";
import DiscardButton from "./components/DiscardButton.js";

import logo from "./logo.svg";
import "./App.css";

function App() {
  let [table_name, set_table_name] = useState("");
  let [tables, set_tables] = useState([]);
  let [table_data, set_table_data] = useState([]);
  let [table_info, set_table_info] = useState({});
  let [error, set_error] = useState(null);
  let [rows_to_delete, set_rows_to_delete] = useState([]);
  let [rows_to_update, set_rows_to_update] = useState([]);

  let axios_instance = axios.create({
    baseURL: "http://127.0.0.1:7777",
  });

  function add_to_delete_row(row) {
    set_rows_to_delete([...rows_to_delete, row]);
  }

  function remove_from_to_delete_row(retained_row) {
    let next_rows_to_delete = rows_to_delete.filter(pending_row => {
      return !Object.entries(pending_row).every(([col, val]) => {
        return retained_row[col] == val;
      });
    });

    set_rows_to_delete(next_rows_to_delete);
  }

  function fetch_table_data(table_name) {
    axios_instance
      .get(`/api/data/${table_name}`)
      .then((response) => {
        set_table_data(response.data);
        set_error(null);
      })
      .catch((error) => {
        set_error(error);
      });
  }

  function fetch_table_info(table_name) {
    axios_instance
      .get(`/api/info/${table_name}`)
      .then((response) => {
        set_table_info(response.data);
        set_error(null);
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
        set_error(null);
      })
      .catch((error) => {
        set_error(error);
      });
  }, []);

  return (
    <div className="main">
      {error && <div className="error">{error.message}</div>}
      <TableSelector
        tables={tables}
        onChange={(event) => {
          set_table_data([]);
          set_rows_to_delete([]);
          set_rows_to_update([]);
          set_table_name("");
          set_table_info({});

          set_table_name(event.target.value);
          fetch_table_info(event.target.value);
          fetch_table_data(event.target.value);
        }}
      />
      <SaveButton />
      <DiscardButton 
        onDiscardChanges={() => {
          set_rows_to_delete([]);
          set_rows_to_update([]);
        }} 
      />
      <Table 
        name={table_name}
        columns={table_info.columns}
        primary_key={table_info.primary_key}
        data={table_data}
        add_to_delete_row={add_to_delete_row}
        remove_from_to_delete_row={remove_from_to_delete_row}
        rows_to_delete={rows_to_delete}
      />
    </div>
  );
}

export default App;
