import { version } from "../../package.json";
import { Router } from "express";
import facets from "./facets";
import Extractor from "../lib/Extractor";

export default ({ config, db }) => {
  let api = Router();
  const extractor = new Extractor();
  extractor.init();
  // mount the facets resource
  api.use("/facets", facets({ config, db }));

  // perhaps expose some API metadata at the root
  api.get("/getColor", async (req, res) => {
    console.log(req.query.url);
    return res.json(await extractor.extract(req.query.url));
  });

  return api;
};
