import { Router } from "express";
const { Cluster } = require("puppeteer-cluster");

export default ({ config, db }) => {
  let api = Router();
  (async () => {
    const cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: 7,
      headless: false,
      puppeteerOptions: {
        headless: true,
        args: ["--no-sandbox"],
      },
      monitor: true,
      workerCreationDelay: 100,
    });
    await cluster.task(async ({ page, data: url }) => {
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        if (request.resourceType() === "image") request.abort();
        else request.continue();
      });
      await page.goto(url);

      const data = await page.evaluate(() => {
        let cutoff = 0.1;
        let grayDev = 4;
        let colorCount = {
          colors: {},
          grays: {},
        };
        let typeWeight = {
          "links-color": 1,
          "links-backgroundColor": 1,
          "buttons-color": 1,
          "buttons-backgroundColor": 30,
          "headers-color": 10,
          "header-color": 20,
        };
        let typeSelectors = {
          links: [
            {
              selector: ".active > a, .active > * > a",
              weight: 50,
              styles: ["color", "backgroundColor"],
            },
            {
              selector: "header a",
              weight: 10,
              styles: ["color", "backgroundColor"],
            },
          ],
          buttons: [
            {
              selector: [
                "header button",
                'header [class*="button"]',
                'header [class*="btn"]',
                'header input [type="button"]',
                'header input [type="submit"]',
              ].join(","),
              weight: 20,
              styles: ["color", "backgroundColor"],
            },
            {
              selector: [
                "button",
                '[class*="button"]',
                '[class*="btn"]',
                'input [type="button"]',
                'input [type="submit"]',
              ].join(","),
              weight: 10,
              styles: ["color", "backgroundColor"],
            },
          ],
          header: [
            {
              selector: 'header [role="banner"]',
              weight: 1,
              styles: ["backgroundColor"],
            },
          ],
          headers: [
            { selector: "h1", weight: 40, styles: ["color"] },
            { selector: "h1 *", weight: 10, styles: ["color"] },
            { selector: "h2", weight: 20, styles: ["color"] },
            { selector: "h2 *", weight: 5, styles: ["color"] },
            { selector: "h3", weight: 10, styles: ["color"] },
          ],
        };
        const colorCounted = (type, color, value) => {
          color = removeAlpha(color);
          let colorType = isGray(color) ? "grays" : "colors";
          let counter = colorCount[colorType][type] || {};
          counter[color] ? (counter[color] += value) : (counter[color] = value);
          colorCount[colorType][type] = counter;
        };

        const removeAlpha = (color) => {
          let testColor = color.substring(
            color.indexOf("(") + 1,
            color.indexOf(")")
          );
          let rgb = testColor.split(",", 3);
          return "rgb(" + rgb.join(",") + ")";
        };

        const isGray = (color) => {
          let testColor = color.substring(
            color.indexOf("(") + 1,
            color.indexOf(")")
          );
          let rgb = testColor.split(",", 3);
          let avg = (+rgb[0] + +rgb[1] + +rgb[2]) / 3;
          for (let c of rgb) {
            if (Math.abs(avg - c) > grayDev) {
              return false;
            }
          }
          return true;
        };
        const parse = () => {
          for (let type in typeSelectors) {
            for (let selector of typeSelectors[type]) {
              let items = document.querySelectorAll(selector.selector);
              for (let item of items) {
                let computed = window.getComputedStyle(item);
                for (let style of selector.styles) {
                  colorCounted(
                    type + "-" + style,
                    computed[style],
                    selector.weight
                  );
                }
              }
            }
          }
          let styleTypes = 0;
          //filter and normalize
          for (let colorType in colorCount) {
            //sort
            let sortable = [];

            for (let styleType in colorCount[colorType]) {
              styleTypes++;
              let weight = typeWeight[styleType];

              let total = 0;
              let newColors = {};
              for (let color in colorCount[colorType][styleType]) {
                if (newColors.hasOwnProperty(color)) {
                  newColors[color] +=
                    colorCount[colorType][styleType][color] * weight;
                } else {
                  newColors[color] =
                    colorCount[colorType][styleType][color] * weight;
                }
                total += colorCount[colorType][styleType][color] * weight;
              }

              for (let color in newColors) {
                let newColor = newColors[color] / total;
                colorCount[colorType][color] = colorCount[
                  colorType
                ].hasOwnProperty(color)
                  ? colorCount[colorType][color] + newColor
                  : newColor;
              }

              delete colorCount[colorType][styleType];
            }

            for (let color in colorCount[colorType]) {
              sortable.push([color, colorCount[colorType][color] / styleTypes]);
            }

            sortable = sortable.sort(function (a, b) {
              return b[1] - a[1];
            });

            let top = sortable.slice(0, 3);

            colorCount[colorType] = [];
            for (let result of top) {
              if (result[1] > cutoff) {
                colorCount[colorType].push(result[0]);
              }
            }
          }

          return colorCount;
        };

        return parse();
      });

      return data;
    });

    api.get("/getColor", async (req, res) => {
      return res.json(await cluster.execute(req.query.url));
    });
  })();
  return api;
};
