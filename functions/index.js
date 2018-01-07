const functions = require('firebase-functions')
const request = require('request')
const express = require('express')
const fs = require('fs')
const path = require('path')
const index = fs.readFileSync(path.join(__dirname, './dist/index.html'), 'utf8')
const app = express()

// Default 
const BASE_URL_API = 'https://gat-dev-improvement.azurewebsites.net/api/'
const BASE_IMAGE_URL_API = BASE_URL_API + 'common/get_image/';
const BASE_URL = "https://gatbook.org/";
const BASE_IMAGE_URL = 'https://www.flickr.com/photos/148671066@N06/27775659239/';

const DEFAULT_SITE_NAME = "GaT - Give and Take the Book";
const DEFAULT_DESCRIPTION = 'Ứng dụng trao đổi, mượn sách miễn phí dựa trên nền tảng của ý thức và sự tin tưởng.';

// Url Page
const URL_BOOK_DETAIL = '/books/';
const URL_USER_VISITOR = '/user-visitor/';

const BASE_DATA = {
  title: DEFAULT_SITE_NAME,
  url: BASE_URL,
  imageURL: BASE_IMAGE_URL,
  description: DEFAULT_DESCRIPTION
}

// Format
const PARAM_01 = '{0}'
const PARAM_02 = '{1}'
const DESCRIPTION_USER = 'Description: Đang chia sẻ ' + PARAM_01 + ' quyển sách.\nĐịa chỉ : ' + PARAM_02;

// api
const api_get_book_info = 'book/get_book_info?editionId=' + PARAM_01
const api_get_user_public_info = 'user/get_user_public_info?userId=' + PARAM_01

var currentRequest = null;
var currentResponse = null;
var strReplaceMetaData = '<title>GaT - Give and Take the Book</title>';

app.use('/static', express.static(path.join(__dirname, './dist/static')))

app.get('**', (req, res) => {
  currentRequest = req;
  currentResponse = res;
  userAgent = currentRequest.headers['user-agent'];

  // Check request from facebook or twitter
  var isFacebook = userAgent.indexOf('facebook') > -1;
  var isTwitter = userAgent.indexOf('twitter') > -1;
  console.log('Request link: ' + currentRequest.path);
  console.log('User Agent: ' + userAgent);
  if (isFacebook || isTwitter) {
    const splitPath = currentRequest.path.split('/');
    // Request Book Detail Page
    if (currentRequest.path.indexOf(URL_BOOK_DETAIL) > -1) {
      console.log('Call API Book detail');
      const postId = splitPath[2];
      request(BASE_URL_API + api_get_book_info.replace(PARAM_01, postId), handlingRequestBookDetail);
    } else if (currentRequest.path.indexOf(URL_USER_VISITOR) > -1) { // Request User Visitor Page
      console.log('Call API User');
      const postId = splitPath[2];
      request(BASE_URL_API + api_get_user_public_info.replace(PARAM_01, postId), handlingRequestUser);
    } else {
      console.log('Display base meta data');
      res.status(200).send(buildHtmlWithPost(BASE_DATA, index))
    }
  } else {
    var isMobile = {
      android: function() {
        return /android/i.test(userAgent);
      },
      iOS: function() {
        return /iphone/i.test(userAgent);
      }
    };

    console.log("IOS: " + isMobile.iOS() + "-- Android: " + isMobile.android())
    // If use mobile device, go to store
    if (isMobile.iOS()) {
      console.log("Mo IOS Store");
      res.redirect('https://itunes.apple.com/vn/app/gat/id1230316898?mt=8');
    } else if (isMobile.android()) {
      console.log("Mo Android Store");
      res.redirect('https://play.google.com/store/apps/details?id=com.gat');
    } else {
      res.status(200).send(buildHtmlWithPost(BASE_DATA, index))
    }
  }
})

function handlingRequestBookDetail(error, response, body) {
  if (!error && response.statusCode == 200) {
    var jsonData = JSON.parse(body);
    var data = jsonData.data.resultInfo;
    console.log('Response of API:');
    console.log(data);
    data.url = (BASE_URL + currentRequest.path).replace("//", "/");
    data.imageURL = BASE_IMAGE_URL_API + data.imageId;
    currentResponse.status(200).send(buildHtmlWithPost(data, index))
  } else {
    console.log('call api is failed')
    currentResponse.status(200).send(buildHtmlWithPost(BASE_DATA, index))
  }
}

function handlingRequestUser(error, response, body) {
  if (!error && response.statusCode == 200) {
    var jsonData = JSON.parse(body);
    var data = jsonData.data.resultInfo;
    console.log('Response of API:');
    console.log(data);
    data.url = (BASE_URL + currentRequest.path).replace("//", "/");
    data.imageURL = BASE_IMAGE_URL_API + data.imageId;
    data.title = data.name;
    data.description = DESCRIPTION_USER.replace(PARAM_01, data.sharingCount);
    // Check user does not have address
    if (data.usuallyLocation.length == 0 || null == data.usuallyLocation[0].address || "" == data.usuallyLocation[0].address.trim()) {
      data.description = data.description.replace(PARAM_02, 'Chưa xác định');
    } else {
      data.description = data.description.replace(PARAM_02, data.usuallyLocation[0].address);
    }
    currentResponse.status(200).send(buildHtmlWithPost(data, index))
  } else {
    console.log('call api is failed')
    currentResponse.status(200).send(buildHtmlWithPost(BASE_DATA, index))
  }
}

function buildHtmlWithPost(data, indexHtml) {
  if (isNullOrEmpty(data.title)) {
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
        property: 'og:image:alt',
        content: data.title
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
  console.log('meta data: ');
  console.log(stringMetaHTML);
  return indexHtml.replace(strReplaceMetaData, stringMetaHTML);
}

function isNullOrEmpty(str) {
  return null == str || "" == str;
}

exports.books = functions.https.onRequest(app);