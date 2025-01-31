import { head } from 'lodash'
import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import SimplePath from '../../@types/SimplePath'
import State from '../../@types/State'
import useSelectorEffect from '../../hooks/useSelectorEffect'
import getThoughtById from '../../selectors/getThoughtById'
import editingValueStore from '../../stores/editingValue'
import viewportStore from '../../stores/viewport'

/** Selects the cursor from the state. */
const selectCursor = (state: State) => state.cursor

/** Returns true if the element has more than one line of text. */
const useMultiline = (contentRef: React.RefObject<HTMLElement>, simplePath: SimplePath, isEditing?: boolean) => {
  const [multiline, setMultiline] = useState(false)
  const fontSize = useSelector(state => state.fontSize)
  const showSplitView = useSelector(state => state.showSplitView)
  const splitPosition = useSelector(state => state.splitPosition)

  // While editing, watch the current Value and trigger the layout effect
  const editingValue = editingValueStore.useSelector(state => (isEditing ? state : null))

  const updateMultiline = useCallback(() => {
    if (!contentRef.current) return

    const height = contentRef.current.getBoundingClientRect().height
    // must match line-height as defined in thought-container
    const singleLineHeight = fontSize * 2
    // .editable.multiline gets 5px of padding-top to offset the collapsed line-height
    // we need to account for padding-top, otherwise it can cause a false positive
    const style = window.getComputedStyle(contentRef.current)
    const paddingTop = parseInt(style.paddingTop)
    const paddingBottom = parseInt(style.paddingBottom)
    // 2x the single line height would indicate that the thought was multiline if it weren't for the change in line-height and padding.
    // 1.2x is used for a more forgiving condition.
    // 1.5x can cause multiline to alternate in Safari for some reason. There may be a mistake in the height calculation or the inclusion of padding that is causing this. Padding was added to the calculation in commit 113c692. Further investigation is needed.
    // See: https://github.com/cybersemics/em/issues/2778#issuecomment-2605083798
    setMultiline(height - paddingTop - paddingBottom > singleLineHeight * 1.2)
    // we also want to have a fresh function when editingValue changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentRef, fontSize, editingValue])

  // Recalculate multiline on mount, when the font size changes, edit, split view resize, value changes, and when the
  // cursor changes to or from the element.
  useLayoutEffect(updateMultiline, [
    contentRef,
    fontSize,
    isEditing,
    showSplitView,
    simplePath,
    splitPosition,
    editingValue,
    updateMultiline,
  ])

  // Recalculate multiline when the cursor changes.
  // This is necessary because the width of thoughts change as the autofocus indent changes.
  // (do not re-render component unless multiline changes)
  useSelectorEffect(updateMultiline, selectCursor, shallowEqual)

  // Recalculate height after thought value changes.
  // Otherwise, the hight is not recalculated after splitThought.
  // TODO: useLayoutEffect does not work for some reason, causing the thought to briefly render at the incorrect height.
  const splitThoughtValue = useSelector(state => {
    const thoughtId = head(simplePath)
    return thoughtId ? getThoughtById(state, thoughtId)?.value : null
  })
  useEffect(updateMultiline, [splitThoughtValue, updateMultiline])

  // re-measure when the screen is resized
  viewportStore.useSelectorEffect(updateMultiline, state => state.innerWidth)

  return multiline
}

export default useMultiline
