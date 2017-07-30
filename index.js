var express = require('express')
var app = express()
var request = require('request-promise-native')
var semver = require('semver');
var https = require('https')

// respond with "hello world" when a GET request is made to the homepage
app.get('/:author/:repo', function (req, res) {
    request("https://github.com/" + req.params.author + "/" + req.params.repo + "/raw/master/package.json").then(
        (json) => {
            sendResult(JSON.parse(json).dependencies,res)
        }
    ).catch(
        (reason) => {
            res.send("can't parse package.json in master branch of repository https://github.com/" + req.params.author + "/" + req.params.repo)
        }
    )
})

function sendResult(dependencies,res) {
    var outdated = 0
    var upToDate = 0
    var requests = []
    var currentVersions = []
    for (var depName in dependencies) {
        requests.push(request("https://registry.npmjs.org/" + depName))
        currentVersions.push(dependencies[depName])
    }
    Promise.all(requests).then(
        (results) => {
        try {
            for (var i = 0; i < results.length; i++) {
                if (semver.satisfies(JSON.parse(results[i])["dist-tags"].latest,currentVersions[i])) {
                    upToDate += 1
                } else {
                    outdated += 1
                }
            }
        } catch (e) {
            console.log(e)
        }
        res.type("image/svg+xml")
        res.send('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="400" height="180">' +
                '<rect fill="red" x="0" y="0" width="100" height="30"></rect>' +
                '<rect fill="green" x="0" y="30" width="100" height="30"></rect>' +
                '<text filterred="url(#solid)" x="0" y="20">Outdated:' + outdated + "</text>" +
                '<text filtergreen="url(#solid)" x="0" y="50">Up to date:' + upToDate + "</text>" +
            "</svg>")
    }).catch(
        () => {
            res.send("Problem with dependencies fetching")
        }
    )
}

app.listen(3000);
