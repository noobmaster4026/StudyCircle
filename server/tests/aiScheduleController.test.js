const assert = require('node:assert/strict');
const test = require('node:test');
const { generateSchedule, __test } = require('../controllers/aiScheduleController');

function mockResponse() {
  const res = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

test('normalizeSubjects trims labels and drops blank subjects', () => {
  const subjects = __test.normalizeSubjects({
    subjects: [{ label: '  Math  ' }, { label: '' }, { label: 'Physics' }],
  });

  assert.equal(subjects.length, 2);
  assert.equal(subjects[0].label, 'Math');
  assert.equal(subjects[1].label, 'Physics');
});

test('normalizePreferredTimes accepts only non-empty strings', () => {
  assert.deepEqual(
    __test.normalizePreferredTimes({
      preferredStudyTimes: [' Evening ', '', null, 'Weekends'],
    }),
    ['Evening', 'Weekends']
  );
});

test('normalizeDeadlines requires subject and description', () => {
  const deadlines = __test.normalizeDeadlines({
    deadlines: [
      { subject: ' CSE ', description: ' May 20 exam ' },
      { subject: 'MAT', description: '' },
      { subject: '', description: 'Ignored' },
    ],
  });

  assert.equal(deadlines.length, 1);
  assert.equal(deadlines[0].subject, 'CSE');
  assert.equal(deadlines[0].description, 'May 20 exam');
});

test('parseScheduleJson handles plain JSON and fenced JSON', () => {
  assert.deepEqual(__test.parseScheduleJson('{"title":"Plan"}'), { title: 'Plan' });
  assert.deepEqual(__test.parseScheduleJson('```json\n{"tips":["Review"]}\n```'), {
    tips: ['Review'],
  });
});

test('generateSchedule returns configuration error when GEMINI_API_KEY is missing', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  const req = {
    user: { _id: '507f1f77bcf86cd799439011', name: 'Student', email: 's@example.com' },
    body: {
      subjects: [{ label: 'Algorithms' }],
      hoursPerWeek: 5,
      durationWeeks: 2,
    },
  };
  const res = mockResponse();

  await generateSchedule(req, res);

  assert.equal(res.statusCode, 503);
  assert.match(res.body.message, /GEMINI_API_KEY/);

  if (previousKey === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = previousKey;
  }
});
