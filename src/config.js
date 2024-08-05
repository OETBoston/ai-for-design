const dev = {
    apiUrl: 'http://localhost:8080/api',
    imgUrl: 'http://localhost:3000'
  };
  
  const prod = {
    apiUrl: '', // Leave this empty to use relative URLs
    imgUrl: ''
  };
  
  const config = process.env.NODE_ENV === 'production' ? prod : dev;
  
  console.log('Current environment:', process.env.NODE_ENV);

  export default config;