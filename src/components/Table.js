import { useEffect, useState } from "react";

import "./Table.css";

export default function Table({ 
  data = [], 
  name = "",
  add_to_delete_row,
  remove_from_to_delete_row,
  rows_to_delete = [],
  add_rows = [],
  remove_addable_row,
}) {
  if (name == "") {
    return null;
  }

  if (add_rows.length == 0 && data.length == 0) {
    return null;
  }

  let keys = [];

  if (Object.keys(add_rows).length > 0) {
    keys = Object.keys(Object.values(add_rows)[0]);
  } else {
    console.log(data);
    keys = Object.keys(Object.values(data)[0]);
  }

  return (
    <table key={name} className="table">
      <thead>
        <tr>
          {keys.map((key) => (
            <td key={key}>{key}</td>
          ))}
        <td />
        </tr>
      </thead>
      <tbody>
        {Object.entries(add_rows).map(([key, entry]) => {
          return (
            <tr key={"addable-" + key} className="addable">
              {keys.map((key) => {
                let value = entry[key];

                return <td key={"addable-" + key + name}>
                  <input className="table-input" value={value} />
                </td>;
              })}
              <td>
                <button 
                  onClick={() => {
                    remove_addable_row(key);
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

          return (
            <tr 
              key={order + name}
              className={is_pending_deletion ? "pending-del" : ""}
            >
              {keys.map((key) => {
                let value = entry[key];

                return <td key={order + key + name}>
                  <input className="table-input" value={value} />
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
