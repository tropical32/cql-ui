import classNames from "classnames";

import { objects_equal } from "../utils.js";

import "./Table.css";

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
          {columns.map((key) => (
            <td key={key}>{key}</td>
          ))}
        <td />
        </tr>
      </thead>
      <tbody>
        {Object.entries(add_rows).map(([order, entry]) => {
          return (
            <tr key={"addable-" + order} className="addable">
              {columns.map((key) => {
                let value = entry[key];

                return <td key={"addable-" + key + name}>
                  <input 
                    onChange={event => update_addable_table_entry(order, key, event.target.value)} 
                    className="table-input" 
                    value={value} 
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
                "pending-del": is_pending_deletion,
                "changed": is_edited,
              })}
            >
              {columns.map((key) => {
                let value = entry[key];

                return <td key={order + key + name}>
                  <input 
                    onChange={event => update_table_entry(order, key, event.target.value)} 
                    className="table-input" value={value} 
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
