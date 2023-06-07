import { useEffect, useState } from "react";

import "./Table.css";

export default function Table({ 
  data = [], 
  columns = [], 
  primary_key = [], 
  name = "",
  add_to_delete_row,
  remove_from_to_delete_row,
  rows_to_delete = [],
  add_rows = [],
  remove_addable_row,
}) {
  if (add_rows.length == 0) {
    if (
      data.length == 0 
      || columns.length == 0 
      || primary_key.length == 0 
      || name == ''
    ) {
      return null;
    }
  }

  let keys = columns.map(col => col.name);

  return (
    <table key={name} className="table">
      <thead>
        <tr>
          {keys.map((key) => (
            <td className={primary_key.includes(key) ? "primary-key" : "" } key={key}>{key}</td>
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
        {data.map((entry) => {
          let is_pending_deletion = rows_to_delete.some(
            id_object => primary_key.every(
              pk => entry[pk] == id_object[pk]
            )
          );

          return (
            <tr 
              key={primary_key.map(pk => entry[pk]).join(",") + name}
              className={is_pending_deletion ? "pending-del" : ""}
            >
              {keys.map((key) => {
                let value = entry[key];

                return <td 
                  key={primary_key.map(pk => entry[pk]).join(",") + key + name}
                >
                  <input className="table-input" value={value} />
                </td>;
              })}
              <td>
                <button 
                  onClick={() => {
                    const deleteRow = Object.fromEntries(primary_key.map(pk => [pk, entry[pk]]));

                    if (is_pending_deletion) {
                      remove_from_to_delete_row(deleteRow);
                    } else {
                      add_to_delete_row(deleteRow);
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
