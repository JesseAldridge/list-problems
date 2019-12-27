const QUESTION_DATA = [
  {
    label: "Please describe a problem you have:",
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

if(typeof exports != 'undefined')
  exports.QUESTION_DATA = QUESTION_DATA
