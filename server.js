const fs = require('fs');
const http = require('http');
const path = require('path');

const bodyParser = require('body-parser');
const connect = require('connect');
const cookieSession = require('cookie-session')
const lodash = require('lodash');
const mustache = require('mustache');
const serveStatic = require('serve-static');
const expand_home_dir = require('expand-home-dir')

const config = require('./config')
const validate_response = require('./_0_validate_response')

const PORT = (process.argv[2] ? parseInt(process.argv[2]) : 3010)


const app = connect();

app.use(cookieSession({keys: ['auth_token']}));
app.use(bodyParser.urlencoded({extended: false}));

function render_page(req, res, page, page_data) {
  const template_html = fs.readFileSync(`page-templates/${page}.html`, 'utf8')
  const response_string = mustache.render(template_html, page_data)
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html')
  res.end(response_string)
}

// respond to all requests

let form_responses = []
const RESPONSES_PATH = expand_home_dir('~/list-problems.json')
if(fs.existsSync(RESPONSES_PATH)) {
  const responses_json = fs.readFileSync(RESPONSES_PATH, 'utf8')
  form_responses = JSON.parse(responses_json)
}

app.use(function(req, res, next) {
  const ip_address = req.connection.remoteAddress
  console.log(`${new Date().toUTCString()} request from: ${ip_address}, ${req.url}`)
  const url = req.url.split('?')[0]

  if(req.method == 'POST') {
    if(req.url == '/submit-response') {
      const is_error = validate_response.validate_response(req)
      if(is_error)
        res.writeHead(302, {'Location': `/form`})
      else {
        req.session.submitted_response = true
        form_responses.splice(0, 0, req.body)
        req.session.form_items = null
        fs.writeFileSync(RESPONSES_PATH, JSON.stringify(form_responses, null, 2))
        res.writeHead(302, {'Location': `/responses`})
      }

      res.end()
    }
    else {
      res.statusCode = 404
      res.end()
    }
  }
  else {
    if(url == '/')
      render_page(req, res, 'index', {})
    else if(url == '/form') {
      if(!req.session.form_items) {
        req.session.form_items = []
        const form_items = lodash.cloneDeep(config.QUESTION_DATA)
        for(let i = 0; i < form_items.length; i++) {
          req.session.form_items.push(form_items[i])
          form_items[i].error_str = null
          form_items[i].answer = null
        }
      }

      render_page(req, res, 'form', {form_items: req.session.form_items})
    }
    else if(url == '/responses') {
      if(req.session.submitted_response)
        render_page(req, res, 'responses', {form_responses: form_responses})
      else {
        res.writeHead(302, {'Location': `/form`})
        res.end()
      }
    }
    else {
      // static file
      next()
      return
    }
  }
});

const static = serveStatic('static')
app.use(function(req, res, next) {
  static(req, res, next)
})

console.log(`listening on port ${PORT}...`)
http.createServer(app).listen(PORT)
