import HorniClient from './index.js'

const client = new HorniClient()

async function main() {
    var initialTimestamp = Date.now()
    var output = `This is a${(await client.sendPrompt("This is a"))[0]}`
    var generationTimestamp = Date.now()
    var generationDifference = generationTimestamp-initialTimestamp
    var tokens = (await client.getTokens(output)).length
    var tokenTimestamp = Date.now()
    var tokenDifference = tokenTimestamp-generationTimestamp
    console.log(`Generation: ${output} (${generationDifference}ms) | Token Count: ${tokens} (${tokenDifference}ms)`)
}

main().then()
