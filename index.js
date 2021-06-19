import fs from 'fs'
import axios from 'axios'
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import tokenizer from "gpt-3-encoder"

const __dirname = dirname(fileURLToPath(import.meta.url));
export default class HorniClient {
    static vocab = JSON.parse(fs.readFileSync(__dirname+`/vocabs/vocab.json`))
    static indexed_vocab = JSON.parse(fs.readFileSync(__dirname+`/vocabs/vocabIndexed.json`))

    /**
     * @param apiURL
     * @param {Object} default_prompt_settings
     */
    constructor(default_prompt_settings = {}) {
        this.initialized = false
        this.generating = false // For tracking when a generation is in progress
        this.queue = []
        this.verbose = default_prompt_settings.verbose ?? false
        this.useQueueChecker = true
        this.generations = 0
        this.getTokenRequests = {
            requested:0,
            successful:0
        }
        this.priority = 0.6 //2.7B:1 | 6B:0.6  TO-DO: Eventually having this be determined by the health_check, maybe if that also returned what model the server was hosting. The idea is for the server priority to self scale with generation times, model type(2.7B/6B), and the ratio between number of total generations, and how many are labeled as retries.
        this.responseTimes = []
        this.generationTimes = []
        this.startTime = Date.now()
        // Intentionally setting the default values here instead of letting it be handled at the API level
        default_prompt_settings.apiURL                      = default_prompt_settings.apiURL ?? `http://localhost:5000`
        default_prompt_settings.nb_answer                   = default_prompt_settings.nb_answer ?? 1
        default_prompt_settings.number_generated_tokens     = default_prompt_settings.number_generated_tokens ?? 64
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
        default_prompt_settings.banned_strings              = default_prompt_settings.banned_strings ?? []
        this.apiURL                                         = default_prompt_settings.apiURL
        delete default_prompt_settings.apiURL
        this.default_prompt_settings = default_prompt_settings
        this.healthCheck()
    }
    /**
     * Gets client statistics
     */
    get stats(){
        if(!this.initialized) throw "Client not initialized!"
        var last25 = this.responseTimes.slice(this.responseTimes.length-25,this.responseTimes.length)

        var recentOutputTokens = last25.map(x=>x.outputTokens)
        var recentOutputAverage = recentOutputTokens.reduce((a,b)=>a+b)/25

        var recentInputTokens = last25.map(x=>x.inputTokens)
        var recentInputAverage = recentInputTokens.reduce((a,b)=>a+b)/25

        var inputResponses = last25.map(x=>(x.time/x.inputTokens))
        var inputResponsesAverage = (inputResponses.reduce((a,b)=>a+b))/25

        var outputResponses = last25.map(x=>(x.time/x.outputTokens))
        var outputResponsesAverage = (outputResponses.reduce((a,b)=>a+b))/25

        var timings25 = {
            averageResponseTimePerInputToken:inputResponsesAverage,
            averageResponseTimePerOutputToken:outputResponsesAverage,
        }
        var appeal = ((this.priority*(recentOutputAverage/this.averageTokenTimes.averageResponseTimePerOutputToken))*this.queueSize)*this.generating?2:1
        return {
            appeal,
            recentOutputAverage,
            recentInputAverage,
            recentTimings:timings25,
            generationStats:{
                count:this.generations,
                timings:this.averageTokenTimes
            }
        }
    }
    /**
     * Returns the appeal rating of the client. Faster client have lower appeal scores, the closer to 0 they are, the more appealing it is to use them.
     */
    get appeal(){
        if(!this.initialized) throw "Client not initialized!"
        return this.stats.appeal
    }
    get averageResponseTime(){
        if(!this.initialized) throw "Client not initialized!"
        var times = this.responseTimes.map(x=>x.time)
        return (times.reduce((a,b)=>a+b))/this.responseTimes.length
    }
    get averageGenerationTime(){
        if(!this.initialized) throw "Client not initialized!"
        var times = this.generationTimes.map(x=>x.time)
        return (times.reduce((a,b)=>a+b))/this.generationTimes.length
    }
    get averageTokenTimes(){
        if(!this.initialized) throw "Client not initialized!"
        var inputGenerations = this.generationTimes.map(x=>(x.time/x.inputTokens))
        var inputGenerationsAverage = (inputGenerations.reduce((a,b)=>a+b))/inputGenerations.length
        var outputGenerations = this.generationTimes.map(x=>(x.time/x.outputTokens))
        var outputGenerationsAverage = (outputGenerations.reduce((a,b)=>a+b))/outputGenerations.length
        var inputResponses = this.responseTimes.map(x=>(x.time/x.inputTokens))
        var inputResponsesAverage = (inputResponses.reduce((a,b)=>a+b))/inputResponses.length
        var outputResponses = this.responseTimes.map(x=>(x.time/x.outputTokens))
        var outputResponsesAverage = (outputResponses.reduce((a,b)=>a+b))/outputResponses.length
        return {
            averageResponseTimePerInputToken:inputResponsesAverage,
            averageResponseTimePerOutputToken:outputResponsesAverage,
            averageGenerationTimePerInputToken:inputGenerationsAverage,
            averageGenerationTimePerOutputToken:outputGenerationsAverage,
        }
    }
    get queueSize(){
        if(!this.initialized) throw "Client not initialized!"
        return this.queue.length
    }
    get totalGeneratedTokens(){
        if(!this.initialized) throw "Client not initialized!"
        var outputGenerations = this.generationTimes.map(x=>x.outputTokens)
        return (outputGenerations.reduce((a,b)=>a+b))
    }
    get averageInputTokens(){
        if(!this.initialized) throw "Client not initialized!"
        var inputGenerations = this.generationTimes.map(x=>x.inputTokens)
        return (inputGenerations.reduce((a,b)=>a+b))/inputGenerations.length
    }
    get averageOutputTokens(){
        if(!this.initialized) throw "Client not initialized!"
        return this.totalGeneratedTokens/this.generationTimes.length
    }
    async initializeMetrics(){
        if(this.verbose) console.log(`Running Horni-Client Metrics Initialization...\n`);
        var startTime           = Date.now()
        var input               = `This is a`
        var old = this.default_prompt_settings.number_generated_tokens
        this.default_prompt_settings.number_generated_tokens = 1
        await this.sendPrompt(input) // Sends initial prompt to get slow generation out of the way.
        this.responseTimes.pop() // Removes bad stat
        this.generationTimes.pop() // Removes bad stat
        this.default_prompt_settings.number_generated_tokens = old
        var testCount           = 25
        var tests = []
        for (let index = 0; index < testCount; index++) tests.push(this.sendPrompt(input)) // Adds tests to list.
        var completedTests      = await Promise.all(tests)
        var clientTimeElapsed   = Date.now()-startTime
        var serverTime          = completedTests.map((a)=>a.total_elapsed_time)
        var totalServerTime     = serverTime.reduce((a,b)=>a+b)
        var testResults         = completedTests.map(test=>input+test.results[0].content)
        var output              = `Tokens Per Request: ${this.default_prompt_settings.number_generated_tokens} - Request Count: ${testCount} - Server Generation Time: ${totalServerTime}ms - Latency: ${`${clientTimeElapsed-totalServerTime}`.split(".")[0]}ms}` 
        if(this.verbose) console.log(testResults);
        if(this.verbose) console.log(output);
        if(this.verbose) console.log(this.stats);
        this.initialized = true
    }
    async checkQueue(){
        if(!this.queue) this.queue = []
        if(this.verbose) console.log("Check Loop",this.queue,this.queue.length);
        if(this.queue.length>0) {
            if(this.verbose) console.log(this.queue); // Debug output
            if(!this.generating){
                var prompt = this.queue.shift() // Gets latest
                console.log(prompt);
                try {
                    var elapsedTime = Date.now()-prompt.timestamp
                    if(this.verbose) console.log(`Resolving queued prompt that has been queue for ${elapsedTime}ms:`,prompt); // Debug output
                    prompt.resolve(await this.sendPrompt(prompt.prompt))
                } catch (error) {
                    prompt.reject(error)
                }
            }
        }else{
            throw "Queue is empty!"
        }
    }
    /**
     * Sends a text and returns token indexes
     * @param prompt
     * @return Array of token indexes
     */
    getTokens(prompt) {
        if(!prompt) return []
        if(prompt.length<1) return []
        else return tokenizer.encode(prompt)
    }
    /**
     * Sends a text and returns token indexes
     * @param tokens
     * @return {String} String representation of token array.
     */
    getString(tokens) {
        return tokenizer.decode(tokens)
    }
    async healthCheck() {
        var res = await axios(`${this.apiURL}/health_check`)
        if(!res || res.data != "ok") console.error("Horni API Health Check Failed!")
        if(!res) res = {msg:"Server down"}
        return res
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
            .map((token) => HorniClient.indexed_vocab[token])
            .join('')

        var tokens = (await axios.post(`${this.apiURL}/string-tokens`, {
            string: tokenString,
            case_sensitive: caseSensitive
        })).data

        return tokens.map((token) => [
            token, HorniClient.indexed_vocab[token]
        ])
    }

    /**
     * Sends a prompt and returns a list of string containing the AI results
     * @param prompt
     * @return {Promise<string[]>} list of results (size defined by nb_answer option)
     */
    async sendPrompt(prompt = "",options = {}) {
        return new Promise(async(resolve, reject) => {
            try {
                var responseGot = Date.now()
                if(this.generating){
                    if(!this.queue) this.queue = []
                    this.queue.push({
                        prompt,
                        resolve,
                        reject,
                        timestamp:responseGot
                    })
                }else{
                    this.generating = true
                    var backup = this.default_prompt_settings
                    // Intentionally setting the default values here instead of letting it be handled at the API level
                    this.default_prompt_settings.prompt = prompt
                    this.default_prompt_settings.nb_answer                   = options.nb_answer ?? this.default_prompt_settings.nb_answer
                    this.default_prompt_settings.number_generated_tokens     = options.number_generated_tokens ?? this.default_prompt_settings.number_generated_tokens
                    this.default_prompt_settings.temperature                 = options.temperature ?? this.default_prompt_settings.temperature
                    this.default_prompt_settings.top_k                       = options.top_k ?? this.default_prompt_settings.top_k
                    this.default_prompt_settings.top_p                       = options.top_p ?? this.default_prompt_settings.top_p
                    this.default_prompt_settings.tail_free_sampling          = options.tail_free_sampling ?? this.default_prompt_settings.tail_free_sampling
                    this.default_prompt_settings.repetition_penalty          = options.repetition_penalty ?? this.default_prompt_settings.repetition_penalty
                    this.default_prompt_settings.repetition_penalty_range    = options.repetition_penalty_range ?? this.default_prompt_settings.repetition_penalty_range
                    this.default_prompt_settings.repetition_penalty_slope    = options.repetition_penalty_slope ?? this.default_prompt_settings.repetition_penalty_slope
                    this.default_prompt_settings.enable_tfs                  = options.enable_tfs ?? this.default_prompt_settings.enable_tfs
                    this.default_prompt_settings.enable_top_k                = options.enable_top_k ?? this.default_prompt_settings.enable_top_k
                    this.default_prompt_settings.enable_top_p                = options.enable_top_p ?? this.default_prompt_settings.enable_top_p
                    this.default_prompt_settings.prevent_square_brackets     = options.prevent_square_brackets ?? this.default_prompt_settings.prevent_square_brackets
                    this.default_prompt_settings.prevent_angle_brackets      = options.prevent_angle_brackets ?? this.default_prompt_settings.prevent_angle_brackets
                    this.default_prompt_settings.prevent_curly_brackets      = options.prevent_curly_brackets ?? this.default_prompt_settings.prevent_curly_brackets
                    this.default_prompt_settings.banned_token_indexes        = options.banned_token_indexes ?? this.default_prompt_settings.banned_token_indexes
                    this.default_prompt_settings.banned_strings              = options.banned_strings ?? this.default_prompt_settings.banned_strings
                    var response = (await axios.post(`${this.apiURL}prompt`, this.default_prompt_settings)).data
                    this.default_prompt_settings = backup
                    this.generating = false
                    if(this.queue.length>0) this.checkQueue()
                    this.generations++
                    if(this.generations>24) this.initialized = true
                    var tokenCount = tokenizer.encode(prompt).length
                    this.responseTimes.push({
                        time:Date.now()-responseGot,
                        inputTokens:tokenCount,
                        outputTokens:this.default_prompt_settings.number_generated_tokens,
                    })
                    this.generationTimes.push({
                        time:response.total_elapsed_time,
                        inputTokens:tokenCount,
                        outputTokens:this.default_prompt_settings.number_generated_tokens,
                    })
                    resolve(response)
                }
            } catch (error) {
                console.trace(error)
                reject(error)
            }

        })
    }
}