import HorniClient from './index.js'

const client = new HorniClient()

async function main() {
    console.log(`Metrics Test Running...`);
    await client.initialize()
    console.log(client.stats);
}

main().then()