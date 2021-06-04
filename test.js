import HorniClient from './index.js'

const client = new HorniClient()

async function main() {
    console.log(await client.sendPrompt("This is a"))
}

main().then()
