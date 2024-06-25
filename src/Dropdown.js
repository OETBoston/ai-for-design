import React from 'react';

function Dropdown({ name, options, value, onChange }) {
  return (
    <select
      className="border rounded p-2"
      value={value}
      onChange={(e) => onChange(name, e.target.value)}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export default Dropdown;
