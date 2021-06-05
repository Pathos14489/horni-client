import HorniClient from './index.js'

const client = new HorniClient()

async function main() {
    console.log(`Running Horni Test...\n`);
    var startTime           = Date.now()
    var input       = `This is a`
    var generation  = await client.sendPrompt(input)
    var tokens      = generation.prompt.tokens.length+generation.results[0].tokens.length
    var clientTimeElapsed   = Date.now()-startTime
    var output      = `Server Generation Time: ${generation.total_elapsed_time}ms - Latency: ${`${clientTimeElapsed-generation.total_elapsed_time}`.split(".")[0]}ms - ${tokens} Tokens w/prompt - ${input}${generation.results[0].content}`
    console.log(output);
}

main().then()
