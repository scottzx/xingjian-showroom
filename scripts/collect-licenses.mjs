import { existsSync, readdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const packages = new Map();
function collect(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const path = join(directory, entry.name);
    if (entry.name.startsWith('@')) { collect(path); continue; }
    const metadata = join(path, 'package.json');
    if (!existsSync(metadata)) continue;
    const pkg = JSON.parse(readFileSync(metadata, 'utf8'));
    const id = `${pkg.name}@${pkg.version}`;
    const files = readdirSync(path, { withFileTypes: true }).filter(file => file.isFile() && /^(licen[sc]e|notice|copying)([._-].*)?$/i.test(file.name));
    const license = typeof pkg.license === 'string' ? pkg.license : JSON.stringify(pkg.license ?? 'See package documentation');
    const repository = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url ?? pkg.homepage ?? '';
    const notices = files.map(file => `--- ${file.name} ---\n${readFileSync(join(path, file.name), 'utf8').trim()}`).join('\n\n');
    packages.set(id, `${id}\nLicense: ${license}\nSource: ${repository}\n\n${notices || 'No separate license file was shipped in this package; consult the package metadata and upstream source.'}`);
    collect(join(path, 'node_modules'));
  }
}
collect('node_modules');
if (!packages.size) throw new Error('Install dependencies before collecting notices.');
const text = 'THIRD-PARTY DEPENDENCY LICENSES\nGenerated from the installed lockfile dependencies, including build tools.\n\n' + [...packages].sort(([a], [b]) => a.localeCompare(b)).map(([, notice]) => notice).join('\n\n' + '='.repeat(78) + '\n\n') + '\n';
writeFileSync('THIRD_PARTY_LICENSES.txt', text);
if (existsSync('dist')) copyFileSync('THIRD_PARTY_LICENSES.txt', 'dist/THIRD_PARTY_LICENSES.txt');
console.log(`Collected license metadata and shipped notices for ${packages.size} dependency packages.`);
