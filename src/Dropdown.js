// Dropdown.js
// import React from 'react';
// import Autocomplete from '@mui/material/Autocomplete';
// import TextField from '@mui/material/TextField';

// const Dropdown = ({ name, options, value, onChange }) => {
//   const handleChange = (event, newValue) => {
//     onChange(name, newValue);
//   };

//   return (
//     <Autocomplete
//       options={options}
//       value={value}
//       onChange={handleChange}
//       renderInput={(params) => <TextField {...params} label={name} variant="outlined" />}
//     />
//   );
// };

// export default Dropdown;


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

// // Dropdown.js
// import React from 'react';
// import Select from 'react-select';

// const Dropdown = ({ name, options, value, onChange }) => {
//   const handleChange = (selectedOption) => {
//     onChange(name, selectedOption ? selectedOption.value : '');
//   };

//   return (
//     <Select
//       name={name}
//       options={options.map(option => ({ value: option, label: option }))}
//       value={{ value, label: value }}
//       onChange={handleChange}
//       isClearable
//     />
//   );
// };

// export default Dropdown;
