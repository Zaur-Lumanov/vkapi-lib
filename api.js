const request = require('./request')
const vm = require('vm')
const fs = require('fs')
const mime = require('mime')
const Message = require('./message')
const outMessage = require('./outmessage')

const DELAY = 1000/3
const ADS_DELAY = 1000/2
const PROTO = 'https'
const API_URL = 'api.vk.com'
const VERSION = 5.67
const SECURE_LIMIT = [5, 8, 20, 35]
const LP_MESSAGE_FLAGS = {
    UNREAD: 1,
    OUTBOX: 2,
    REPLIED: 4,
    IMPORTANT: 8,
    CHAT: 16,
    FRIENDS: 32,
    SPAM: 64,
    DEL: 128,
    FIXED: 256,
    MEDIA: 512,
    HIDDEN: 65536
}

module.exports = class API {
    constructor() {
        this.tokens = []
        this.queue = []
        this.secure_queue = []
        this.ads_queue = []
        this.execute = []
        this.queue_intervals = {}
        this.secure_queue_intervals = {}
        this.ads_queue_intervals = {}
        this.execute_intervals = {}
        this.longpoll_callback = {}
        this.lp_message_callback = {}

        this.default_logger = console.log
        this.default_callback = this.default_logger
        this.default_error_handler = console.error

        this.message_filter = () => {}

        this.request_object = new request(this.default_error_handler)

        this.request_object.set_default_option('jsonReviver', data => {
            try {
                return JSON.parse(data)
            } catch (e) {
                return this.default_error_handler(e)
            }
        })

        this.request_object.set_default_header('User-Agent', 'com.vk.vkclient/55 (unknown, iOS 10.1.1, iPhone, Scale/2.000000)')

        this.params = {
            v: VERSION
        }
        
        this.pack = false
        this.app_users = 10000 // default

        this.flags = LP_MESSAGE_FLAGS
        
        for (const o of arguments) {
            this.tokens.push(o)
        }
    }

    proxy(data) {
        return this.request_object.proxy(data)
    }

    _run(callback, error, response) {
        switch (typeof callback) {
            case 'function': {
                try {
                    callback(error, response)
                } catch (e) {
                    this.default_error_handler(e)
                }

                break
            }
            case 'string': {
                const script = new vm.Script(callback)
                const context = new vm.createContext({
                    console,
                    error,
                    response
                })

                try {
                    script.runInContext(context)
                } catch (e) {
                    this.default_error_handler(e)
                }

                break
            }
            case 'object': {
                const script = new vm.Script(callback.function)
                const context = new vm.createContext({
                    console,
                    error,
                    response
                })

                for (const key in callback) {
                    if (callback[key] == 'function') {
                        continue
                    }
                    
                    context[key] = callback[key]
                }

                try {
                    script.runInContext(context)
                } catch (e) {
                    this.default_error_handler(e)
                }

                break        
            }
        }
    }

    _call_secure(method, options = {}, callback, token) {
        if (!this.secure_queue_intervals[token]) {
            let _limit = 0

            if (this.app_users < 1e4) {
                _limit = SECURE_LIMIT[0]
            } else if (this.app_users >= 1e4 && this.app_users < 1e5) {
                _limit = SECURE_LIMIT[1]
            } else if (this.app_users >= 1e5 && this.app_users < 1e6) {
                _limit = SECURE_LIMIT[2]
            } else if (this.app_users >= 1e6) {
                _limit = SECURE_LIMIT[3]
            }

            this.secure_queue[token] = []
            this.secure_queue_intervals[token] = setInterval(token => {
                const params = this.secure_queue[token][0]

                if (!params) {
                    return
                }

                if (!params.options) {
                    params.options = {}
                }

                params.options.access_token = token
                
                for (const key in this.params) {
                    params.options[key] = this.params[key]
                }

                this.request_object.request({
                    method: 'POST',
                    uri: `${PROTO}://${API_URL}/method/secure.${params.method}`,
                    formData: params.options,
                    json: true
                }, (error, response, body) => {
                    this._run(params.callback, body.error, body.response)
                })

                this.secure_queue[token].shift()
                
                if (!this.secure_queue[token].length) {
                    clearInterval(this.secure_queue_intervals[token])

                    delete this.secure_queue_intervals[token]
                }
            }, _limit, token)
        }

        this.secure_queue[token].push({method, options, callback})
    }

    _call_ads(method, options = {}, callback, token) {
        if (!this.ads_queue_intervals[token]) {
            this.ads_queue[token] = []
            this.ads_queue_intervals[token] = setInterval(token => {
                const params = this.ads_queue[token][0]

                if (!params) {
                    return
                }

                if (!params.options) {
                    params.options = {}
                }

                params.options.access_token = token
                
                for (const key in this.params) {
                    params.options[key] = this.params[key]
                }

                this.request_object.request({
                    method: 'POST',
                    uri: `${PROTO}://${API_URL}/method/ads.${params.method}`,
                    formData: params.options,
                    json: true
                }, (error, response, body) => {
                    this._run(params.callback, body.error, body.response)
                })

                this.ads_queue[token].shift()
                
                if (!this.ads_queue[token].length) {
                    clearInterval(this.ads_queue_intervals[token])

                    delete this.ads_queue_intervals[token]
                }
            }, ADS_DELAY, token)
        }
       
        this.ads_queue[token].push({method, options, callback})
    }

    setDefaultCallback(callback = () => {}) {
        this.default_callback = callback
    }

    setDefaultErrorHandler(callback = () => {}) {
        this.default_error_handler = callback

        this.request_object.set_error_handler(this.default_error_handler)
    }

    set_params(data = {
        lang: 0,
        https: 1,
        v: VERSION
    }) {
        this.params = data
    }

    set_param(key, value) {
        this.params[key] = value
    }

    token(token) {
        switch (typeof token) {
            case 'number': {
                if (this.tokens.length-1 > token) {
                    token = this.tokens[token]

                    break
                }
            }
            default: {
                if (this.tokens.length) {
                    token = this.tokens[0]
                } else {
                    token = ''
                }
            }
        }

        return token
    }
    
    call(method, options = {}, callback = this.default_callback, token) {
        token = this.token(token)

        for (const key in options) {
            if (typeof options[key] == 'boolean') {
                options[key] = options[key] ? 1 : 0
            }
        }

        const _method = method.split('.')

        switch (_method[0]) {
            case 'ads': {
                if (_method[1] != 'getUploadURL') {
                    return this._call_ads(_method[1], options, callback, token)
                } else {
                    break
                }
            }
            case 'secure': {
                return this._call_secure(_method[1], options, callback, token)
            }
        }
        
        if (this.pack && _method[0] != 'execute') {
            if (!this.execute_intervals[token]) {
                this.execute[token] = []
                this.execute_intervals[token] = setInterval(token => {
                    if (!this.execute[token].length) {
                        return
                    }

                    let execute_code = 'return ['

                    for (let i = 0; i < 25; i++) {
                        if (!this.execute[token][i]) {
                            break
                        }
                            
                        execute_code += `API.${this.execute[token][i].method}(${JSON.stringify(this.execute[token][i].options)}),`
                    }

                    execute_code.substring(0, execute_code.length - 1)

                    execute_code += '];'

                    const spliced = this.execute[token].splice(0, 25)

                    this.request_object.request({
                        method: 'POST',
                        uri: `${PROTO}://${API_URL}/method/execute`,
                        formData: {
                            access_token: token,
                            v: VERSION,
                            code: execute_code
                        },
                        json: true
                    }, (error, response, body) => {
                        if (body.error) {
                            return this.default_logger(body.error)
                        }

                        for (const key in body.response) {
                            if (body.response[key] === false) {
                                if (body.execute_errors[key]) {
                                    this._run(spliced[key].callback, body.execute_errors[key], undefined)
                                }
                            } else {
                                this._run(spliced[key].callback, undefined, body.response[key])
                            }
                        }
                    })
                }, DELAY, token)
            }

            return void this.execute[token].push({method, options, callback})
        }

        if (!this.queue_intervals[token]) {
            this.queue[token] = []
            this.queue_intervals[token] = setInterval(token => {
                const params = this.queue[token][0]

                if (!params) {
                    return
                }

                if (!params.options) {
                    params.options = {}
                }

                params.options.access_token = token
                
                for (const key in this.params) {
                    params.options[key] = this.params[key]
                }

                for (const key in params.options) {
                    if (params.options[key] === undefined) {
                        params.options[key] = ''
                    }
                }
                this.request_object.request({
                    method: 'POST',
                    uri: `${PROTO}://${API_URL}/method/${params.method}`,
                    formData: params.options,
                    json: true
                }, (error, response, body) => {
                    if (error) {
                        return this.default_error_handler(error)
                    }

                    this._run(params.callback, body.error, body.response)
                })

                this.queue[token].shift()
                
                if (!this.queue[token].length) {
                    clearInterval(this.queue_intervals[token])

                    delete this.queue_intervals[token]
                }
            }, DELAY, token)
        }

        this.queue[token].push({method, options, callback})
    }

    send(text, options = {}, peer = {}, callback, token) {
        text = this.message_filter(text)
        
        if (typeof peer == 'object') {
            if (peer.peer_id) {
                peer = peer.peer_id
            }

            if (options.reply) {
                options.forward_messages = peer.id
            }
        }

        var token = token ? token : options.token

        options.message = text
        options.peer_id = peer

        delete options.token
        delete options.reply

        if (options.typing) {
            this.call('messages.setActivity', {
                peer_id: options.peer_id,
                type: 'typing'
            })

            delete options.typing

            setTimeout(() => this.call('messages.send', options, callback, token), options.typing)

            return
        }
         
        this.call('messages.send', options, callback, token)
    }

    message(token) {
        return new outMessage(this, token)
    }

    sticker(sticker_id, peer, callback, token) {
        this.send('', {
            sticker_id: sticker_id,
            token
        }, peer, callback)
    }

    longpoll(callback = this.default_logger, params = {
        need_pts: 0, 
        lp_version: 2, 
        mode: 10, 
        wait: 25, 
        async: true
    }, token) {
        this.longpoll_callback[token] = callback

        this.call('messages.getLongPollServer', {
            need_pts: params.need_pts,
            lp_version: params.lp_version
        }, (error, response) => {
            if (error) throw {
                name: 'VK API error',
                message: error.error_msg
            }

            const longpoll = data => {
                this.request_object.request({
                    uri: `${PROTO}://${response.server}`,
                    method: 'GET',
                    qs: {
                        act: 'a_check',
                        key: data.key,
                        ts: data.ts,
                        wait: params.wait,
                        mode: params.mode,
                        version: params.lp_version
                    }
                    //uri: `${PROTO}://${response.server}?act=a_check&key=${data.key}&ts=${data.ts}&wait=${params.wait}&mode=${params.mode}&version=${params.lp_version} `,
                }, (error, response, body) => {
                    if (error || response.statusCode != 200 || body[0] == '<') {
                        return this.default_logger(body)
                    }
                        
                    body = JSON.parse(body)

                    if (body.failed) {
                        switch (body.failed) {
                            case 1: {
                                return longpoll({ts: body.ts, key: data.key})
                            }
                            case 2: case 3: {
                                return this.longpoll(this.longpoll_callback[token], params, token)
                            }
                            case 4: {
                                params.lp_version = body.max_version

                                return this.longpoll(this.longpoll_callback[token], params, token)
                            }
                        }
                    }

                    if (params.async || params.await) {
                        for (const update of body.updates) {
                            setTimeout(this.longpoll_callback[token], 1, update)
                        }
                    } else {
                        for (const update of body.updates) {
                            this.longpoll_callback[token](update)
                        }
                    }

                    longpoll({ts: body.ts, key: data.key})
                })
            }

            longpoll({ts: response.ts, key: response.key})
        }, token)
    }

    lp_message(callback = this.default_logger, token) {
        
        if (!this.longpoll_callback[token]) {
            this.longpoll()
        }

        this.lp_message_callback[token] = callback

        const callback_cache = this.longpoll_callback[token]

        this.longpoll_callback[token] = data => {
            callback_cache(data)

            if (data[0] == 4) {
                this.lp_message_callback[token](new Message(data, this, token))
            }
        }
    }

    upload(server, data, callback) {
        this.request_object.request({
            url: server,
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            formData: data,
            json: true
        }, (error, response, body) => {
            if (error) {
                return this.default_error_handler(error)
            }
            
            if (!body) {
                return this.default_error_handler(new Error('Invalid upload data'))
            }

            callback(body)
        })
    }

    getUploadStream(path, callback) {
        const streams = []
        
        let i = 0

        if (path.length > 5) {
            path = path.splice(0, 5)
        }

        const getStream = data => { 
            if (data.match(/http(s):\/\//)) {
                if (!fs.existsSync('./cache')) {
                    fs.mkdirSync('./cache')
                }

                let cpath = `./cache/c_${Math.random()*1e17}`

                const upload_stream = fs.createWriteStream(cpath)

                const req = this.request_object.request(data)

                req.pipe(upload_stream)

                upload_stream.on('close', () => {
                    const oldpath = cpath

                    cpath = `${cpath}.${mime.extension(req.req.connection._httpMessage.res.headers['content-type'])}`

                    fs.renameSync(oldpath, cpath)

                    streams.push(fs.createReadStream(cpath))
                    if (path.length-1 == i) {
                        return callback(streams)
                    }
                    getStream(path[++i])
                })
            } else {
                try {
                    streams.push(fs.createReadStream(data))
                    if (path.length-1 == i) {
                        return callback(streams)
                    }
                    getStream(path[++i])
                } catch (e) {
                    this.default_error_handler(e)
                }
            }
        }

        getStream(path[i])
    }

    uploadPhoto(data, options = {}, callback = this.default_callback, token) {
        const params = {}

        params.group_id = options.group_id ? options.group_id : ''
        params.album_id = options.album_id ? options.album_id : ''

        this.call('photos.getUploadServer', params, (error, response) => {
            if (error) {
                return callback(error, undefined)
            }

            const files = {}

            this.getUploadStream(data, stream => {
                for (const key in stream) {
                    files[`file${+key+1}`] = stream[key]
                }

                this.upload(response.upload_url, files, resp => {
                    if (resp.error) {
                        return callback(error, undefined)
                    }

                    this.call('photos.save', {
                        server: resp.server,
                        photos_list: resp.photos_list,
                        hash: resp.hash,
                        album_id: params.album_id,
                        group_id: params.group_id,
                        user_id: response.user_id,
                        latitude: options.latitude,
                        longitude: options.longitude,
                        caption: options.caption
                    }, (error, response) => {
                        callback(error, response)
                    })
                })
            })
        }, token)
    }

    uploadPhotoOnWall(data, options = {}, callback = this.default_callback, token) {
        const params = {}

        params.group_id = options.group_id ? options.group_id : ''

        this.call('photos.getWallUploadServer', params, (error, response) => {
            if (error) {
                return callback(error, undefined)
            }

            this.getUploadStream([data], stream => {
                this.upload(response.upload_url, {
                    photo: stream[0]
                }, resp => {
                    if (resp.error) {
                        return callback(error, undefined)
                    }

                    this.call('photos.saveWallPhoto', {
                        server: resp.server,
                        photo: resp.photo,
                        hash: resp.hash,
                        group_id: params.group_id,
                        user_id: response.user_id,
                        latitude: options.latitude,
                        longitude: options.longitude,
                        caption: options.caption
                    }, (error, response) => {
                        callback(error, response)
                    })
                })
            })
        }, token)
    }

    uploadOwnerPhoto(data, options = {}, callback = this.default_callback, token) {
        const params = {}

        params.owner_id = options.owner_id ? options.owner_id : ''

        this.call('photos.getOwnerPhotoUploadServer', params, (error, response) => {
            if (error) {
                return callback(error, undefined)
            }

            const upload_data = {}

            this.getUploadStream([data], stream => {
                upload_data.photo = stream[0]
                
                if (options._square_crop) {
                    upload_data._square_crop = options._square_crop
                }

                this.upload(response.upload_url, upload_data, resp => {
                    if (resp.error) {
                        return callback(error, undefined)
                    }

                    this.call('photos.saveOwnerPhoto', {
                        hash: resp.hash,
                        photo: resp.photo,
                        server: resp.server
                    }, (error, response) => {
                        callback(error, response)
                    })
                })
            })
        }, token)
    }

    uploadMessagesPhoto(data, callback = this.default_callback, token) {
        this.call('photos.getMessagesUploadServer', {}, (error, response) => {
            if (error) {
                return callback(error, undefined)
            }

            this.getUploadStream([data], stream => {
                this.upload(response.upload_url, {
                    photo: stream[0]
                }, resp => {
                    if (resp.error) {
                        return callback(error, undefined)
                    }

                    this.call('photos.saveMessagesPhoto', {
                        server: resp.server,
                        photo: resp.photo,
                        hash: resp.hash
                    }, (error, response) => {
                        callback(error, response)
                    })
                })
            })
        }, token)
    }

    uploadChatPhoto(data, options = {}, callback = this.default_callback, token) {
        const params = {}

        params.chat_id = options.chat_id ? options.chat_id : ''
        params.crop_x = options.crop_x ? options.crop_x : ''
        params.crop_y = options.crop_y ? options.crop_y : ''
        params.crop_width = options.crop_width ? options.crop_width : ''

        this.call('photos.getChatUploadServer', params, (error, response) => {
            if (error) {
                return callback(error, undefined)
            }

            this.getUploadStream([data], stream => {
                this.upload(response.upload_url, {
                    file: stream[0]
                }, resp => {
                    if (resp.error) {
                        return callback(error, undefined)
                    }

                    this.call('messages.setChatPhoto', {
                        file: resp.response
                    }, (error, response) => {
                        callback(error, response)
                    })
                })
            })
        }, token)
    }

    uploadMarketPhoto(data, options = {}, callback = this.default_callback, token) {
        const params = {}

        params.group_id = options.group_id ? options.group_id : ''
        params.main_photo = options.main_photo ? 1 : 0
        params.crop_x = options.crop_x ? options.crop_x : ''
        params.crop_y = options.crop_y ? options.crop_y : ''
        params.crop_width = options.crop_width ? options.crop_width : ''

        this.call('photos.getMarketUploadServer', params, (error, response) => {
            if (error) {
                return callback(error, undefined)
            }

            this.getUploadStream([data], stream => {
                this.upload(response.upload_url, {
                    file: stream[0]
                }, resp => {
                    if (resp.error) {
                        return callback(error, undefined)
                    }

                    this.call('photos.saveMarketPhoto', {
                        group_id: options.group_id,
                        hash: resp.hash,
                        photo: resp.photo,
                        server: resp.server,
                        crop_data: resp.crop_data,
                        crop_hash: resp.crop_hash
                    }, (error, response) => {
                        callback(error, response)
                    })
                })
            })
        }, token)
    }

    uploadMarketAlbumPhoto(data, options = {}, callback = this.default_callback, token) {
        const params = {}

        params.group_id = options.group_id ? options.group_id : ''

        this.call('photos.getMarketAlbumUploadServer', params, (error, response) => {
            if (error) {
                return callback(error, undefined)
            }

            this.getUploadStream([data], stream => {
                this.upload(response.upload_url, {
                    file: stream[0]
                }, resp => {
                    if (resp.error) {
                        return callback(error, undefined)
                    }

                    this.call('photos.saveMarketAlbumPhoto', {
                        group_id: options.group_id,
                        hash: resp.hash,
                        photo: resp.photo,
                        server: resp.server
                    }, (error, response) => {
                        callback(error, response)
                    })
                })
            })
        }, token)
    }

    uploadAudio(data, options = {}, callback = this.default_callback, token) {
        const params = {}

        params.artist = options.artist ? options.artist : ''
        params.title = options.title ? options.title : ''

        this.call('audio.getUploadServer', params, (error, response) => {
            if (error) {
                return callback(error, undefined)
            }

            this.getUploadStream([data], stream => {
                this.upload(response.upload_url, {
                    file: stream[0]
                }, resp => {
                    if (resp.error) {
                        return callback(error, undefined)
                    }

                    this.call('audio.save', {
                        artist: options.artist,
                        title: options.title,
                        server: resp.server,
                        audio: resp.audio,
                        hash: resp.hash
                    }, (error, response) => {
                        callback(error, response)
                    })
                })
            })
        }, token)
    }

    uploadVideo(data, options = {name: 'No name'}, callback = (error, response, upload) => {
        this.default_logger(error, response)
        upload(this.default_logger)
    }, token) {
        const params = {}

        params.name = options.name ? options.name : ''
        params.description = options.description ? options.description : ''
        params.is_private = options.is_private ? options.is_private : ''
        params.wallpost = options.wallpost ? options.wallpost : ''
        params.link = options.link ? options.link : ''
        params.group_id = options.group_id ? options.group_id : ''
        params.album_id = options.album_id ? options.album_id : ''
        params.privacy_view = options.privacy_view ? options.privacy_view : ''
        params.privacy_comment = options.privacy_comment ? options.privacy_comment : ''
        params.no_comments = options.no_comments ? options.no_comments : ''
        params.repeat = options.repeat ? options.repeat : ''

        this.call('video.save', params, (error, response) => {
            if (error) {
                return callback(error, undefined)
            }

            const retn = {}

            for (const key in response) {
                if (key == 'upload_url') {
                    continue
                }

                retn[key] = response[key]
            }

            const upload = (upload_callback = this.default_logger) => this.getUploadStream([data], stream => {
                this.upload(response.upload_url, {
                    video_file: stream[0]
                }, resp => {
                    upload_callback(resp)
                })
            })

            callback(undefined, retn, upload)
        }, token)
    }

    uploadDocs(data, options = {}, callback = this.default_callback, token) {
        const params = {}

        params.group_id = options.group_id ? options.group_id : ''
        params.title = options.title ? options.title : ''
        params.tags = options.tags ? options.tags : ''

        this.call('docs.getUploadServer', params, (error, response) => {
            if (error) {
                return callback(error, undefined)
            }

            this.getUploadStream([data], stream => {
                this.upload(response.upload_url, {
                    file: stream[0]
                }, resp => {
                    if (resp.error) {
                        return callback(resp.error, undefined)
                    }
                    this.call('docs.save', {
                        file: resp.file,
                        title: params.title ? params.title : stream[0].path.match(/(?:.*\/)?(.*)/)[1],
                        tags: params.tags
                    }, (error, response) => {
                        callback(error, response)
                    })
                })
            })
        }, token)
    }

    uploadWallDocs(data, options = {}, callback = this.default_callback, token) {
        const params = {}

        params.group_id = options.group_id ? options.group_id : ''
        params.title = options.title ? options.title : ''
        params.tags = options.tags ? options.tags : ''

        this.call('docs.getWallUploadServer', params, (error, response) => {
            if (error) {
                return callback(error, undefined)
            }

            const upload_params = {}

            if (options.type) {
                upload_params.type = options.type
            }

            this.getUploadStream([data], stream => {
                upload_params.file = stream[0]

                this.upload(response.upload_url, upload_params, resp => {
                    if (resp.error) {
                        return callback(resp.error, undefined)
                    }
                    this.call('docs.save', {
                        file: resp.file,
                        title: params.title ? params.title : stream[0].path.match(/(?:.*\/)?(.*)/)[1],
                        tags: params.tags
                    }, (error, response) => {
                        callback(error, response)
                    })
                })
            })
        }, token)
    }

    uploadMessagesDocs(data, options = {}, callback = this.default_callback, token) {

        // Wait until the method is released :)

    }

    uploadOwnerCoverPhoto(data, options = {}, callback = this.default_callback, token) {
        const params = {}

        params.group_id = options.group_id ? options.group_id : ''
        params.crop_x = options.crop_x ? options.crop_x : ''
        params.crop_y = options.crop_y ? options.crop_y : ''
        params.crop_x2 = options.crop_x2 ? options.crop_x2 : ''
        params.crop_y2 = options.crop_y2 ? options.crop_y2 : ''

        this.call('photos.getOwnerCoverPhotoUploadServer', params, (error, response) => {
            if (error) {
                return callback(error, undefined)
            }

            this.getUploadStream([data], stream => {
                this.upload(response.upload_url, {
                    photo: stream[0]
                }, resp => {
                    if (resp.error) {
                        return callback(error, undefined)
                    }

                    this.call('photos.saveOwnerCoverPhoto', {
                        hash: resp.hash,
                        photo: resp.photo
                    }, (error, response) => {
                        callback(error, response)
                    })
                })
            })
        }, token)
    }

    getDialogs(options = {}, callback, token) {
        let peer_ids = [], _offset = 0, r_count

        const part = (offset = 0) => this.call('messages.getDialogs', {
            count: 200,
            offset: offset
        }, (error, response) => {
            if (error) {
                return callback(error, undefined)
            }

            if (r_count === undefined) {
                r_count = response.count
            }

            for (const o of response.items) {
                if (o.message.chat_id) {
                    peer_ids.push(2e9+o.message.chat_id)
                } else {
                    peer_ids.push(o.message.user_id)
                }
            }

            if (peer_ids.length < r_count) {
                _offset += 200

                part(_offset)
            } else {
                callback(undefined, peer_ids)
            }
        })
        
        part()
    }

    getGroupMembers(group_id, params = {}, callback, token) {
        let items = [], _offset = 0, r_count

        const part = (offset = 0) => this.call('groups.getMembers', {
            count: 1000,
            offset: offset,
            group_id
        }, (error, response) => {
            if (error) {
                return callback(error, undefined)
            }

            if (r_count === undefined) {
                r_count = response.count
            }

            for (const o of response.items) {
                if (typeof o == 'object') {
                    items.push(o.id)
                } else {
                    items.push(o)
                }
            }

            if (items.length < r_count) {
                _offset += 1000

                part(_offset)
            } else {
                callback(undefined, items)
            }
        })
        
        part()        
    }
}