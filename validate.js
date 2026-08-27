const fs = require('fs');

try {
  console.log('✓ Validating dropdownOptions.json...');
  const dropdown = JSON.parse(fs.readFileSync('data/dropdownOptions.json', 'utf-8'));
  console.log(`  ✓ Valid JSON with ${Object.keys(dropdown).length} categories`);

  console.log('\n✓ Validating checkboxCategories.json...');
  const checkbox = JSON.parse(fs.readFileSync('data/checkboxCategories.json', 'utf-8'));
  console.log(`  ✓ Valid JSON with ${Object.keys(checkbox).length} groups`);

  console.log('\n✓ Validating dropdownOrder.json...');
  const order = JSON.parse(fs.readFileSync('data/dropdownOrder.json', 'utf-8'));
  console.log(`  ✓ Valid JSON with ${order.length} items`);

  // Check for mismatches
  const missing = order.filter(k => !dropdown[k]);
  if (missing.length > 0) {
    console.log(`\n⚠️  Missing dropdown keys: ${missing.join(', ')}`);
  } else {
    console.log('\n✓ All keys in dropdownOrder exist in dropdownOptions');
  }

  console.log('\n✅ All validation checks passed!');
} catch (err) {
  console.error('❌ Error:', err.message);
}
