import { initialState, pathToContext, reducerFlow } from '../../util'
import { RANKED_ROOT } from '../../constants'
import { cursorUp, importText, newSubthought, newThought, setCursor, toggleContextView, toggleHiddenThoughts } from '../../reducers'
import { rankThoughtsFirstMatch } from '../../selectors'

it('move cursor to previous sibling', () => {

  const steps = [
    newThought('a'),
    newThought('b'),
    cursorUp,
  ]

  // run steps through reducer flow
  const stateNew = reducerFlow(steps)(initialState())

  expect(stateNew.cursor)
    .toMatchObject([{ value: 'a', rank: 0 }])

})

it('move cursor to previous attribute when showHiddenThoughts is true', () => {

  const steps = [
    toggleHiddenThoughts,
    newThought('a'),
    newSubthought('b'),
    newThought('=test'),
    newThought('c'),
    cursorUp,
  ]

  // run steps through reducer flow
  const stateNew = reducerFlow(steps)(initialState())

  expect(stateNew.cursor)
    .toMatchObject([{ value: 'a', rank: 0 }, { value: '=test', rank: 1 }])

})

it('move cursor from first child to parent', () => {

  const steps = [
    newThought('a'),
    newSubthought('b'),
    cursorUp,
  ]

  // run steps through reducer flow
  const stateNew = reducerFlow(steps)(initialState())

  expect(stateNew.cursor)
    .toMatchObject([{ value: 'a', rank: 0 }])

})

it('move to last root child when there is no cursor', () => {

  const steps = [
    newThought('a'),
    newThought('b'),
    setCursor({ path: null }),
    cursorUp,
  ]

  // run steps through reducer flow
  const stateNew = reducerFlow(steps)(initialState())

  expect(stateNew.cursor)
    .toMatchObject([{ value: 'b', rank: 1 }])

})

it('do nothing when there are no thoughts', () => {

  const stateNew = cursorUp(initialState())

  expect(stateNew.cursor).toBe(null)

})

describe('context view', () => {

  it(`move cursor from context's first child to parent`, async () => {

    const text = `- a
      - m
        - x
    - b
      - m
        - y`

    const steps = [
      importText({ path: RANKED_ROOT, text }),
      state => setCursor(state, { path: rankThoughtsFirstMatch(state, ['a', 'm']) }),
      toggleContextView,
      state => setCursor(state, { path: rankThoughtsFirstMatch(state, ['a', 'm', 'a']) }),
      cursorUp,
    ]

    // run steps through reducer flow
    const stateNew = reducerFlow(steps)(initialState())

    expect(pathToContext(stateNew.cursor))
      .toMatchObject(['a', 'm'])

  })

})
