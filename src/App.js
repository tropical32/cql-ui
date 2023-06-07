import { useEffect, useState, useRef } from "react";
import axios from "axios";

import Table from "./components/Table.js";
import TableSelector from "./components/TableSelector.js";
import SaveButton from "./components/SaveButton.js";
import DiscardButton from "./components/DiscardButton.js";
import AddButton from "./components/AddButton.js";

import logo from "./logo.svg";
import "./App.css";

function get_default_type_value(type) {
  switch (type) {
    case "varint":
    case "tinyint":
    case "smallint":
    case "int":
    case "bigint":
    case "decimal":
      return 0;
    case "timestamp":
    case "date":
      return new Date().toISOString();
    case "float":
    case "double":
      return 0.0;
    case "text":
      return "";
  }
}

function App() {
  let row_counter = useRef(0);
  let [table_name, set_table_name] = useState("");
  let [tables, set_tables] = useState([]);
  let [table_data, set_table_data] = useState({});
  let [table_info, set_table_info] = useState({});
  let [error, set_error] = useState(null);
  let [add_rows, set_add_rows] = useState({});
  let [rows_to_delete, set_rows_to_delete] = useState([]);
  let [rows_to_update, set_rows_to_update] = useState([]);

  let axios_instance = axios.create({
    baseURL: "http://127.0.0.1:7777",
  });

  function increase_add_row_counter() {
    row_counter.current += 1;

    return row_counter.current;
  }

  function add_to_delete_row(row_id) {
    set_rows_to_delete([...rows_to_delete, row_id]);
  }

  function add_row() {
    set_add_rows(curr_add_rows => {
      const next_add_row_counter = increase_add_row_counter();
      const empty_columns = Object.fromEntries(
        table_info.columns.map(column => [column.name, get_default_type_value(column.type)])
      );

      return {...curr_add_rows, [next_add_row_counter]: empty_columns}
    });
  }

  function remove_addable_row(id) {
    let next_addable_rows = { ...add_rows };
    delete next_addable_rows[id];

    set_add_rows(next_addable_rows);
  }

  function remove_from_to_delete_row(retained_row_id) {
    set_rows_to_delete(curr_rows_to_delete => {
      return curr_rows_to_delete.filter(id => id != retained_row_id);
    });
  }

  function fetch_table_data(table_name) {
    axios_instance
      .get(`/api/data/${table_name}`)
      .then((response) => {
        let ordered_table_data = Object.fromEntries(
          response.data.map(row => [increase_add_row_counter(), row])
        );

        set_table_data(ordered_table_data);
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
          set_add_rows([]);

          let table_name = event.target.value;

          if (table_name != "") {
            set_table_name(table_name);
            fetch_table_data(table_name);
          }
        }}
      />
      <SaveButton />
      <DiscardButton 
        onDiscardChanges={() => {
          set_rows_to_delete([]);
          set_rows_to_update([]);
          set_add_rows([]);
        }} 
      />
      <AddButton is_active={table_name != ""} on_add_row={add_row} />
      <Table 
        name={table_name}
        data={table_data}
        add_to_delete_row={add_to_delete_row}
        remove_from_to_delete_row={remove_from_to_delete_row}
        rows_to_delete={rows_to_delete}
        add_rows={add_rows}
        remove_addable_row={remove_addable_row}
      />
    </div>
  );
}

export default App;
