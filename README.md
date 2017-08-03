# vkapi-lib

[![npm package](https://nodei.co/npm/vkapi-lib.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/vkapi-lib/)

Библиотека для работы с [VK API](https://vk.com/dev).

## Содержание

- [Установка](#Установка)
   - [Методы](#Методы)
   - [Инитализация с токеном](#Инитализация-с-токеном)
   - [Авторизация по логину и паролю](#Авторизация-по-логину-и-паролю)
   - [Authorization Code Flow](#authorization-code-flow-user--group)
   - [Получение сервисного ключа доступа](#Получение-сервисного-ключа-доступа-client-credentials-flow)
- [Вызов метода](#Вызов-метода-vk-api)
- [Лонгполл](#Лонгполл)
   - [Событие: новое сообщение](#Событие-новое-сообщение)
- [Отправка сообщения](#Отправка-сообщения)
   - [Отправка стикера](#Отправка-стикера)
- [Методы загрузки медиа](#Методы-загрузки-медиа-подробнее)
- [Объект message](#Объект-message)
   - [Методы объекта message](#Методы-объекта-message)
   - [Пример передаваемых getMedia данных в callback](#Пример-передаваемых-getmedia-данных-в-callback)
- [Конструктор сообщений](#Конструктор-сообщений)
   - [Методы](#Методы-1)
 
## Установка

```
npm install vkapi-lib
```

Подключение в проект: 

```javascript
const vk = require('vkapi-lib')
```

## Методы

### Инитализация с токеном

```javascript
const API = new vk.API('ключ доступа')
```

В конструкторе можно указывать неограниченное число токенов (каждый токен как отдельный агрумент)

```javascript
const API = new vk.API('ключ доступа1', 'ключ доступа2')
```

### Авторизация по логину и паролю

```javascript
let API

auth.password('login', 'password', resp => {
    if (resp.error) {
        return console.log(resp.error)
    }
    
    API = new vk.API(resp.access_token)
})
```

### Authorization Code Flow ([user](https://vk.com/dev/authcode_flow_user) | [group](https://vk.com/dev/authcode_flow_group))

```javascript
const auth = new vk.Auth

let API

auth.acf(client_id, client_secret, redirect_uri, code, resp => {
    if (resp.error) {
        return console.log(resp.error)
    }
    
    API = new vk.API(resp.access_token)
})
```

### Получение сервисного ключа доступа ([Client Credentials Flow](https://vk.com/dev/client_cred_flow))

```javascript
const auth = new vk.Auth

let API

auth.ccf(client_id, client_secret, grant_type, resp => {
    if (resp.error) {
        return console.log(resp.error)
    }
    
    API = new vk.API(resp.access_token)
})
```

### Вызов метода [VK API](https://vk.com/dev/methods)

```javascript
call(method, options = {}, callback = this.default_callback, token)
```

- `method` (string) - название метода
- `options` (object) - параметры вызова
- `callback` (function, string) - callback-функция (по умолчанию дефолтный каллбек)
- `token` (int, string) - порядковый идентификатор токена (по порядку, указанному в конструкторе) | токен в строковом формате (необязательный параметр)

Пример использования:

```javascript
API.call('users.get', {
    user_ids: 1
}, (error, response) => {
    if (error) {
        console.log(error)
    }
    
    console.log(response[0])
})

API.call('users.get', {
    user_ids: 1
}, 'console.log(error, response)')

API.call('users.get', {
    user_ids: 1
})

API.call('users.get')
```

### Лонгполл

```javascript
longpoll(callback, params, token)
```

 - `callback` (function) - callback-функция (по умолчанию дефолтный каллбек)
 - `params` (object) - параметры лонгполла
 - `token` (int, string)
 
Пример использования:

```javascript
API.longpoll(data => {
    console.log(data)
})
```

### Событие: новое сообщение

```javascript
lp_message(callback, token)
```

 - `callback` (function) - callback-функция (по умолчанию дефолтный каллбек)
 - `token` (int, string) 
 
Пример использования:

```javascript
API.lp_message(message => {
    console.log(message)
})
```
Подробнее про объект [message](#Объект-message)

### Отправка сообщения

```javascript
send(text, options, peer, callback, token)
```
 - `text` (string) - текст сообщения
 - `options` (object) - параметры отправки
 - `peer` (int, object) - адресат (user_id для пользователя, 2e9+chat_id для беседы, -group_id для сообщества) в числовом формате, либо объект сообщения, содерржащий в себе параметр `peer_id`
 - `callback` (function) - callback-функция (по умолчанию дефолтный каллбек) для возврата статуса отправления
 - `token` (int, string)
 
Пример использования:

```javascript
API.lp_message(message => {
    API.send('Example', {
        forward_messages: message.id
    }, message)
})

API.send('Example', {}, 168557207)
```

### Отправка стикера

```javascript
sticker(sticker_id, peer, callback, token)
```

 - `sticker_id` (int) - идентификатор стикера
 - `peer` (int, object) - адресат (user_id для пользователя, 2e9+chat_id для беседы, -group_id для сообщества) в числовом формате, либо объект сообщения, содерржащий в себе параметр `peer_id`
 - `callback` (function) - callback-функция (по умолчанию дефолтный каллбек) для возврата статуса отправления
 - `token` (int, string)
 
Пример использования:

```javascript
API.sticker(101, 168557207)
```

### Методы загрузки медиа ([подробнее](https://vk.com/dev/upload_files))

```javascript
// Загрузка фотографий в альбом
uploadPhoto(data, options, callback, token)

// Загрузка фотографий на стену
uploadPhotoOnWall(data, options, callback, token)

// Загрузка главной фотографии пользователя или сообщества
uploadOwnerPhoto(data, options, callback, token)

// Загрузка фотографии в личное сообщение
uploadMessagesPhoto(data, callback, token)

// Загрузка главной фотографии для чата
uploadChatPhoto(data, options, callback, token)

// Загрузка фотографии для товара
uploadMarketPhoto(data, options, callback, token)

// Загрузка фотографии для подборки товаров
uploadMarketAlbumPhoto(data, options, callback, token)

// Загрузка аудиозаписей
uploadAudio(data, options, callback, token)

// Загрузка видеозаписей
uploadVideo(data, options, callback, token)

// Загрузка документов
uploadDocs(data, options, callback, token)

// Загрузка документов на стену
uploadWallDocs(data, options, callback, token)

// Загрузка документа в личное сообщения
uploadMessagesDocs(data, options, callback, token) // в данный момент недоступно

// Загрузка обложки сообщества 
uploadOwnerCoverPhoto(data, options, callback, token)
```

 - `data` (string | array) -  путь к файлу на диске | URL
 - `options` (object) - опции загрузки
 - `callback` (function) - callback-функция (по умолчанию дефолтный каллбек) для возврата статуса отправления
 - `token` (int, string)
 
Примеы использования:

```javascript
API.uploadPhoto(['test1.jpg', 'https://nodei.co/npm/vkapi-lib.png'], {
    album_id: 169819278,
    group_id: 123396984
}, (error, response) => {
    if (error) {
        return console.log(error)
    }
    
    console.log(response)
})

API.uploadPhotoOnWall('https://nodei.co/npm/vkapi-lib.png', {
    group_id: 123396984
}, (error, response) => {
    if (error) {
        return console.log(error)
    }
    
    console.log(response)
})

API.uploadPhotoOnWall('test1.jpg', {
    group_id: 123396984
}, (error, response) => {
    if (error) {
        return console.log(error)
    }
    
    console.log(response)
})

API.uploadOwnerPhoto('test1.jpg', {
    owner_id: -123396984
}, (error, response) => {
    if (error) {
        return console.log(error)
    }
    
    console.log(response)
})

API.uploadMessagesPhoto('test1.jpg', (error, response) => {
    if (error) {
        return console.log(error)
    }
    
    console.log(response)
})

API.uploadChatPhoto('test1.jpg', {
    chat_id: 103
})

API.uploadMarketPhoto('test1.jpg', {
    group_id: -123396984,
    main_photo: true
})

API.uploadMarketAlbumPhoto('test1.jpg', {
    group_id: -123396984
})

API.uploadAudio('test.mp3', {
    artist: 'Usher feat. Lil\' Jon, Ludacris',
    title: 'Yeah!'
}, (error, response) => {
    if (error) {
        return console.log(error)
    }
    
    console.log(response)
})

API.uploadVideo('test.webm', {
    name: '.webm'
}, (error, response, upload) => {
    if (error) {
        return console.log(error)
    }
    
    console.log(response)
    
    upload(console.log)
}

API.uploadDocs('test.txt', {
    group_id: -123396984,
    title: 'Text file',
    tags: 'test, text, txt'
}, (error, response) => {
    if (error) {
        return console.log(error)
    }
    
    console.log(response)
})

API.uploadWallDocs('test.txt', {
    group_id: -123396984,
    title: 'Text file',
    tags: 'test, text, txt'
}, (error, response) => {
    if (error) {
        return console.log(error)
    }
    
    console.log(response)
})

API.uploadMessagesDocs('test.opus', {
    peer_id: 168557207,
    title: 'audio_message.opus',
    type: 'audio_message'
}, (error, response) => {
    if (error) {
        return console.log(error)
    }
    
    console.log(response)
})

API.uploadOwnerCoverPhoto('cover.png', {
    group_id: 123396984
})
```

## Объект message

 - `id` (ing) - идентификатор сообщения
 - `flags` (int) - флаги сообщения
 - `peer_id` (int) - адресат
 - `ts` (int) - время [UNIX timestamp](https://ru.wikipedia.org/wiki/UNIX-%D0%B2%D1%80%D0%B5%D0%BC%D1%8F)
 - `text` (string) - текст сообщения
 - `attachments` (object) - вложения сообщения
 - `random_id` (int) - значение `random_id`, переданное отправителем
 - `sender_id` (int) - иднтификатор отправителя
 - `out` (bool) - флаг исходящего сообщения

### Методы объекта message

```javascript
read() // пометить сообщение как прочитанное
delete() // удалить сообщение
spam() // пометить сообщение как спам
restore() // восстановить удалённое сообщение (можно в течение 5 часов после удаления)
flag(flag) // проверка флага сообщения
getMedia(callback) // получение подробного объекта вложений сообщения
```

 - `flag` (int) - флаг (объект: LP_MESSAGE_FLAGS, API.flags) ([подробнее](https://vk.com/dev/using_longpoll_2?f=4.%2B%D0%A4%D0%BB%D0%B0%D0%B3%D0%B8%2B%D1%81%D0%BE%D0%BE%D0%B1%D1%89%D0%B5%D0%BD%D0%B8%D0%B9))
 - `callback` (function) - callback-функция (по умолчанию дефолтный каллбек) для возврата статуса отправления
 
Примеы использования:

```javascript
API.lp_message(message => {
    if (!message.flag(API.flags.OUTBOX)) {
        message.getMedia((error, response) => {
            if (error) {
                return console.log(error)
            }

            console.log(response)
        })
    }
})
```
 
#### Пример передаваемых getMedia данных в callback

```javascript
read_state: 0,
  attachments:
   [ { type: 'photo',
       id: 456255039,
       album_id: -6,
       owner_id: 168557207,
       photo_75: 'https://pp.userapi.com/c638826/v638826207/4f93d/3IMgDciIdlk.jpg',
       photo_130: 'https://pp.userapi.com/c638826/v638826207/4f93e/yI5wtwl1qyw.jpg',
       photo_604: 'https://pp.userapi.com/c638826/v638826207/4f93f/f4DeBtdkj-A.jpg',
       photo_807: 'https://pp.userapi.com/c638826/v638826207/4f940/rJA41miL5Hw.jpg',
       photo_1280: 'https://pp.userapi.com/c638826/v638826207/4f941/J2gLGI92J0I.jpg',
       width: 1013,
       height: 599,
       text: '',
       date: 1498734394,
       post_id: 6223,
       item: 'photo168557207_456255039' },
     { type: 'audio',
       id: 456239534,
       owner_id: 168557207,
       artist: 'Xavier Wulf',
       title: 'Tortuga',
       duration: 158,
       date: 1492628273,
       content_restricted: 1,
       url: '',
       genre_id: 1001,
       is_hq: false,
       item: 'audio168557207_456239534' } ] }
```

## Конструктор сообщений

```javascript
message(token)
```

 - `token` (int, string)
 
### Методы

```javascript
// Задать текст сообщения
text(text, connect)

// Прикрепить изображения
photo(data...)

// Прикрепить видеозаписи
video(data...)

// Прикрепить аудизаписи
audio(data...)

// Прикрепить документы
doc(data...)

// Прикрепить голосовое сообщение (форматы: .ogg, .opus)
voice(data...)

// Прикрепить граффити (форматы: .jpg, .png, .gif)
graffiti(data...)

// Прикрепить запись на стене
wall(post...)

// Прикрепить товары
market(product...)

// Прикрепить геопозицию
geo(lat, long)

// Прикрепить сообщения
forward(message...)

// Отправить сообщение адресату
send(peer)
```

 - `text` (string) - текст сообщения
 - `connect` (bool) - задание коннектации
 - `data` (string, object) - путь к файлу на диске | URL | идентификатор в VK (переменное количество аргументов, каждое вложение заданного типа через запятую)
 - `post` (string) - идентификатор поста в VK
 - `product` (string) - идентификатор товара/магазина в VK
 - `lat` (float) - шитора на карте
 - `long` (float) - долгота на карте
 - 'message' (int, string, array) - идентификаторы сообщений для пересылки
 - `peer` (int, object) - адресат (user_id для пользователя, 2e9+chat_id для беседы, -group_id для сообщества) в числовом формате, либо объект сообщения, содерржащий в себе параметр `peer_id`
 
Пример использования:

```javascript
API.message()
    .text('Test message')
    .photo('../test.jpg', 'photo168557207_456255039')
    .video('../test.webm')
    .audio('../test.mp3')
    .doc('../test.jpg')
    .voice('../test.opus')
    .graffiti('../test.png')
    .wall('wall-47590230_48')
    .market('product-13883743_256626')
    .geo(15,15)
    .forward(5918153, '5918009, 5916431', [5918409, 5918411, 5918412])
    .send(168557207) 
 ```
