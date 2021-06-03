# Horni-Client

Instantiate client connections to Noli's [Horni API](https://gitlab.com/nolialsea/horni-api) to generate the AI results.

You have to connect to a running instance of the server for it to work.

## Example

	import HorniClient from "./horni-client" // const HorniClient = require("./horni-client")
	(()=>{ //Async Wrapper
		var client = new HorniClient({"apiURL":"http://localhost:5000"}) // Instantiate Client
		var responses = await client.getPromptAsync("This is an example message.",{"number_generated_tokens":20,"nb_answer":1})
		console.log(responses)
		// Output: [
		//		"Returns an array of generated responses equal to the nb_number option."
		// ]
	})()
