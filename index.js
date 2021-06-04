import axios from 'axios'
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export default class HorniClient {
    static vocab = JSON.parse(fs.readFileSync(__dirname+`/vocabs/vocab.json`))
    static indexed_vocab = JSON.parse(fs.readFileSync(__dirname+`/vocabs/vocabIndexed.json`))

    /**
     * @param apiURL
     * @param {Object} default_prompt_settings
     */
    constructor(apiURL, default_prompt_settings) {
        this.apiURL = apiURL ?? `http://localhost:5000`
        default_prompt_settings = default_prompt_settings ?? {}
        Object.assign(this, default_prompt_settings)
    }

    /**
     * Sends a text and returns token indexes
     * @param prompt
     * @return {Promise<number[]>} token indexes
     */
    async getTokens(prompt) {
        if (!prompt) throw new Error("Prompt argument is mandatory")
        const tokens = (await this.sendPostRequest(`${this.apiURL}/tokens`, {prompt}))
        return tokens.map((token) => [
            token, vocabIndexed[token]
        ])
    }

    /**
     * Sends a string and returns the index of every token containing it
     * @param string
     * @param caseSensitive
     * @return {Promise<number[]>} token indexes
     */
    async getStringTokens(string, caseSensitive = false) {
        if (!prompt) throw new Error("String argument is mandatory")

        const tokenString = (await this.getTokens(prompt))
            .map((token) => vocabIndexed[token])
            .join('')

        const tokens = (await this.sendPostRequest(`${this.apiURL}/string-tokens`, {
            string: tokenString,
            case_sensitive: caseSensitive
        }))

        return tokens.map((token) => [
            token, vocabIndexed[token]
        ])
    }

    /**
     * Sends a prompt and returns a list of string containing the AI results
     * @param prompt
     * @return {Promise<string[]>} list of results (size defined by nb_answer option)
     */
    async sendPrompt(prompt) {
        if (prompt) {
            this.prompt = prompt
            return await this.sendPostRequest(`${this.apiURL}/prompt`, this)
        }
    }

    /**
     * Sends a POST request to given url
     * @param url
     * @param data
     * @return {Promise<unknown>}
     */
    sendPostRequest(url, data) {
        return new Promise((accept, reject) => {
            axios.post(url, data)
                .then((result) => {
                    const answer = result.data
                    if (answer) {
                        accept(answer)
                    } else {
                        reject()
                    }
                })
                .catch(() => {
                    reject()
                })
        })
    }
}
