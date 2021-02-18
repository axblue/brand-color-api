const { Pool, Client } = require("pg");
const config = require("../config/config.js");
const logger = require("./logger");
import "babel-polyfill";
const pgconfig = {
  user: config.db.user,
  database: config.db.database,
  password: config.db.password,
  host: config.db.host,
  port: config.db.port,
  max: config.db.max,
  idleTimeoutMillis: config.db.idleTimeoutMillis,
  ssl: true,
};
const connectionString = config.db.url;

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});
pool
  .connect()
  .then((client) => {
    console.log("connected");
    client.release();
  })
  .catch((err) => console.error("error connecting", err.stack));

/*
 * Single Query to Postgres
 * @param sql: the query for store data
 * @param data: the data to be stored
 * @return result
 */
module.exports.sqlToDB = async (sql, data) => {
  logger.debug(`sqlToDB() sql: ${sql} | data: ${data}`);
  try {
    let result = await pool.query(sql, data);
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
};

/*
 * Retrieve a SQL client with transaction from connection pool. If the client is valid, either
 * COMMMIT or ROALLBACK needs to be called at the end before releasing the connection back to pool.
 */
module.exports.getTransaction = async () => {
  logger.debug(`getTransaction()`);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    return client;
  } catch (error) {
    throw new Error(error.message);
  }
};

/*
 * Execute a sql statment with a single row of data
 * @param sql: the query for store data
 * @param data: the data to be stored
 * @return result
 */
module.exports.sqlExecSingleRow = async (client, sql, data) => {
  logger.debug(`sqlExecSingleRow() sql: ${sql} | data: ${data}`);
  try {
    let result = await client.query(sql, data);
    logger.debug(`sqlExecSingleRow(): ${result.command} | ${result.rowCount}`);
    return result;
  } catch (error) {
    logger.error(
      `sqlExecSingleRow() error: ${error.message} | sql: ${sql} | data: ${data}`
    );
    throw new Error(error.message);
  }
};

/*
 * Execute a sql statement with multiple rows of parameter data.
 * @param sql: the query for store data
 * @param data: the data to be stored
 * @return result
 */
module.exports.sqlExecMultipleRows = async (client, sql, data) => {
  logger.debug(`inside sqlExecMultipleRows()`);
  if (data.length !== 0) {
    for (let item of data) {
      try {
        logger.debug(`sqlExecMultipleRows() item: ${item}`);
        logger.debug(`sqlExecMultipleRows() sql: ${sql}`);
        await client.query(sql, item);
      } catch (error) {
        logger.error(`sqlExecMultipleRows() error: ${error}`);
        throw new Error(error.message);
      }
    }
  } else {
    logger.error(`sqlExecMultipleRows(): No data available`);
    throw new Error("sqlExecMultipleRows(): No data available");
  }
};

/*
 * Rollback transaction
 */
module.exports.rollback = async (client) => {
  if (typeof client !== "undefined" && client) {
    try {
      logger.info(`sql transaction rollback`);
      await client.query("ROLLBACK");
    } catch (error) {
      throw new Error(error.message);
    } finally {
      client.release();
    }
  } else {
    logger.warn(`rollback() not excuted. client is not set`);
  }
};

/*
 * Commit transaction
 */
module.exports.commit = async (client) => {
  try {
    await client.query("COMMIT");
  } catch (error) {
    throw new Error(error.message);
  } finally {
    client.release();
  }
};
