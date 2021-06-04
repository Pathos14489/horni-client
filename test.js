import HorniClient from './index.js'

const client = new HorniClient()

(async()=>{
    console.log(`Running Horni Test...\n`);
    var input       = `This is a`
    var generation  = await client.sendPrompt(input)
    var tokens      = generation.prompt.tokens.length+generation.results[0].tokens.length
    var output      = `${generation.total_elapsed_time}ms | ${tokens} Tokens w/prompt | ${input}${generation.results[0].content}`
    console.log(output);
})