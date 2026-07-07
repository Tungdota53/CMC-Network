const http = require('http');

http.get('http://127.0.0.1:3001/users/e1df8fdb-9a87-4674-8dcb-cbcd1c2158ed', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('3001 Status:', res.statusCode, data));
}).on('error', err => console.error('3001 Error:', err.message));

http.get('http://127.0.0.1:3003/users/e1df8fdb-9a87-4674-8dcb-cbcd1c2158ed', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('3003 Status:', res.statusCode, data));
}).on('error', err => console.error('3003 Error:', err.message));
