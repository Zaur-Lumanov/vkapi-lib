const request = require('request')

const OAUTH_URL = 'oauth.vk.com'

const CLIENT_ID = 3140623
const CLIENT_SECRET = 'VeWdmVclDCtn6ihuP1nt'
const VERSION = 5.68
const SCOPE = 'status,friends,photos,audio,video,docs,notes,pages,wall,groups,notifications,messages,market'
const GRANT = 'password'
const P_OAUTH_URL = 'api.vk.com/oauth/token'

module.exports = class {
    password(login, password, callback) {
        request.get({
            uri: `https://${P_OAUTH_URL}`, 
            qs: {
                username: login,
                password: password,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: GRANT,
                scope: SCOPE,
                v: VERSION
            }, 
            json: true
        }, function (error, response, body) {
            callback(body)
        })
    }

    acf(client_id, client_secret, redirect_uri, code, callback = console.log) {
        request.get({
            uri: `https://${OAUTH_URL}/access_token`, 
            qs: {
                client_id,
                client_secret,
                redirect_uri,
                code,
                v: VERSION
            }, 
            json: true
        }, function (error, response, body) {
            callback(body)
        })        
    }

    ccf(client_id, client_secret, grant_type, callback = console.log) {
        request.get({
            uri: `https://${OAUTH_URL}/access_token`, 
            qs: {
                client_id,
                client_secret,
                grant_type,
                v: VERSION
            }, 
            json: true
        }, function (error, response, body) {
            callback(body)
        })       
    }
}