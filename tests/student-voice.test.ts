import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { campusVoiceItems, featuredStudentPick } from '../src/content/student-voice'

test('student voice content exposes one featured pick with editable human copy and byline', () => {
  assert.equal(featuredStudentPick.label, 'Student pick of the week')
  assert.equal(typeof featuredStudentPick.title, 'string')
  assert.equal(featuredStudentPick.title.length > 4, true)
  assert.equal(typeof featuredStudentPick.copy, 'string')
  assert.equal(featuredStudentPick.copy.length >= 40, true)
  assert.equal(featuredStudentPick.copy.length <= 220, true)
  assert.match(featuredStudentPick.byline, /correspondent|anonymous|student/i)
})

test('student voice content covers the 5Cs plus grad corner with short correspondent notes', () => {
  assert.deepEqual(
    campusVoiceItems.map((item) => item.campus),
    ['Pomona', 'CMC', 'Mudd', 'Scripps', 'Pitzer', 'CGU/KGI'],
  )

  for (const item of campusVoiceItems) {
    assert.equal(typeof item.heading, 'string')
    assert.equal(item.heading.length > 3, true)
    assert.equal(typeof item.copy, 'string')
    assert.equal(item.copy.length >= 20, true)
    assert.equal(item.copy.length <= 180, true)
    assert.match(item.byline, /correspondent|anonymous|student|grad/i)
  }
})

test('StudentVoice component renders static student pick and campus voice content', () => {
  const source = readFileSync('src/components/StudentVoice.tsx', 'utf8')

  assert.match(source, /featuredStudentPick/)
  assert.match(source, /campusVoiceItems\.map/)
  assert.match(source, /Student pick of the week|featuredStudentPick\.label/)
  assert.match(source, /byline/i)
  assert.doesNotMatch(source, /supabase|fetch\(|useEffect|localStorage/i)
})

test('homepage integrates the student voice layer after the existing essentials area', () => {
  const source = readFileSync('src/app/page.tsx', 'utf8')
  const essentialsIndex = source.indexOf('Campus life essentials')
  const studentVoiceIndex = source.indexOf('<StudentVoice')

  assert.match(source, /import \{ StudentVoice \} from '@\/components\/StudentVoice'/)
  assert.notEqual(essentialsIndex, -1)
  assert.notEqual(studentVoiceIndex, -1)
  assert.equal(studentVoiceIndex > essentialsIndex, true)
})
