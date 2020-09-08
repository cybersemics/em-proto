import React, { RefObject } from 'react'

import { connect } from 'react-redux'
import { store } from '../store'
import globals from '../globals'
import assert from 'assert'

// components
import ThoughtAnnotation from './ThoughtAnnotation'

// constants
import {
  MAX_DISTANCE_FROM_CURSOR,
} from '../constants'

import { shortcutById } from '../shortcuts'

// util
import {
  contextOf,
  equalArrays,
  equalPath,
  head,
  headId,
  headRank,
  headValue,
  isDivider,
  isDocumentEditable,
  isEM,
  isRoot,
  isURL,
  pathToContext,
  publishMode,
  rootedContextOf,
  subsetThoughts,
  unroot,
} from '../util'

// selectors
import {
  attribute,
  chain,
  getNextRank,
  getRankBefore,
  getSortPreference,
  getThought,
  getThoughtsRanked,
  isBefore,
} from '../selectors'

import { Interpolation, SpringValue, animated } from 'react-spring'
import { AnimatePresence, motion } from 'framer-motion'
import Editable from './Editable'
import DividerNew from './DividerNew'
import HomeLink from './HomeLink'
import Note from './Note'

import classNames from 'classnames'
import Bullet from './BulletNew'
import NoChildren from './NoChildren'
import DropEndGroup from './DropEndGroup'
import { Child, Path } from '../types'
import { FlatArrayNode } from '../util/treeToFlatArray'
import { State } from '../util/initialState'
import { DropTarget, DropTargetConnector, DropTargetMonitor } from 'react-dnd'

// assert shortcuts at load time
const subthoughtShortcut = shortcutById('newSubthought')
const toggleContextViewShortcut = shortcutById('toggleContextView')
assert(subthoughtShortcut)
assert(toggleContextViewShortcut)

interface SpringProps {
  [key: string]: SpringValue | Interpolation | string | number,
}

type WithDropEndArray<T> = T & { dropEndArray: DropEndObject[] }

interface ThoughtProps {
  nodeItem: WithDropEndArray<FlatArrayNode>,
  childrenForced?: Child[],
  isDragging?: boolean,
  isOver?: boolean,
  connectDropTarget: (el: JSX.Element) => any,
}

interface ThoughtContainerProps {
  allowSingleContext?: boolean,
  childrenForced?: Child[],
  contextBinding?: Path,
  count?: number,
  cursor?: Path | null,
  cursorOffset?: number,
  depth?: number,
  expanded?: boolean,
  expandedContextThought?: any,
  isPublishChild?: boolean,
  isCodeView?: boolean | null,
  isCursorGrandparent?: boolean,
  isCursorParent: boolean,
  isDragging?: boolean,
  isEditing?: boolean,
  isEditingPath?: boolean,
  prevChild?: any,
  publish?: boolean,
  showContexts?: boolean,
  thought?: Child,
  thoughtsRankedLive: Path,
  url?: string | null,
  view?: string | null,
}

export interface DropEndObject {
  key: string,
  xOffset: number,
  thoughtsRanked: Path,
  showContexts: boolean,
}

/**********************************************************************
 * Redux
 **********************************************************************/

// eslint-disable-next-line jsdoc/require-jsdoc
const mapStateToProps = (state: State, props: ThoughtProps) => {

  const {
    codeView,
    cursor,
    cursorOffset,
    cursorBeforeEdit,
    expanded,
    expandedContextThought,
    search,
    showHiddenThoughts,
  } = state

  const {
    contextChain,
    thoughtsRanked,
    viewInfo,
    depth,
    thoughtsResolved,
  } = props.nodeItem

  const { childrenForced } = props

  const showContextsParent = viewInfo.context.showContextsParent

  // check if the cursor path includes the current thought
  const isEditingPath = subsetThoughts(cursorBeforeEdit, thoughtsResolved)

  // check if the cursor is editing a thought directly
  const isEditing = equalPath(cursorBeforeEdit, thoughtsResolved)

  const thoughtsRankedLive = isEditing && cursor
    ? contextOf(thoughtsRanked).concat(head(showContextsParent ? contextOf(cursor) : cursor))
    : thoughtsRanked

  const distance = cursor ? Math.max(0,
    Math.min(MAX_DISTANCE_FROM_CURSOR, cursor.length - depth)
  ) : 0

  const isCursorParent = distance === 2
    // grandparent
    // @ts-ignore
    ? equalPath(rootedContextOf(contextOf(cursor || [])), chain(state, contextChain, thoughtsRanked)) && getThoughtsRanked(state, cursor).length === 0
    // parent
    : equalPath(contextOf(cursor || []), chain(state, contextChain, thoughtsRanked))

  let contextBinding // eslint-disable-line fp/no-let
  try {
    // @ts-ignore
    contextBinding = JSON.parse(attribute(state, thoughtsRankedLive, '=bindContext'))
  }
  // eslint-disable-next-line
  catch (err) {
  }

  const isCursorGrandparent =
    equalPath(rootedContextOf(contextOf(cursor || [])), chain(state, contextChain, thoughtsRanked))
  const children = childrenForced || getThoughtsRanked(state, contextBinding || thoughtsRankedLive)

  const value = headValue(thoughtsRankedLive)

  // link URL
  const url = isURL(value) ? value :
  // if the only subthought is a url and the thought is not expanded, link the thought
    !expanded && children.length === 1 && children[0].value && isURL(children[0].value) && (!cursor || !equalPath(thoughtsRankedLive, contextOf(cursor))) ? children[0].value :
    null

  const thought = getThought(state, value)

  return {
    contextBinding,
    cursorOffset,
    distance,
    isPublishChild: !search && publishMode() && thoughtsRanked.length === 2,
    isCursorParent,
    isCursorGrandparent,
    expandedContextThought,
    isCodeView: cursor && equalPath(codeView!, thoughtsRanked),
    isEditing,
    isEditingPath,
    publish: !search && publishMode(),
    showHiddenThoughts,
    thought,
    showContexts: showContextsParent,
    thoughtsRankedLive,
    view: attribute(state, thoughtsRankedLive, '=view'),
    url,
  }
}

// eslint-disable-next-line jsdoc/require-jsdoc
const canDropAsSibling = (props: { thoughtsRankedLive: Path }, monitor: DropTargetMonitor) => {

  const state = store.getState()
  const { cursor } = state
  const { thoughtsRanked: thoughtsFrom } = monitor.getItem()
  const thoughtsTo = props.thoughtsRankedLive
  const thoughts = pathToContext(props.thoughtsRankedLive)
  const context = contextOf(thoughts)
  const isSorted = getSortPreference(state, context).includes('Alphabetical')
  const distance = cursor ? cursor.length - thoughtsTo.length : 0
  const isHidden = distance >= 2
  const isSelf = equalPath(thoughtsTo, thoughtsFrom)
  const isDescendant = subsetThoughts(thoughtsTo, thoughtsFrom) && !isSelf
  const oldContext = rootedContextOf(thoughtsFrom)
  const newContext = rootedContextOf(thoughtsTo)
  const sameContext = equalArrays(oldContext, newContext)

  // do not drop on descendants (exclusive) or thoughts hidden by autofocus
  // allow drop on itself or after itself even though it is a noop so that drop-hover appears consistently
  return !isHidden && !isDescendant && (!isSorted || !sameContext)
}

// eslint-disable-next-line jsdoc/require-jsdoc
const dropAsSibling = (props: { thoughtsRankedLive: Path, showContexts: boolean }, monitor: DropTargetMonitor) => {

  // no bubbling
  if (monitor.didDrop() || !monitor.isOver({ shallow: true })) return

  const state = store.getState()

  const { thoughtsRanked: thoughtsFrom } = monitor.getItem()

  const thoughtsTo = props.thoughtsRankedLive
  const isRootOrEM = isRoot(thoughtsFrom) || isEM(thoughtsFrom)
  const oldContext = rootedContextOf(thoughtsFrom)
  const newContext = rootedContextOf(thoughtsTo)
  const sameContext = equalArrays(oldContext, newContext)

  // cannot move root or em context
  if (isRootOrEM && !sameContext) {
    store.dispatch({ type: 'error', value: `Cannot move the ${isRoot(thoughtsFrom) ? 'home' : 'em'} context to another context.` })
    return
  }

  // drop on itself or after itself is a noop
  if (equalPath(thoughtsFrom, thoughtsTo) || isBefore(state, thoughtsFrom, thoughtsTo)) return

  const newPath = unroot(contextOf(thoughtsTo)).concat({
    value: headValue(thoughtsFrom),
    rank: getRankBefore(state, thoughtsTo)
  })

  store.dispatch(props.showContexts
    ? {
      type: 'newThoughtSubmit',
      value: headValue(thoughtsTo),
      context: pathToContext(thoughtsFrom),
      rank: getNextRank(state, thoughtsFrom)
    }
    : {
      type: 'existingThoughtMove',
      oldPath: thoughtsFrom,
      newPath
    }
  )

  // alert user of move to another context
  if (!sameContext) {
    // TO-DO: Getting same context alert without being a same context

    // // wait until after MultiGesture has cleared the error so this alert does not get cleared
    // setTimeout(() => {
    //   const alertFrom = '"' + ellipsize(headValue(thoughtsFrom)) + '"'
    //   const alertTo = isRoot(newContext)
    //     ? 'home'
    //     : '"' + ellipsize(headValue(contextOf(thoughtsTo))) + '"'

    //   alert(`${alertFrom} moved to ${alertTo} context.`)
    //   clearTimeout(globals.errorTimer)
    //   // @ts-ignore
    //   globals.errorTimer = window.setTimeout(() => alert(null), 5000)
    // }, 100)
  }
}

/**********************************************************************
 * Components
 **********************************************************************/

interface ThoughtWrapperProps {
  measureBind: any,
  wrapperDivRef: RefObject<HTMLDivElement>,
  innerDivStyle: SpringProps,
  wrapperStyle: SpringProps,
  nodeItem: WithDropEndArray<FlatArrayNode>,
}

/** Node Component. */
const ThoughtWrapper = ({ measureBind, wrapperDivRef, innerDivStyle, wrapperStyle, nodeItem }: ThoughtWrapperProps) => {
  const { expanded, viewInfo } = nodeItem
  const showContexts = viewInfo.context.active

  return (
    <animated.div style={wrapperStyle} ref={wrapperDivRef}>
      <animated.div style={innerDivStyle}>
        <div ref={measureBind}>
          <animated.div
            className={classNames({
              node: true,
              [`parent-${nodeItem.parentKey}`]: true
            })}
            id={nodeItem.key}
          >
            {/* @ts-ignore */}
            <Thought nodeItem={nodeItem}/>
          </animated.div>
          <DropEndGroup expanded={expanded} thoughtsRanked={nodeItem.thoughtsRanked} showContexts={showContexts} dropEndObject={nodeItem.dropEndArray}/>
        </div>
      </animated.div>
    </animated.div>
  )
}

ThoughtWrapper.displayName = 'ThoughtWrapper'

/** A thought container with bullet, thought annotation, thought, and subthoughts.
 *
  @param allowSingleContext  Pass through to Subthoughts since the SearchSubthoughts component does not have direct access to the Subthoughts of the Subthoughts of the search. Default: false.
 */
const ThoughtContainer = ({
  url,
  expandedContextThought,
  isEditing,
  thoughtsRankedLive,
  isCursorParent,
  cursorOffset,
  connectDropTarget,
  isOver,
  nodeItem
}: ThoughtContainerProps & ThoughtProps) => {
  const { thoughtsResolved, thoughtsRanked, contextChain, expanded, isCursor, viewInfo, childrenLength, hasChildren, parentKey, key } = nodeItem
  const showContexts = viewInfo.context.active
  const showContextsParent = viewInfo.context.showContextsParent
  const hasContext = viewInfo.context.hasContext

  const isTableFirstColumn = viewInfo.table.column === 1

  const homeContext = showContextsParent && isRoot([head(contextOf(thoughtsRanked))])

  const showContextBreadcrumbs = showContextsParent &&
    (!globals.ellipsizeContextThoughts || equalPath(thoughtsRanked, expandedContextThought)) &&
    thoughtsRanked.length > 2

  const rank = headRank(thoughtsRanked)

  const isThoughtDivider = isDivider(headValue(thoughtsRanked))

  const thoughtsLive = pathToContext(thoughtsRankedLive!)

  const state = store.getState()

  const shouldNoteFocus = state.noteFocusThoughtId ? state.noteFocusThoughtId === headId(thoughtsResolved) : false

  return (
    connectDropTarget(<div>
      <motion.div
        style={{
          padding: '0.3rem',
          paddingBottom: expanded && showContexts && hasContext ? '0' : '0.3rem',
          position: 'relative'
        }}
        className='thought-new'>
        {/* To-do: find a way to cancel animation for tests to prevent state update on unmounted component error. */}
        <AnimatePresence>{
          isOver &&
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ transform: 'translateX(0.1rem)', width: 'calc(100%  - 0.1rem)' }}
                  className='drop-hover-new'>
                </motion.div>
        }
        </AnimatePresence>
        <motion.div style={{
          display: 'flex'
        }}
        id='ola'
        >
          <Bullet hide={isTableFirstColumn && !isCursor} thoughtsRankedLive={thoughtsRankedLive} isCursorParent={isCursorParent} isDraggable={true} expanded={expanded && !isTableFirstColumn} isActive={isCursor} hasChildren={hasChildren} />
          <div style={{ flex: 1, display: 'flex' }}>
            <ThoughtAnnotation
              contextChain={contextChain}
              homeContext={homeContext}
              minContexts={2}
              showContextBreadcrumbs={showContextBreadcrumbs}
              showContexts={showContextsParent}
              style={{}}
              thoughtsRanked={thoughtsRanked}
              url={url}
            />
            <div style={{
              flex: 1
            }}>
              {
                homeContext ? <HomeLink />
                : isThoughtDivider ? <DividerNew thoughtsRanked={thoughtsRanked} isActive={isCursor} parentKey={parentKey!}/>
                : <Editable
                  contextChain={contextChain}
                  cursorOffset={cursorOffset}
                  disabled={!isDocumentEditable()}
                  isEditing={isEditing}
                  rank={rank}
                  showContexts={showContextsParent}
                  style={{
                    width: '100%',
                    wordWrap: 'break-word',
                    wordBreak: 'break-all',
                  }}
                  thoughtsRanked={thoughtsRanked}
                  // eslint-disable-next-line
                      onKeyDownAction={() => {}}/>
              }
            </div>
          </div>
        </motion.div>
        <div style={{ marginLeft: '1.36rem' }}>
          {/* nodeKey is a unique key for each node in the flat rendered tree */}
          <Note nodeKey={key} focusOnMount={shouldNoteFocus} context={thoughtsLive} thoughtsRanked={thoughtsRankedLive!} contextChain={contextChain}/>
        </div>
        {expanded && <AnimatePresence>
          {showContexts &&
          (
            hasContext ?
              <motion.div
                transition={{ ease: 'easeInOut', duration: 0.3 }}
                className='children-subheading text-note text-small'
                style={{ margin: '0', marginLeft: '1.5rem', marginTop: '0.35rem', padding: 0 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <em>Contexts:</em>
              </motion.div> : <NoChildren thoughtsRanked={thoughtsResolved} childrenLength={childrenLength} allowSingleContext={false}/>
          )
          }
        </AnimatePresence>
        }
      </motion.div>
    </div>
    )
  )
}

ThoughtContainer.displayName = 'ThoughtContainer'

/** Drop specification. */
const spec = {
  canDrop: canDropAsSibling,
  drop: dropAsSibling,
}

/** Collect. */
const collect = (connect: DropTargetConnector, monitor: DropTargetMonitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver({ shallow: true }) && monitor.canDrop(),
  isDragging: monitor.getItem(),
})

const DroppableNode = DropTarget('move', spec, collect)(ThoughtContainer)
DroppableNode.displayName = 'SiblingDrop'

const Thought = connect(mapStateToProps)(DroppableNode)

export default ThoughtWrapper
