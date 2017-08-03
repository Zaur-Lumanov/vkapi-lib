let request = require('request')

module.exports = class {
    constructor(error_handler) {
        this.error_handler = error_handler
        this.headers = {}
        this.options = {}
    }

    set_error_handler(error_handler) {
        this.error_handler = error_handler
    }

    set_default_option(key, value) {
        this.options = key, value
    }

    set_default_header(key, value) {
        this.headers[key] = value
    }

    proxy(value) {
        request = request.defaults({'proxy': value})
    }

    mod(options) {
        if (!options || typeof options != 'object') {
            options = {}
        }

        for (const key in this.options) {
            if (!options[key] && this.options[key]) {
                options[key] = this.options[key]
            }
        }

        if (!options.headers || typeof options != 'object') {
            options.headers = {}
        }

        for (const key in this.headers) {
            if (!options.headers[key] && this.headers[key]) {
                options.headers[key] = this.headers[key]
            }
        }

        return options
    }

    request() {
        let run, length = arguments.length

        switch (length) {
            case 1: {
                const type = typeof arguments[0]

                if (type == 'object') {
                    arguments[0] = this.mod(arguments[0])
                }

                run = () => request(arguments[0])

                break
            }
            
            case 2: {
                const type = typeof arguments[0]

                if (type == 'object') {
                    arguments[0] = this.mod(arguments[0])
                }

                run = () => request(arguments[0], arguments[1])

                break
            }

            case 3: {
                const type = typeof arguments[1]

                if (type == 'object') {
                    arguments[1] = this.mod(arguments[1])
                }

                run = () => request(arguments[0], arguments[1], arguments[2])

                break                
            }
        }

        try {
            return run()
        } catch (e) {
            if (!this.error_handler) {
                throw e
            } else {
                this.error_handler(e)
            }
        }
    }
}