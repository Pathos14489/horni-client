# Horni-Client

Instantiate client connections to Noli's [Horni API](https://gitlab.com/nolialsea/horni-api) to generate the AI results.

You have to connect to a running instance of the server for it to work.

## Example

	import HorniClient from "./horni-client" // const HorniClient = require("./horni-client")
	const client = new HorniClient()
	(async()=>{
		console.log(`Running Horni Test...\n`);
		var input       = `This is a`
		var generation  = await client.sendPrompt(input)
		var tokens      = generation.prompt.tokens.length+generation.results[0].tokens.length
		var output      = `${generation.total_elapsed_time}ms | ${tokens} Tokens w/prompt | ${input}${generation.results[0].content}`
		console.log(output);
	})
