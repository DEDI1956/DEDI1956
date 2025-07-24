const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const findMainFile = (dir) => {
  const files = fs.readdirSync(dir);
  const mainFiles = ['index.js', 'main.js', 'worker.js'];
  for (const file of files) {
    if (mainFiles.includes(file) || file.endsWith('.ts')) {
      return file;
    }
  }
  return null;
};

const buildTypeScript = (dir) => {
  try {
    execSync('npm install && npm run build', { cwd: dir });
  } catch (error) {
    console.error('Error building TypeScript project:', error);
    throw new Error('Failed to build TypeScript project.');
  }
};

module.exports = {
  findMainFile,
  buildTypeScript,
};
