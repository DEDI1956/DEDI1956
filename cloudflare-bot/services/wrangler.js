const generateConfig = (name, main, accountId) => {
  return `
name = "${name}"
main = "${main}"
compatibility_date = "2023-01-01"
account_id = "${accountId}"
  `;
};

module.exports = {
  generateConfig,
};
