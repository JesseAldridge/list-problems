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

const PORT = (process.argv[2] ? parseInt(process.argv[2]) : 3010)

const QUESTION_DATA = [
  {
    label: "Please describe a major problem you have:",
    name: 'problem',
    placeholder: "I don't like having to...",
  },
  {
    label: "1. What's the hardest part about doing this thing?",
    name: 'hardest',
    placeholder: "I have to deal with...",
  },
  {
    label: "2. Tell me about the last time you encountered this problem...",
    name: 'last_time',
    placeholder: "Last month I had to..."
  },
  {
    label: "3. Why was that hard?",
    name: 'why_hard',
    placeholder: "It was hard because..."
  },
  {
    label: "4. What, if anything, have you done to try and solve this problem?",
    name: 'what_done',
    placeholder: "I tried using..."
  },
  {
    label: "5. What don't you love about the solutions that you've tried?",
    name: 'no_love',
    placeholder: "I don't like the way..."
  },
]


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
      let is_error = false
      for(let i in QUESTION_DATA) {
        let answer = req.session.form_items[i].answer = (req.body[QUESTION_DATA[i].name] || '')

        let error_str = null
        if(answer.length == 0) {
          is_error = true
          error_str = 'Please answer this question'
        }
        else if(answer.length < 19) {
          is_error = true
          error_str = 'Please write a longer answer'
        }
        req.session.form_items[i].error_str = error_str
      }

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
        const form_items = lodash.cloneDeep(QUESTION_DATA)
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
