import axios from 'axios'
import fs from "fs"
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export default class HorniClient {
    static vocab = JSON.parse(fs.readFileSync(__dirname+`/vocab.json`))
    static indexed_vocab = JSON.parse(fs.readFileSync(__dirname+`/vocabIndexed.json`))

    /**
     * @param {Object} default_prompt_settings
     */
    constructor(apiURL,default_prompt_settings){
        if(!apiURL) {
            this.apiURL = `http://localhost:5000`
        }else{
            this.apiURL = apiURL
        }


        //TO-DO: Probably redo the block below. I was exhausted and fighting with the IDE the entire time and eventually just got fed up with it and threw this mess together. Want to replace it with a more elegant and lest wasteful solution, but well. I guess it works for now.
        if(!default_prompt_settings) default_prompt_settings = {}
        if(!default_prompt_settings.nb_answer) default_prompt_settings.nb_answer = 1
        if(!default_prompt_settings.number_generated_tokens) default_prompt_settings.number_generated_tokens = 20
        if(!default_prompt_settings.temperature) default_prompt_settings.temperature = 0.8
        if(!default_prompt_settings.top_k) default_prompt_settings.top_k = 60
        if(!default_prompt_settings.top_p) default_prompt_settings.top_p = 0.9
        if(!default_prompt_settings.tail_free_sampling) default_prompt_settings.tail_free_sampling = 0.95
        if(!default_prompt_settings.repetition_penalty) default_prompt_settings.repetition_penalty = 2.0
        if(!default_prompt_settings.repetition_penalty_range) default_prompt_settings.repetition_penalty_range = 512
        if(!default_prompt_settings.repetition_penalty_slope) default_prompt_settings.repetition_penalty_slope = 3.33
        if(!default_prompt_settings.enable_tfs) default_prompt_settings.enable_tfs = false
        if(!default_prompt_settings.enable_top_k) default_prompt_settings.enable_top_k = true
        if(!default_prompt_settings.enable_top_p) default_prompt_settings.enable_top_p = true
        if(!default_prompt_settings.prevent_square_brackets) default_prompt_settings.prevent_square_brackets = false
        if(!default_prompt_settings.prevent_angle_brackets) default_prompt_settings.prevent_angle_brackets = false
        if(!default_prompt_settings.prevent_curly_brackets) default_prompt_settings.prevent_curly_brackets = false
        this.nb_answer = default_prompt_settings.nb_answer
        this.number_generated_tokens = default_prompt_settings.number_generated_tokens
        this.temperature = default_prompt_settings.temperature
        this.top_k = default_prompt_settings.top_k
        this.top_p = default_prompt_settings.top_p
        this.tail_free_sampling = default_prompt_settings.tail_free_sampling
        this.repetition_penalty = default_prompt_settings.repetition_penalty
        this.repetition_penalty_range = default_prompt_settings.repetition_penalty_range
        this.repetition_penalty_slope = default_prompt_settings.repetition_penalty_slope
        this.enable_tfs = default_prompt_settings.enable_tfs
        this.enable_top_k = default_prompt_settings.enable_top_k
        this.enable_top_p = default_prompt_settings.enable_top_p
        this.prevent_square_brackets = default_prompt_settings.prevent_square_brackets
        this.prevent_angle_brackets = default_prompt_settings.prevent_angle_brackets
        this.prevent_curly_brackets = default_prompt_settings.prevent_curly_brackets
    }
    /**
     * Returns an array of AI generated text continuing your prompt
     * Retries until fulfillment
     * @param {String} prompt
     * @param {Object} opts
     * @returns {Promise} [String]
     */
    getPromptAsync(prompt, opts) {
        return new Promise((resolve, reject) => {
            this.getPrompt(prompt, opts, (answer, err) => {
                if (answer){
                    resolve(answer)
                }else if (err){
                    console.trace(err)
                    reject()
                }
            })
        })
    }
    /**
     * Returns an AI generated text continuing your prompt
     * Retries until fulfillment
     * @param prompt
     * @param opts
     * @param callback
     * @param nbFail
     */
    getPrompt(prompt, opts, callback = (answer, err) => {
    }, nbFail = 0) {
        // Tries to generate a message until it works
        this.sendPrompt(prompt, opts, (message, err) => {
            if (message && !err) {
                callback(message)
            } else if (nbFail < 3) {
                this.getPrompt(prompt, opts, callback, ++nbFail)
            } else {
                callback(null, true)
            }
        }).then().catch()
    }
    /**
     * Tries to generate a message with the AI API
     * @param {String} prompt to feed to the AI
     * @returns Promise of tokenized array based on the input prompt string.
     */
    async getTokens(prompt) {
        return new Promise(async (resolve, reject) => {
            try {
                if(!prompt) reject()
                var data = { prompt }
                var result = await axios.post(`${this.apiURL}/tokens`, data)
                const answer = result.data
                if (answer) {
                    resolve(answer)
                } else {
                    reject()
                }
            } catch (error) {
                console.trace(err)
                reject(error)
            }
        })
    }
    /**
     * Tries to generate a message with the AI API
     * @param {Object} prompt to feed to the AI
     * @param callback (aiMessage, err) => null either aiMessage or err if the message was null or empty after processing
     */
     async sendPrompt(prompt, opts, callback = (aiMessage, err) => null) {
        try {
            if(!prompt) throw "Prompt not defined."
            if(!opts) opts = {}
            opts.prompt = prompt
            if(!opts.nb_answer) opts.nb_answer = this.nb_answer
            if(!opts.number_generated_tokens) opts.number_generated_tokens = this.number_generated_tokens
            if(!opts.temperature) opts.temperature = this.temperature
            if(!opts.top_k) opts.top_k = this.top_k
            if(!opts.top_p) opts.top_p = this.top_p
            if(!opts.tail_free_sampling) opts.tail_free_sampling = this.tail_free_sampling
            if(!opts.repetition_penalty) opts.repetition_penalty = this.repetition_penalty
            if(!opts.repetition_penalty_range) opts.repetition_penalty_range = this.repetition_penalty_range
            if(!opts.repetition_penalty_slope) opts.repetition_penalty_slope = this.repetition_penalty_slope
            if(!opts.enable_tfs) opts.enable_tfs = this.enable_tfs
            if(!opts.enable_top_k) opts.enable_top_k = this.enable_top_k
            if(!opts.enable_top_p) opts.enable_top_p = this.enable_top_p
            if(!opts.prevent_square_brackets) opts.prevent_square_brackets = this.prevent_square_brackets
            if(!opts.prevent_angle_brackets) opts.prevent_angle_brackets = this.prevent_angle_brackets
            if(!opts.prevent_curly_brackets) opts.prevent_curly_brackets = this.prevent_curly_brackets
            console.log(`${this.apiURL}/prompt`,opts);
            var result = await axios.post(`${this.apiURL}/prompt`, opts)
            const answer = result.data
            if (answer) {
                callback(answer)
            } else {
                console.trace("No Answer")
                callback(null, true)
            }
        } catch (err) {
            console.trace(err)
            callback(null, true)
        }
    }
}