import { useEffect, useState } from "react";

import "./Table.css";

export default function Table({ data, columns, primary_key, name }) {
  console.log(data, columns, primary_key, name);

  let [to_delete, set_to_delete] = useState([]);
  let [to_update, set_to_update] = useState([]);

  function add_to_delete_row(row) {
    to_delete = [...to_delete, row];
  }

  if (data.length == 0 || columns.length == 0 || primary_key.length == 0) {
    return null;
  }

  let keys = Object.keys(data[0]);

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
        {data.map((entry) => {
          return (
            <tr key={primary_key.map(pk => entry[pk]).join(",")}>
              {keys.map((key) => {
                let value = entry[key];

                return <td key={primary_key.map(pk => entry[pk]).join(",") + key}>
                  <input className="table-input" value={value} />
                </td>;
              })}
            <td>
              <button onClick={add_to_delete_row}>🗑️</button>
            </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
