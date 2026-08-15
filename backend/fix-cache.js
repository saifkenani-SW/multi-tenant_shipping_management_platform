const fs = require('fs');
const glob = require('glob'); // npm install glob might be needed if not using glob module? Wait, Node's fs doesn't have glob. I'll just write a recursive readdir.

function findFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(file));
    } else if (file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = findFiles('src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Regex to match @CacheEvict([...]) or @CacheEvict({...})
  // We'll replace it with @CacheEvict({ keyPrefix: CONSTANT.PREFIX, allEntries: true })
  // But wait, the CONSTANT varies (e.g. TENANT_ZONE_CACHE_KEYS, PRICING_CACHE_KEYS).
  // A safer way is to just find all `@CacheEvict` blocks, read the prefix, and rewrite it.
});
