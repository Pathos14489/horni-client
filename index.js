import fs from 'fs'
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
    constructor(apiURL = `http://localhost:5000`, default_prompt_settings = {}) {
        this.apiURL = apiURL
        // Intentionally setting the default values here instead of letting it be handled at the API level
        default_prompt_settings.nb_answer                   = default_prompt_settings.nb_answer ?? 1
        default_prompt_settings.number_generated_tokens     = default_prompt_settings.number_generated_tokens ?? 20
        default_prompt_settings.temperature                 = default_prompt_settings.temperature ?? 0.8
        default_prompt_settings.top_k                       = default_prompt_settings.top_k ?? 60
        default_prompt_settings.top_p                       = default_prompt_settings.top_p ?? 0.9
        default_prompt_settings.tail_free_sampling          = default_prompt_settings.tail_free_sampling ?? 0.95
        default_prompt_settings.repetition_penalty          = default_prompt_settings.repetition_penalty ?? 2.0
        default_prompt_settings.repetition_penalty_range    = default_prompt_settings.repetition_penalty_range ?? 512
        default_prompt_settings.repetition_penalty_slope    = default_prompt_settings.repetition_penalty_slope ?? 3.33
        default_prompt_settings.enable_tfs                  = default_prompt_settings.enable_tfs ?? false
        default_prompt_settings.enable_top_k                = default_prompt_settings.enable_top_k ?? true
        default_prompt_settings.enable_top_p                = default_prompt_settings.enable_top_p ?? true
        default_prompt_settings.prevent_square_brackets     = default_prompt_settings.prevent_square_brackets ?? false
        default_prompt_settings.prevent_angle_brackets      = default_prompt_settings.prevent_angle_brackets ?? false
        default_prompt_settings.prevent_curly_brackets      = default_prompt_settings.prevent_curly_brackets ?? false
        default_prompt_settings.banned_token_indexes        = default_prompt_settings.banned_token_indexes ?? []
        Object.assign(this, default_prompt_settings) // Assigns default_prompt_settings properties to this
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
                        console.trace("No Answer")
                        reject()
                    }
                })
                .catch((err) => {
                    console.trace(err)
                    reject()
                })
        })
    }
}
