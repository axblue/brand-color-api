# Brand Color API

Brand Color is an API which retrieves the branding colors of a website.

The project utilizes [Puppeteer](https://github.com/GoogleChrome/puppeteer) and [Puppeteer cluster](https://github.com/thomasdondorf/puppeteer-cluster).

<img src="https://i.ibb.co/7V2w7Ss/brand-color.gif"/>

### Request

api/getColor?url=https://github.com

### Response

A response could like the result displayed below. The logo array contains our guess. The other properties are the best guesses for their respective strategy.

```json
{
  "colors": ["rgb(230, 81, 0)"],
  "grays": ["rgb(51, 51, 51)", "rgb(0, 0, 0)"]
}
```
