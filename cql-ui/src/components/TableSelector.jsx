import React from 'react';
import PropTypes from 'prop-types';

export default function TableSelector({ tables, onChange }) {
  return (
    <div>
      <label htmlFor="tables">
        Table:
        <select id="tables" name="tables" onChange={(event) => onChange(event.target.value)}>
          <option aria-label="<empty>" />
          {tables.map((table) => <option key={table} value={table}>{table}</option>)}
        </select>
      </label>
    </div>
  );
}

TableSelector.propTypes = {
  tables: PropTypes.arrayOf.isRequired,
  onChange: PropTypes.func.isRequired,
};
