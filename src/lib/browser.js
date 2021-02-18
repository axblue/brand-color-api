const { Cluster } = require("puppeteer-cluster");
import extractColor from "./extractors/extractColor";
const cl = {
  cluster: null,
  async init() {
    const cluster = await Cluster.launch({
      headless: false,
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: 7,
      monitor: true,
      puppeteerOptions: {
        args: ["--no-sandbox", "--disable-gpu"],
      },
      workerCreationDelay: 100,
    });
    this.cluster = cluster;
  },
  getCluster: function () {
    if (!this.cluster) {
      throw new Error(`getCluster: init didn't run`);
    }
    return this.cluster;
  },
  addToQueue: function (url) {
    return this.cluster.execute(url, extractColor);
  },
};
module.exports = cl;
