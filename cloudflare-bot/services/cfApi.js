const axios = require('axios');
const { execSync } = require('child_process');
const logger = require('./logger');

const cfApi = axios.create({
  baseURL: 'https://api.cloudflare.com/client/v4',
});

const verifyCredentials = async (apiToken, accountId) => {
  try {
    const response = await cfApi.get(`/accounts/${accountId}`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data.result;
  } catch (error) {
    logger.error('Error verifying Cloudflare credentials:', error.response.data);
    throw new Error('Failed to verify Cloudflare credentials.');
  }
};

const deployWorker = async (dir) => {
  try {
    execSync('npx wrangler deploy', { cwd: dir });
  } catch (error) {
    logger.error('Error deploying worker:', error);
    throw new Error('Failed to deploy worker.');
  }
};

const listWorkers = async (apiToken, accountId) => {
  try {
    const response = await cfApi.get(`/accounts/${accountId}/workers/scripts`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data.result;
  } catch (error) {
    logger.error('Error listing workers:', error.response.data);
    throw new Error('Failed to list workers.');
  }
};

const deleteWorker = async (apiToken, accountId, workerName) => {
  try {
    await cfApi.delete(`/accounts/${accountId}/workers/scripts/${workerName}`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    logger.error('Error deleting worker:', error.response.data);
    throw new Error('Failed to delete worker.');
  }
};

module.exports = {
  verifyCredentials,
  deployWorker,
  listWorkers,
  deleteWorker,
};
