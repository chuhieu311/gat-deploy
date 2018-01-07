const express = require('express')
const fs = require('fs')
const path = require('path')
const code = fs.readFileSync(path.join(__dirname, './dist/app.js'), 'utf8')
const serverRenderer = require('vue-server-renderer')
const index = fs.readFileSync(path.join(__dirname, './dist/index.html'), 'utf8')
const app = express()
var request = require('request')

app.use('/static', express.static(path.join(__dirname, './dist/static')))

app.get('**', (req, res) => {
  // request('https://gat-webservice-v10-se.azurewebsites.net/api/book/get_book_info?editionId=16253', function (error, response, body) {
  //   if (!error && response.statusCode == 200) {
  //     console.log('Call API:')
  //     console.log(body) // Print the google web page.
  //   }
  // })
  const context = {
    url: req.url
  }
  console.log(code);
  if (serverRenderer) {
    var renderer = serverRenderer.createBundleRenderer(code);
    renderer.renderToString(
      context,
      (err, html) => {
        if (err) {
          console.log(err)
          return res.sendStatus(500)
        }
        const {
          title,
          htmlAttrs,
          bodyAttrs,
          link,
          style,
          script,
          noscript,
          meta
        } = context.meta.inject()
        console.log('meta: ' + meta.text())
        console.log('req.url ' + req.url)
        res.send(index.replace('<div id=app></div>', html))
      }
    )
  }else{
    res.status(500).send('Loi cmnr');
  }
})

app.listen(8080)
