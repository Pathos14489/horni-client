# Horni-Client

Instantiate client connections to Noli's [Horni API](https://gitlab.com/nolialsea/horni-api) to generate the AI results.

You have to connect to a running instance of the server for it to work.

## Install
	npm install horni-client

## Example

	import HorniClient from "horni-client" // const HorniClient = require("horni-client")
	const client = new HorniClient()
	async function main() {
		var input       = `This is a`
		var generation  = await client.sendPrompt(input)
		var result 	= generation.results[0]
		var tokens      = result.tokens.length
		var output      = `${generation.total_elapsed_time}ms | ${tokens} Tokens | ${input}${result.content}`
		console.log(output);
	}
	main()
## Metrics
If you want to have access to the metrics, you need it to have sent at least 25 prompts. This is to give the averages a good dataset to work from. I recommend running the initializeMetrics() method if you want to make sure you have them.
