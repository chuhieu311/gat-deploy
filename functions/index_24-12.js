const functions = require('firebase-functions')
const request = require('request')
const express = require('express')
const fs = require('fs')
const path = require('path')
const index = fs.readFileSync(path.join(__dirname, './dist/index.html'), 'utf8')
const app = express()

const BASE_URL_API = 'https://gat-dev-improvement.azurewebsites.net/api/'
const BASE_URL = "https://gat-product-ver10.firebaseapp.com/";
const api_get_book_info = 'book/get_book_info'
const BASE_IMAGE_URL_API = BASE_URL_API + 'common/get_image/';
const DEFAULT_SITE_NAME = "GaT-GIVE BOOK AND THE TAKE BOOK";
const BASE_DATA = {
  name: DEFAULT_SITE_NAME,
  title: DEFAULT_SITE_NAME,
  url: BASE_URL,
  imageURL: BASE_IMAGE_URL_API + '33358327081',
  description: DEFAULT_SITE_NAME
}

app.use('/static', express.static(path.join(__dirname, './dist/static')))

app.get('**', (req, res) => {
  // Server render if request book detail page from facebook
  if (req.headers['user-agent'].indexOf('facebook') > -1 && req.path.indexOf('/books/') > -1) {
    const splitPath = req.path.split('/');
    const postId = splitPath[2];
    request(BASE_URL_API + api_get_book_info + '?editionId=' + postId, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var jsonData = JSON.parse(body);
        var data = jsonData.data.resultInfo;
        console.log('Response of API:');
        console.log(data);
        data.url = (BASE_URL + req.path).replace("//", "/");
        data.imageURL = BASE_IMAGE_URL_API + data.imageId;
        res.status(200).send(buildHtmlWithPost(data, index))
      } else {
        console.log('call api is failed')
        res.status(200).send(buildHtmlWithPost(BASE_DATA, index))
      }
    })
  } else {
    res.status(200).send(index)
  }
})

function buildHtmlWithPost(data, indexHtml) {
  if (null == data.title || "" == data.title.trim()) {
    data.title = DEFAULT_SITE_NAME;
  }
  // Define header of web site
  var head = {
    title: data.title,
    meta: [{
        property: 'og:site_name',
        content: data.title
      },
      {
        property: 'og:title',
        content: data.title
      },
      {
        property: 'og:url',
        content: data.url
      },
      {
        property: 'og:image',
        content: data.imageURL
      },
      {
        property: 'og:description',
        content: data.description
      },
    ]
  };

  // Create html
  var stringMetaHTML = '';
  Object.keys(head).forEach(key => {
    if (typeof head[key] === 'string')
      stringMetaHTML += '<' + key + '>' + head[key] + '</' + key + '>';
    else if (Array.isArray(head[key])) {
      for (const obj of head[key]) {
        stringMetaHTML += '<' + key;
        Object.keys(obj).forEach(key2 => {
          stringMetaHTML += ' ' + key2 + '="' + obj[key2] + '"';
        });
        stringMetaHTML += '>\n';
      }
    }
  });

  return indexHtml.replace('<title>GaT-GIVE BOOK AND THE TAKE BOOK</title>', stringMetaHTML);
}

exports.books = functions.https.onRequest(app);