const validate_response = require('../_0_validate_response')

function test_req(input_str) {
  const fake_req = {
    body: {
      problem: input_str,
      hardest: 'foo',
      last_time: 'foo',
      why_hard: 'foo',
      what_done: 'foo',
      no_love: 'foo',
    },
    session: {
      form_items: [
        {},
        {},
        {},
        {},
        {},
        {},
      ],
    },
  }

  validate_response.validate_response(fake_req)
  return fake_req
}

describe('validate response', function () {
  it('screens one period + many spaces', function () {
    fake_req = test_req('.                                        ')
    expect(fake_req.session.form_items[0].error_str).toEqual(
      'Error: Please write an actual answer',
    )
  });

  it('screens gibberish words', function () {
    fake_req = test_req('bla yes ok asdasda. dasdasd asd a sdas asd asd a sdf gehgfghfghf hfs')
    expect(fake_req.session.form_items[0].error_str).toEqual(
      'Would you please just take two minutes to write a proper response?'
    )
  });

  it('allows english', function () {
    fake_req = test_req('How to manage toxic people that you cannot get out of your life?')
    expect(fake_req.session.form_items[0].error_str).toEqual(
      null
    )
  });
});
