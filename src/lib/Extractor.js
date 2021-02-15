const debug = require("debug")("extractor");
debug.log = console.log.bind(console);

const path = require("path");
import Navigator from "./Navigator";

import StyleColorsStrategy from "./extractors/style-colors/StyleColorsStrategy";

import Pipeline from "./pipeline/Pipeline";
import ArrayMerger from "./pipeline/ArrayMerger";

class Extractor {
  constructor(storagePath, host) {
    this.extractors = {};
    this.pipelines = [];
    this.navigator = new Navigator();

    this.registerExtractor(new StyleColorsStrategy());

    this.registerPipeline(
      new Pipeline("site-style", [
        new ArrayMerger([StyleColorsStrategy.getId()]),
      ])
    );

    // this.registerPipeline(
    //   new Pipeline("logo-color", [
    //     new ArrayMerger([
    //       DomLogoStrategy.getId(),
    //       MetaLogoStrategy.getId(),
    //       FacebookLogoStrategy.getId(),
    //       TwitterLogoStrategy.getId(),
    //     ]),
    //     new ArrayWeighSort(),
    //     new ArrayUnique(),
    //     new LogoColorAggregator(4),
    //   ])
    // );
  }

  registerExtractor(extractor) {
    this.extractors[extractor.constructor.getId()] = extractor;
  }

  registerPipeline(pipeline) {
    this.pipelines.push(pipeline);
  }

  async init(settings) {
    // if (settings.useBlockList) {
    //   this.navigator.initBlockList();
    // }
  }

  async getInfo() {
    let navInfo = await this.navigator.getInfo();
    return {
      puppeteer: navInfo,
    };
  }

  async extract(uri) {
    debug("extracting:", uri);

    console.time("pageLoad");
    const result = await this.navigator.newPage(uri);
    const page = result.page;
    const cdp = result.cdp;
    console.timeEnd("pageLoad");

    console.time("extractors");
    let extractions = await this.runExtractors(page, cdp);
    console.timeEnd("extractors");

    if (!page.isClosed()) {
      await page.close();
    }

    console.time("pipelines");
    let results = {};
    for (let pipeline of this.pipelines) {
      let pipelineResult = await pipeline.process(extractions);
      results = { ...results, ...pipelineResult };
    }
    console.timeEnd("pipelines");
    console.log(results);
    return results;
  }

  async runExtractors(page, cdp) {
    let results = {};
    let addedScripts = [];
    for (let groupName in this.extractors) {
      if (this.extractors.hasOwnProperty(groupName) === false) {
        continue;
      }

      let extractor = this.extractors[groupName];

      for (let filePath of extractor.getParserFilesToInject()) {
        filePath = path.resolve(filePath);
        console.log(filePath);
        if (addedScripts.indexOf(filePath) === -1) {
          await page.addScriptTag({ path: filePath });

          addedScripts.push(filePath);
        }
      }

      results[groupName] = await extractor.handlePage(page, cdp);
    }

    return results;
  }
}

export default Extractor;
