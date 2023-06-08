import React from 'react';
import PropTypes from 'prop-types';

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
    <div>
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
        <button type="submit">Filter</button>
      </form>
    </div>
  );
}

Filters.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  tableColumns: PropTypes.arrayOf().isRequired,
};
