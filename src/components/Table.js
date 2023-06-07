import classNames from "classnames";

import "./Table.css";

import { objects_equal } from "../utils.js";

export default function Table({ 
  data = {}, 
  data_shadow = {},
  name = "",
  add_to_delete_row,
  remove_from_to_delete_row,
  rows_to_delete = [],
  add_rows = [],
  remove_addable_row,
  update_table_entry,
  update_addable_table_entry,
  columns,
}) {
  if (name === "") {
    return null;
  }

  let add_rows_len = Object.keys(add_rows).length;
  let data_len = Object.keys(data).length;

  if (add_rows_len === 0 && data_len === 0) {
    return null;
  }

  return (
    <table key={name} className="table">
      <thead>
        <tr>
          {columns.map(({ column_name, kind }) => (
            <td 
              className={classNames({ 
                "partition-key": kind === "partition_key",
                "clustering-key": kind === "clustering",
              })} 
              key={column_name}
            >
              {column_name}
            </td>
          ))}
        <td />
        </tr>
      </thead>
      <tbody>
        {Object.entries(add_rows).map(([order, entry]) => {
          return (
            <tr key={"addable-" + order} className="addable">
              {columns.map(({ column_name, kind }) => {
                let value = entry[column_name];

                return <td key={"addable-" + column_name + name}>
                  <input 
                    onChange={event => update_addable_table_entry(order, column_name, event.target.value)} 
                    className="table-input" 
                    value={value ?? ""} 
                    placeholder="null"
                  />
                </td>;
              })}
              <td>
                <button 
                  onClick={() => {
                    remove_addable_row(order);
                  }}
                >
                  🗑️
                </button>
              </td>
            </tr>
          );
        })}
        {Object.entries(data).map(([order, entry]) => {
          let is_pending_deletion = rows_to_delete.includes(order);
          let is_edited = !objects_equal(entry, data_shadow[order]);

          return (
            <tr 
              key={order + name}
              className={classNames({
                "changed": is_edited,
                "pending-del": is_pending_deletion,
              })}
            >
              {columns.map(({ column_name, kind }) => {
                let value = entry[column_name];

                return <td key={order + column_name + name}>
                  <input 
                    onChange={event => update_table_entry(order, column_name, event.target.value)} 
                    className="table-input" 
                    value={value ?? ""}
                    placeholder="null"
                  />
                </td>;
              })}
              <td>
                <button 
                  onClick={() => {
                    if (is_pending_deletion) {
                      remove_from_to_delete_row(order);
                    } else {
                      add_to_delete_row(order);
                    }
                  }}
                >
                  🗑️
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
