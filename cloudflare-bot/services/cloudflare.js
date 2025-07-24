const axios = require('axios');
const logger = require('./logger');

const cfApi = (apiToken) => axios.create({
  baseURL: 'https://api.cloudflare.com/client/v4',
  headers: {
    'Authorization': `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  },
});

const verifyCredentials = async (apiToken, accountId, zoneId) => {
  try {
    const api = cfApi(apiToken);
    const accountDetails = await api.get(`/accounts/${accountId}`);
    const zoneDetails = await api.get(`/zones/${zoneId}`);
    return {
      accountName: accountDetails.data.result.name,
      plan: zoneDetails.data.result.plan.name,
      domain: zoneDetails.data.result.name,
    };
  } catch (error) {
    logger.error('Error verifying Cloudflare credentials:', error.response ? error.response.data : error.message);
    throw new Error('Failed to verify Cloudflare credentials.');
  }
};

const listWorkers = async (apiToken, accountId) => {
  try {
    const api = cfApi(apiToken);
    const response = await api.get(`/accounts/${accountId}/workers/scripts`);
    return response.data.result;
  } catch (error) {
    logger.error('Error listing workers:', error.response ? error.response.data : error.message);
    throw new Error('Failed to list workers.');
  }
};

const deleteWorker = async (apiToken, accountId, workerName) => {
  try {
    const api = cfApi(apiToken);
    await api.delete(`/accounts/${accountId}/workers/scripts/${workerName}`);
  } catch (error) {
    logger.error('Error deleting worker:', error.response ? error.response.data : error.message);
    throw new Error('Failed to delete worker.');
  }
};

const deployWorker = async (apiToken, accountId, workerName, script) => {
    try {
        const api = cfApi(apiToken);
        await api.put(`/accounts/${accountId}/workers/scripts/${workerName}`, script, {
            headers: { 'Content-Type': 'application/javascript' }
        });
    } catch (error) {
        logger.error('Error deploying worker:', error.response ? error.response.data : error.message);
        throw new Error('Failed to deploy worker.');
    }
};


module.exports = {
  verifyCredentials,
  listWorkers,
  deleteWorker,
  deployWorker,
};
