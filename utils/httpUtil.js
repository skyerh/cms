const needle = require('needle')

module.exports.POST = (opts, body) => {
    var options = {
        uri: opts.url,
        method: 'POST',
        body: JSON.stringify(body),
        compressed: true,
        headers: {
            'content-Type': 'application/json'
        }
    };
    parseHeaders(options.headers, opts);
    new Promise((resolve, reject) => {
        needle('post', opts.url, body, options) .then(function(resp) {
            console.log(resp.statusCode)
            console.log(resp.data)
            resolve(resp.data)
        })
        .catch(function(err) {
            console.log(err)
            reject(err);
        });
    })
}

module.exports.GET = (opts, jsonQS) => {
    var options = {
        uri: opts.url,
        method: 'GET',
        qs: jsonQS,
        compressed: true,
        headers: {
            'content-Type': 'application/json'
        }
    };
    parseHeaders(options.headers, opts);

    return new Promise((resolve, reject) => {
        needle('get', opts.url, options) .then(function(resp) {
            resolve(resp.body)
        })
        .catch(function(err) {
            reject(err);
        });
    })
}


function parseHeaders(headers, options) {
    var heads = options.headers;
    for (var key in heads) {
        headers[key] = heads[key];
    }
}