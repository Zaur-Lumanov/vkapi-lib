module.exports = class {
    constructor(data, self, token) {
        this.id = data[1]
        this.flags = data[2]
        this.peer_id = data[3]
        this.ts = data[4]
        this.text = data[5]
        this.attachments = data[6]
        this.random_id = data[7]
        this.sender_id = data[6].from ? +data[6].from : data[3]
        this.out = !!(data[2]&2)

        this.__proto__.self = self
        this.__proto__.token = token
    }

    read() {
        this.__proto__.self.call('messages.markAsRead', {
            message_ids: this.id
        }, () => {}, this.__proto__.token)

        return this
    }

    delete() {
        this.__proto__.self.call('messages.delete', {
            message_ids: this.id
        }, () => {}, this.__proto__.token)

        return this        
    }

    spam() {
        this.__proto__.self.call('messages.delete', {
            message_ids: this.id,
            spam: 1
        }, () => {}, this.__proto__.token)

        return this        
    }

    restore() {
        this.__proto__.self.call('messages.restore', {
            message_id: this.id
        }, () => {}, this.__proto__.token)

        return this
    }

    getMedia(callback = this.__proto__.self.default_callback) {
        this.__proto__.self.call('messages.getById', {
            message_ids: this.id
        }, (error, response) => {
            if (error) {
                return callback(error, undefined)
            }

            if (response.items.length) {
                const media = {}

                for (const key in response.items[0]) {
                    if (key.match(/^photo_\d+/)) {
                        media[key] = response.items[0][key]

                        continue
                    }

                    switch (key) {
                        case 'read_state':
                        case 'chat_id':
                        case 'chat_active':
                        case 'users_count':
                        case 'admin_id':
                        case 'push_settings':
                        case 'geo': {
                            media[key] = response.items[0][key]

                            break
                        }

                        case 'attachments': {
                            const attachments = []

                            for (const o of response.items[0]['attachments']) {
                                const attachment = {
                                    type: o.type
                                }

                                for (const _key in o[attachment.type]) {
                                    attachment[_key] = o[attachment.type][_key]
                                }

                                if (attachment.type == 'sticker') {
                                    attachment.item = `sticker${attachment.id}`    
                                } else {
                                    attachment.item = `${attachment.type}${attachment.owner_id ? attachment.owner_id : attachment.from_id}_${attachment.id}`

                                    if (attachment.access_key) {
                                        attachment.item += `_${attachment.access_key}`
                                    }
                                }

                                attachments.push(attachment)
                            }

                            media['attachments'] = attachments

                            break                           
                        }
                    }
                }

                callback(undefined, media)
            }
        }, this.__proto__.token)
        
        return this
    }
}