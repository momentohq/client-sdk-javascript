import {execSync} from 'child_process';
import * as fs from "node:fs";

function findZstdBinaryFiles() {
  const files = fs.readdirSync('dist');
  return files.filter(f => f.endsWith('.node'));
}

function removeExtraZstdBinariesIfNecessary() {
  const initialZstdBinaryFiles = findZstdBinaryFiles();
  const targetPlatform = 'linux-x64-gnu';
  console.info(`Checking for superfluous zstd binaries: ${JSON.stringify(initialZstdBinaryFiles)}`);
  if (initialZstdBinaryFiles.length > 1) {
    for (const fileName of initialZstdBinaryFiles) {
      if (!fileName.includes(targetPlatform)) {
        console.info(`Removing superfluous zstd binary from the dist: ${fileName}`);
        fs.unlinkSync(`dist/${fileName}`);
      }
    }
  }
  const finalZstdBinaryFiles = findZstdBinaryFiles();
  if (finalZstdBinaryFiles.length !== 1) {
    throw new Error(`Something went wrong; expected exactly one zstd binary file in dist dir, but found: ${JSON.stringify(finalZstdBinaryFiles)}`);
  }
}

const functionsDir = 'src';
const commands = [
    'ls -lah',
    `pushd dist/`,
    `echo "zipping ${functionsDir} lambda"`,
    `zip -R function.zip *`,
    `mv function.zip ../`,
    'popd',
];

removeExtraZstdBinariesIfNecessary();

execSync(commands.join(' && '), {
    stdio: 'inherit',
});
