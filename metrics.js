import HorniClient from './index.js'

const client = new HorniClient()

async function main() {
    console.log(`Running Horni-Client Metrics Test...\n`);
    var startTime           = Date.now()
    var input               = `This is a`
    var testCount            = 9
    var tests = []
    for (let index = 0; index < testCount; index++) tests.push(client.sendPrompt(input)) // Adds tests to list.
    var completedTests      = await Promise.all(tests)
    var clientTimeElapsed   = Date.now()-startTime
    console.log(completedTests[0]);
    var serverTime          = completedTests.map((a)=>a.total_elapsed_time)
    var totalServerTime     = serverTime.reduce((a,b)=>a+b)
    var testResults         = completedTests.map(test=>input+test.results[0].content)
    var output              = `Tokens Per Request: ${client.default_prompt_settings.number_generated_tokens} - Request Count: ${testCount+1} - Server Generation Time: ${totalServerTime}ms - Client Start-to-Finish Time: ${clientTimeElapsed}ms}`
    console.log(output);
    console.log(testResults);
}

main().then()
