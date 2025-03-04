import {execSync} from 'child_process';
import * as fs from "node:fs";

const functionsDir = 'src';
const commands = [
    'ls -lah',
    `cd dist/`,
    `echo "zipping ${functionsDir} lambda"`,
    `zip -R function.zip *`,
    `mv function.zip ../`,
    'cd ..',
];

execSync(commands.join(' && '), {
    stdio: 'inherit',
});
