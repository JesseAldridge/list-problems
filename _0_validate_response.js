const fs = require('fs')

const config = require('./config')

function tokenize_words(text) {
  const re = /([A-Za-z'&]+)/g
  let m = null;
  const tokens = []
  do {
    m = re.exec(text)
    if(m)
      tokens.push(m[0].toLowerCase())
  } while(m)
  return tokens
}

function is_valid_response(text) {
  let english_words = 0, non_english_words = 0
  const tokens = tokenize_words(text)
  if(tokens.length < 5)
    return false
  tokens.forEach(function(word) {
    if(word_set[word])
      english_words += 1
    else
      non_english_words += 1
  })
  return english_words / non_english_words > 1
}

const words = fs.readFileSync('words.txt', 'utf8')
const word_lines = words.split('\n')
const word_set = {}
word_lines.forEach(function(word) {
  word_set[word] = true
})

function validate_response(req) {
  debugger
  let is_error = false
  for(let i in config.QUESTION_DATA) {
    let answer = req.session.form_items[i].answer = (req.body[config.QUESTION_DATA[i].name] || '')
    answer = answer.trim()

    let error_str = null
    if(answer.length == 0) {
      is_error = true
      error_str = 'Error: Please answer this question'
    }
    else if(answer.length < 19) {
      is_error = true
      error_str = 'Error: Please write an actual answer'
    }
    else if(!is_valid_response(answer)) {
      is_error = true
      error_str = 'Would you please just take two minutes to write a proper response?';
    }
    req.session.form_items[i].error_str = error_str
  }

  return is_error
}

if(typeof exports != 'undefined')
  exports.validate_response = validate_response
