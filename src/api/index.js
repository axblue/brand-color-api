import { Router } from "express";
const brandController = require("../controllers/brand.controller");

export default () => {
  let api = Router();
  api.get("/getColor", brandController.getColorByBrand);
  return api;
};
