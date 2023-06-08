import { useEffect, useState, useRef } from "react";
import axios from "axios";

import { objects_equal } from "./utils.js";

import Table from "./components/Table.js";
import KeyspaceSelector from "./components/KeyspaceSelector.js";
import TableSelector from "./components/TableSelector.js";
import SaveButton from "./components/SaveButton.js";
import DiscardButton from "./components/DiscardButton.js";
import Filters from "./components/Filters.js";
import AddButton from "./components/AddButton.js";

import "./App.css";

function App() {
  let row_counter = useRef(0);
  let keyspace = useRef("");
  let [keyspaces, set_keyspaces] = useState([]);
  let [table_name, set_table_name] = useState("");
  let [tables, set_tables] = useState([]);
  let [table_data, set_table_data] = useState({});
  let [table_data_shadow, set_table_data_shadow] = useState({});
  let [table_columns, set_table_columns] = useState([]);
  let [error, set_error] = useState(null);
  let [add_rows, set_add_rows] = useState({});
  let [rows_to_delete, set_rows_to_delete] = useState([]);

  let axios_instance = axios.create({
    baseURL: "http://127.0.0.1:7777",
  });

  function copy_shadow_rows_to_rows() {
    set_table_data(structuredClone(table_data_shadow));
  }

  function update_table_entry(key, column, value) {
    set_table_data(curr_table_data => {
      let next_table_data = structuredClone(curr_table_data);
      next_table_data[key][column] = value;

      return next_table_data;
    });
  }

  function update_addable_table_entry(key, column, value) {
    set_add_rows(curr_add_rows => {
      let next_add_rows = structuredClone(curr_add_rows);
      next_add_rows[key][column] = value;

      return next_add_rows;
    });
  }

  function decrement_add_row_counter() {
    row_counter.current -= 1;

    return row_counter.current;
  }

  function add_to_delete_row(row_id) {
    set_rows_to_delete([...rows_to_delete, row_id]);
  }

  function add_row() {
    set_add_rows(curr_add_rows => {
      const next_add_row_counter = decrement_add_row_counter();
      const empty_columns = Object.fromEntries(
        table_columns.map(({ column_name }) => [column_name, ""])
      );

      return { ...curr_add_rows, [next_add_row_counter]: empty_columns }
    });
  }

  function on_save() {
    const edited_rows_ids = Object
      .entries(table_data)
      .filter(([id, data_row]) => {
        const shadow_row = table_data_shadow[id];
        return !objects_equal(data_row, shadow_row);
      })
      .map(([id, _]) => id);

    const edited_rows = edited_rows_ids.map(id => table_data[id]);
    const add_rows_array = Object.values(add_rows);
    const rows_to_delete_array = rows_to_delete.map(id => table_data[id]);

    const data = {
      edited_rows: edited_rows,
      added_rows: add_rows_array,
      deleted_rows: rows_to_delete_array
    };

    if (edited_rows.length > 0 || add_rows_array.length > 0 || rows_to_delete.length > 0) {
      axios_instance
        .post(`/api/data/${table_name}`, { ...data, keyspace: keyspace.current })
        .then(update_table_data_on_success)
        .catch(err => set_error(err));
    }
  }

  function update_table_data_on_success() {
    set_error(null);
    set_table_data({});
    set_table_data_shadow({});
    set_rows_to_delete([]);
    set_add_rows({});

    fetch_table_data(table_name);
  }

  function remove_addable_row(id) {
    let next_addable_rows = structuredClone(add_rows);
    delete next_addable_rows[id];

    set_add_rows(next_addable_rows);
  }

  function remove_from_to_delete_row(retained_row_id) {
    set_rows_to_delete(curr_rows_to_delete => {
      return curr_rows_to_delete.filter(id => id !== retained_row_id);
    });
  }

  function fetch_table_data(table_name, query_params) {
    axios_instance
      .get(`/api/data/${table_name}`, { params: { ...query_params, keyspace: keyspace.current } })
      .then((response) => {
        let rows_stringified = response.data.map(row => Object.fromEntries(
          Object.entries(row).map(([col, val]) => ([col, val == null ? null : val.toString()]))
        ));

        let ordered_table_data = Object.fromEntries(
          rows_stringified.map(row => [decrement_add_row_counter(), row])
        );

        set_table_data(ordered_table_data);
        set_table_data_shadow(structuredClone(ordered_table_data));
        set_error(null);
      })
      .catch((error) => {
        set_error(error);
      });
  }

  function fetch_table_columns(table_name) {
    axios_instance
      .get(`/api/columns/${table_name}`, { params: { keyspace: keyspace.current } })
      .then((response) => {
        set_table_columns(response.data);
        set_error(null);
      })
      .catch((error) => {
        set_error(error);
      });
  }

  function on_filter_submit(event) {
    event.preventDefault();

    const form_elements = event.target.elements;

    const filter_values = {};
    for (let i = 0; i < form_elements.length; i++) {
      const element = form_elements[i];
      if (element.tagName === "INPUT") {
        if (element.value !== "") {
          filter_values[element.name] = element.value;
        }
      }
    }

    fetch_table_data(table_name, { filters: filter_values });
  }

  function on_keyspace_changed(event) {
    let next_keyspace = event.target.value;
    keyspace.current = next_keyspace;

    set_table_data({});
    set_table_data_shadow({});
    set_rows_to_delete([]);
    set_table_name("");
    set_table_columns([]);
    set_add_rows([]);
    set_tables([]);

    if (next_keyspace !== "") {
      console.log("fetching");
      axios_instance
        .get("/api/tables", { params: { keyspace: keyspace.current } })
        .then((response) => {
          set_tables(response.data);
          set_error(null);
        })
        .catch((error) => {
          set_error(error);
        });
    }
  }

  useEffect(() => {
    axios_instance
      .get("/api/keyspaces")
      .then((response) => {
        set_keyspaces(response.data);
      })
      .catch((error) => {
        set_error(error);
      });

  }, []);

  return (
    <div className="main">
      {error && <div className="error">{error?.response?.data?.error}</div>}
      <KeyspaceSelector on_change={on_keyspace_changed} keyspaces={keyspaces} />
      <TableSelector
        tables={tables}
        on_change={(event) => {
          set_table_data({});
          set_table_data_shadow({});
          set_rows_to_delete([]);
          set_table_name("");
          set_table_columns([]);
          set_add_rows([]);

          let table_name = event.target.value;

          if (table_name !== "") {
            set_table_name(table_name);
            fetch_table_columns(table_name);
            fetch_table_data(table_name);
          }
        }}
      />
      <div className="buttons-group">
        <SaveButton on_save={on_save} />
        <DiscardButton
          onDiscardChanges={() => {
            set_rows_to_delete([]);
            set_add_rows([]);
            copy_shadow_rows_to_rows();
          }}
        />
        <AddButton is_active={table_name !== ""} on_add_row={add_row} />
      </div>
      <div className="buttons-group">
        <Filters table_columns={table_columns} on_submit={on_filter_submit} />
      </div>
      <Table
        columns={table_columns}
        update_addable_table_entry={update_addable_table_entry}
        name={table_name}
        data={table_data}
        data_shadow={table_data_shadow}
        add_to_delete_row={add_to_delete_row}
        remove_from_to_delete_row={remove_from_to_delete_row}
        rows_to_delete={rows_to_delete}
        add_rows={add_rows}
        remove_addable_row={remove_addable_row}
        update_table_entry={update_table_entry}
      />
    </div>
  );
}

export default App;
