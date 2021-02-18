const logger = require("../utils/logger");
const dbUtil = require("../utils/dbUtil");
const transactionSuccess = "transaction success";

module.exports.getBrandByUrl = async (url) => {
  let sql = "SELECT domain, color1 FROM brand WHERE domain = $1 LIMIT 1";
  let data = [url];
  try {
    const result = await dbUtil.sqlToDB(sql, data);
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports.sampleTransaction = async () => {
  let singleSql = `CREATE TABLE brand (id SERIAL PRIMARY KEY, domain VARCHAR, color1 VARCHAR, color2 VARCHAR, gray VARCHAR);`;
  let multiSql = "INSERT INTO TEST (testcolumn) VALUES ($1)";
  let singleData = [];
  let multiData = [["node.js"], ["is"], ["fun"]];
  let client = await dbUtil.getTransaction();
  try {
    await dbUtil.sqlExecSingleRow(client, singleSql);
    // await dbUtil.sqlExecMultipleRows(client, multiSql, multiData);
    await dbUtil.commit(client);
    return transactionSuccess;
  } catch (error) {
    logger.error(`sampleTransactionModel error: ${error.message}`);
    await dbUtil.rollback(client);
    throw new Error(error.message);
  }
};

module.exports.insertBrand = async (url, color1) => {
  let query = `INSERT INTO brand (domain, color1) VALUES ($1, $2)`;
  let multiData = [[url, color1]];
  let client = await dbUtil.getTransaction();
  try {
    await dbUtil.sqlExecMultipleRows(client, query, multiData);
    await dbUtil.commit(client);
    return transactionSuccess;
  } catch (error) {
    logger.error(`sampleTransactionModel error: ${error.message}`);
    await dbUtil.rollback(client);
    throw new Error(error.message);
  }
};

module.exports.truncate = async (url, color1) => {
  let singleSql = `TRUNCATE brand RESTART IDENTITY`;
  let client = await dbUtil.getTransaction();
  try {
    await dbUtil.sqlExecSingleRow(client, singleSql);
    // await dbUtil.sqlExecMultipleRows(client, multiSql, multiData);
    await dbUtil.commit(client);
    return transactionSuccess;
  } catch (error) {
    logger.error(`sampleTransactionModel error: ${error.message}`);
    await dbUtil.rollback(client);
    throw new Error(error.message);
  }
};
