const simpleGit = require('simple-git');

const git = simpleGit();

const clone = async (repoUrl, localPath) => {
  try {
    await git.clone(repoUrl, localPath);
  } catch (error) {
    console.error('Error cloning repository:', error);
    throw new Error('Failed to clone repository.');
  }
};

module.exports = {
  clone,
};
