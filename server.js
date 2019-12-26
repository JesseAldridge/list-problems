const fs = require('fs');
const http = require('http');
const path = require('path');

const bodyParser = require('body-parser');
const connect = require('connect');
const cookieSession = require('cookie-session')
const lodash = require('lodash');
const mustache = require('mustache');
const serveStatic = require('serve-static');
const shell = require('shelljs');
const expand_home_dir = require('expand-home-dir')
const glob = require('glob')

const PORT = (process.argv[2] ? parseInt(process.argv[2]) : 3010)

const QUESTIONS = [
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
    placeholder: "This happened last..."
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
if(fs.existsSync('form-responses.json')) {
  const responses_json = fs.readFileSync('form-responses.json', 'utf8')
  form_responses = JSON.parse(responses_json)
}

app.use(function(req, res, next) {
  const ip_address = req.connection.remoteAddress
  console.log(`${new Date().toUTCString()} request from: ${ip_address}, ${req.url}`)
  const url = req.url.split('?')[0]

  if(req.method == 'POST') {
    if(req.url == '/submit-response') {
      req.session.response_objs = []
      req.session.is_error = false
      for(let i in QUESTIONS) {
        const response_obj = {
          response_str: req.body[QUESTIONS[i].name] || '',
          error_str: null,
        }
        req.session.response_objs.push(response_obj)
        if(response_obj.response_str.length == 0) {
          req.session.is_error = true
          response_obj.error_str = 'Please answer this question'
        }
        else if(response_obj.response_str.length < 30) {
          req.session.is_error = true
          response_obj.error_str = 'Please write a longer answer'
        }
      }

      if(req.session.is_error)
        res.writeHead(302, {'Location': `/form`})
      else {
        form_responses.splice(0, 0, req.body)
        fs.writeFileSync('form-responses.json', JSON.stringify(form_responses, null, 2))
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
      const questions = lodash.cloneDeep(QUESTIONS)
      const response_objs = req.session.response_objs || []
      for(let i = 0; i < response_objs.length; i++)
        questions[i].response_obj = response_objs[i]

      render_page(req, res, 'form', {questions: questions})
    }
    else if(url == '/responses') {
      render_page(req, res, 'responses', {form_responses: form_responses})
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
