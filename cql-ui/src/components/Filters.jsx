import React from 'react';
import PropTypes from 'prop-types';

import './Filters.css';

function extractFiltersData(event) {
  const formElements = event.target.elements;

  const filterValues = {};
  for (let i = 0; i < formElements.length; i += 1) {
    const element = formElements[i];
    if (element.tagName === 'INPUT') {
      if (element.value !== '') {
        filterValues[element.name] = element.value;
      }
    }
  }

  return filterValues;
}

export default function Filters({ tableColumns, onSubmit }) {
  return (
    <div className="filters">
      <form onSubmit={(event) => {
        event.preventDefault();
        const filterValues = extractFiltersData(event);

        onSubmit(filterValues);
      }}
      >
        {tableColumns.map((col) => (
          <div key={col.column_name}>
            <label htmlFor={col.column_name}>
              {col.column_name}
              {': '}
              <input type="text" id={col.column_name} name={col.column_name} />
            </label>
          </div>
        ))}
        <div className="filter-buttons-group">
          <button type="submit">Filter</button>
          {/* eslint-disable-next-line react/button-has-type */}
          <button type="reset">Reset</button>
        </div>
      </form>
    </div>
  );
}

Filters.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  tableColumns: PropTypes.arrayOf(PropTypes.shape).isRequired,
};
