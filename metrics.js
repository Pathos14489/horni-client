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
    var serverTime          = completedTests.map((a)=>a.total_elapsed_time)
    var totalServerTime     = serverTime.reduce((a,b)=>a+b)
    var testResults         = completedTests.map(test=>input+test.results[0].content)
    var output              = `Tokens Per Request: ${client.default_prompt_settings.number_generated_tokens} - Request Count: ${testCount+1} - Server Generation Time: ${totalServerTime}ms - Latency: ${`${clientTimeElapsed-totalServerTime}`.split(".")[0]}ms}` 
    // Note, high latency is likely due to lazy queue checking for performance. The lazy queuechecker can be disabled and the checkQueue method can be called manually if you need to revise the queue to better suit your needs.
    console.log(output);
    console.log(testResults);
}

main().then()
