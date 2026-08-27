const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/dropdownOptions.json', 'utf-8'));
const order = JSON.parse(fs.readFileSync('data/dropdownOrder.json', 'utf-8'));
const missing = order.filter(k => !data[k]);
console.log('Missing keys:', missing);
console.log('Total in order:', order.length);
console.log('Total in options:', Object.keys(data).length);
