const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const compiled = path.join(
  root,
  'dist/src/infrastructure/database/seeders/seed.js',
);
const source = path.join(
  root,
  'src/infrastructure/database/seeders/seed.ts',
);

const args = fs.existsSync(compiled)
  ? ['-r', 'reflect-metadata', compiled]
  : ['-r', 'ts-node/register', '-r', 'reflect-metadata', source];

const result = spawnSync(process.execPath, args, {
  cwd: root,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
