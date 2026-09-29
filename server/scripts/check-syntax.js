const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function checkDirectory(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) checkDirectory(file);
    else if (entry.name.endsWith('.js')) {
      const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
      if (result.status !== 0) process.exit(result.status || 1);
    }
  }
}

checkDirectory(path.join(__dirname, '..', 'src'));
console.log('Backend JavaScript syntax check passed.');
