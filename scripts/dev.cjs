const { spawn } = require('child_process');
const path = require('path');

console.log('Starting frontend and backend servers...');

const runCommand = (command, args, options, prefix, colorCode) => {
  const child = spawn(command, args, {
    ...options
  });

  const print = (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`\x1b[${colorCode}m[${prefix}]\x1b[0m ${line}`);
      }
    });
  };

  if (child.stdout) {
    child.stdout.on('data', print);
  }
  if (child.stderr) {
    child.stderr.on('data', print);
  }

  return child;
};

// Spawn frontend (Vite)
const frontend = runCommand('npx', ['vite', '--port', '5173'], {
  cwd: path.resolve(__dirname, '..')
}, 'Frontend', '36'); // Cyan

// Spawn backend (Nodemon)
const backend = runCommand('npm', ['run', 'dev'], {
  cwd: path.resolve(__dirname, '../server')
}, 'Backend', '32'); // Green

let isShuttingDown = false;
const killChildren = () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('\nStopping servers...');
  try {
    if (frontend && !frontend.killed) frontend.kill('SIGTERM');
  } catch (err) {}
  try {
    if (backend && !backend.killed) backend.kill('SIGTERM');
  } catch (err) {}
  process.exit();
};

process.on('SIGINT', killChildren);
process.on('SIGTERM', killChildren);

frontend.on('close', (code) => {
  console.log(`Frontend exited with code ${code}`);
  killChildren();
});

backend.on('close', (code) => {
  console.log(`Backend exited with code ${code}`);
  killChildren();
});
