const AbstractStrategy = require('../AbstractStrategy');

class FacebookLogoStrategy extends AbstractStrategy
{
	static getId() {
		return 'facebook-logo';
	}

	getParserFilesToInject() {
		return [
			__dirname + "/../AbstractMetaExtractorParser.js",
			__dirname + "/FacebookLogoStrategyParser.js"
		];
	}

	/**
	 * This method is executed in the context of the Headless Chrome Browser
	 * @returns {Array}
	 */
	parsePage () {
		let parser = new FacebookLogoStrategyParser(document);
		return parser.parse();
	}

	async processParserResult(parserResult) {

		let images = [];
		for(let result of parserResult) {
			if(!result.id) {
				continue;
			}

			let definition = await this.processDownload(
				`https://graph.facebook.com/${result.id}/picture?type=large`,
				result.weight
			);

			if(definition) {
				images.push((definition));
			}
		}

		return images;
	}
}

module.exports = FacebookLogoStrategy;
