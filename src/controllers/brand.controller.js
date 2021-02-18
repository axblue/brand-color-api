const logger = require("../utils/logger");
const brandModel = require("../models/brand.model");
const browser = require("../lib/browser");

module.exports.getColorByBrand = async (req, res) => {
  try {
    const url = req.query.url.match(/https?:\/\/[^/]+((?=\/)|$)/g)[0];
    const brand = await brandModel.getBrandByUrl(url);
    if (brand.rows.length !== 0) {
      return res.status(200).json({ color1: brand.rows[0].color1 });
    } else {
      return res.status(200).json(
        await browser.addToQueue(url).then(({ colors }) => {
          brandModel.insertBrand(url, colors[0]);
          return { color1: colors[0] };
        })
      );
    }
  } catch (error) {
    logger.error(`getColorByBrand error: ${error.message}`);
    res
      .status(500)
      .json({ status: "error", message: error.message, statusCode: 500 });
  }
};
