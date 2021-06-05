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
		var tokens      = generation.prompt.tokens.length+generation.results[0].tokens.length
		var output      = `${generation.total_elapsed_time}ms | ${tokens} Tokens w/prompt | ${input}${generation.results[0].content}`
		console.log(output);
	}
	main().then()

## High Latency When Utilizing Queue?
If you notice high latency when utilizing the queue, and especially when running the metrics test, it is likely due to lazy queue checking for performance. The lazy queueChecker can be disabled and the checkQueue method can be called manually if you need to revise the queue to better suit your needs.

	const client = new HorniClient({ "useQueueChecker":false })

The checker can then be re-enabled later.

	client.useQueueChecker = true
