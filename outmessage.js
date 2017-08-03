module.exports = class {
    constructor(self, token) {
        this.attach_count = 0
        this.message_text = ''
        this.attachments = []
        this.forward_messages = []

        this.__proto__.self = self
        this.__proto__.token = token
        this.__proto__.callback = () => {}
        this.__proto__.wait = 0
    }

    text(text, connect = false) {
        if (connect) {
            this.message_text += text.toString()
        } else {
            this.message_text = text.toString()
        }

        return this
    }

    photo() {
        for (const photo of arguments) {
            let data = photo.match(/photo\d+_\d+(?:_[\d\w]+)?/gm)

            if (data) {
                for (let o of data) {
                    if (this.attach_count < 10) {
                        if (o.substr(0,5) != 'photo') {
                            o = `photo${o}`
                        }

                        this.attachments.push(o)
                    }
                }
            } else {
                if (this.attach_count < 10) {
                    this.__proto__.wait++
                    this.__proto__.self.uploadMessagesPhoto(photo, (error, response) => {
                        if (error) {
                            return this.__proto__.self.default_error_handler(error)
                        }

                        this.attachments.push(`photo${response[0].owner_id}_${response[0].id}`)
                        this.__proto__.wait--
                        this.__proto__.callback()
                    }, this.__proto__.token)
                }
            }
        }

        return this
    }

    video() {
        for (const video of arguments) {
            let data = video.match(/video\d+_\d+(?:_[\d\w]+)?/gm)

            if (data) {
                for (let o of data) {
                    if (this.attach_count < 10) {
                        if (o.substr(0,5) != 'video') {
                            o = `video${o}`
                        }

                        this.attachments.push(o)
                    }
                }
            } else {
                if (this.attach_count < 10) {
                    this.__proto__.wait++
                    this.__proto__.self.uploadVideo(video, {
                        preview: 1,
                        thumb_upload: 1,
                        target: 'messages'
                    }, (error, response, upload) => {
                        if (error) {
                            return this.__proto__.self.default_error_handler(error)
                        }

                        this.attachments.push(`video${response.owner_id}_${response.video_id}_${response.access_key}`)
                        upload(this.__proto__.self.default_logger)
                        this.__proto__.wait--
                        this.__proto__.callback()
                    }, this.__proto__.token)
                }
            }
        }

        return this
    }

    audio() {
        for (const audio of arguments) {
            const audio_params = {}

            if (typeof audio == 'object') {
                const _audio = audio.path

                audio_params.title = audio.title
                audio_params.artist = audio.artist
                audio = _audio
            }

            let data = audio.match(/audio\d+_\d+(?:_[\d\w]+)?/gm)

            if (data) {
                for (let o of data) {
                    if (this.attach_count < 10) {
                        if (o.substr(0,5) != 'audio') {
                            o = `audio${o}`
                        }

                        this.attachments.push(o)
                    }
                }
            } else {
                if (this.attach_count < 10) {
                    this.__proto__.wait++
                    this.__proto__.self.uploadAudio(audio, audio_params, (error, response) => {
                        if (error) {
                            return this.__proto__.self.default_error_handler(error)
                        }

                        this.attachments.push(`audio${response.owner_id}_${response.id}`)
                        this.__proto__.wait--
                        this.__proto__.callback()
                    }, this.__proto__.token)
                }
            }
        }

        return this        
    }

    doc() {
        for (const doc of arguments) {
            const doc_params = {}

            if (typeof doc == 'object') {
                const _doc = doc.path

                doc_params.title = doc.title
                doc_params.tags = doc.tags
                doc = _doc
            }

            let data = doc.match(/doc\d+_\d+(?:_[\d\w]+)?/gm)

            if (data) {
                for (let o of data) {
                    if (this.attach_count < 10) {
                        if (o.substr(0,3) != 'doc') {
                            o = `doc${o}`
                        }

                        this.attachments.push(o)
                    }
                }
            } else {
                if (this.attach_count < 10) {
                    this.__proto__.wait++
                    this.__proto__.self.uploadDocs(doc, doc_params, (error, response) => {
                        if (error) {
                            return this.__proto__.self.default_error_handler(error)
                        }

                        this.attachments.push(`doc${response[0].owner_id}_${response[0].id}`)
                        this.__proto__.wait--
                        this.__proto__.callback()
                    }, this.__proto__.token)
                }
            }
        }

        return this
    }

    voice() {
        for (const doc of arguments) {
            const doc_params = {}

            let data = doc.match(/doc\d+_\d+(?:_[\d\w]+)?/gm)

            if (data) {
                for (let o of data) {
                    if (this.attach_count < 10) {
                        if (o.substr(0,3) != 'doc') {
                            o = `doc${o}`
                        }

                        this.attachments.push(o)
                    }
                }
            } else {
                if (this.attach_count < 10) {
                    this.__proto__.wait++
                    this.__proto__.self.uploadDocs(doc, {
                        title: 'audio_message.opus',
                        type: 'audio_message'
                    }, (error, response) => {
                        if (error) {
                            return this.__proto__.self.default_error_handler(error)
                        }

                        this.attachments.push(`doc${response[0].owner_id}_${response[0].id}`)
                        this.__proto__.wait--
                        this.__proto__.callback()
                    }, this.__proto__.token)
                }
            }
        }

        return this
    }

    graffiti() {
        for (const doc of arguments) {
            const doc_params = {}

            let data = doc.match(/doc\d+_\d+(?:_[\d\w]+)?/gm)

            if (data) {
                for (let o of data) {
                    if (this.attach_count < 10) {
                        if (o.substr(0,3) != 'doc') {
                            o = `doc${o}`
                        }

                        this.attachments.push(o)
                    }
                }
            } else {
                if (this.attach_count < 10) {
                    this.__proto__.wait++
                    this.__proto__.self.uploadDocs(doc, {
                        type: 'graffiti'
                    }, (error, response) => {
                        if (error) {
                            return this.__proto__.self.default_error_handler(error)
                        }

                        this.attachments.push(`doc${response[0].owner_id}_${response[0].id}`)
                        this.__proto__.wait--
                        this.__proto__.callback()
                    }, this.__proto__.token)
                }
            }
        }

        return this
    }

    wall(post) {
        let data = post.match(/wall\d+_\d+(?:_[\d\w]+)?/gm)

        if (data) {
            for (let o of data) {
                if (this.attach_count < 10) {
                    if (o.substr(0,4) != 'wall') {
                        o = `wall${o}`
                    }

                    this.attachments.push(o)
                }
            }
        }

        return this
    }

    market(product) {
        let data = product.match(/(market|product)\d+_\d+(?:_[\d\w]+)?/gm)

        if (data) {
            for (let o of data) {
                if (this.attach_count < 10) {
                    o = o.replace(/[a-z]+/, 'market')

                    if (o.substr(0,6) != 'market') {
                        o = `market${o}`
                    }

                    this.attachments.push(o)
                }
            }
        }

        return this
    }

    product(product) {
        return this.product(product)
    }

    story(story) {
        let data = story.match(/story\d+_\d+(?:_[\d\w]+)?/gm)

        if (data) {
            for (let o of data) {
                if (this.attach_count < 10) {
                    if (o.substr(0,4) != 'story') {
                        o = `story${o}`
                    }

                    this.attachments.push(o)
                }
            }
        }

        return this
    }

    geo(lat, long) {
        this.lat = lat
        this.long = long

        return this
    }

    forward() {
        const type = typeof message

        for (const message of arguments) {
            if (type == 'object') {
                for (const _message of message) {
                    this.forward_messages.push(_message)
                }
            } else if (type == 'string') {
                const messages = message.match(/\d+/g)

                for (const _message of messages) {
                    this.forward_messages.push(_message)
                }
            } else {
                this.forward_messages.push(message)
            }
        }

        return this
    }

    send(sender) {
        this.__proto__.callback = () => {
            if (this.__proto__.wait) {
                return
            }

            const options = {}

            if (typeof sender == 'object') {
                if (sender.peer_id) {
                    sender = sender.peer_id
                }
            }

            const token = options.token

            options.message = this.message_text
            options.peer_id = sender
            options.forward_messages = this.forward_messages.join(',')
            options.attachment = this.attachments.join(',')

            options.lat = this.lat
            options.long = this.long

            this.__proto__.self.call('messages.send', options, () => {}, this.__proto__.token)
        }

        if (!this.__proto__.wait) {
            this.__proto__.callback()
        }
    }
}