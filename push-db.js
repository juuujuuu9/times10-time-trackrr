import { spawn } from 'child_process';

const child = spawn('npm', ['run', 'db:push'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: process.cwd()
});

let output = '';
let hasPrompted = false;

child.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  console.log(text);
  
  if (text.includes('Yes, I want to execute all statements') && !hasPrompted) {
    hasPrompted = true;
    child.stdin.write('Yes, I want to execute all statements\n');
  }
});

child.stderr.on('data', (data) => {
  console.error(data.toString());
});

child.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
  process.exit(code);
});

// Handle the case where we need to send the response
setTimeout(() => {
  if (!hasPrompted && output.includes('Yes, I want to execute all statements')) {
    hasPrompted = true;
    child.stdin.write('Yes, I want to execute all statements\n');
  }
}, 5000);
