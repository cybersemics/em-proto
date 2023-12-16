import classNames from 'classnames'
import moize from 'moize'
import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import LazyEnv from '../@types/LazyEnv'
import Path from '../@types/Path'
import SimplePath from '../@types/SimplePath'
import State from '../@types/State'
import setCursor from '../action-creators/setCursor'
import { REGEX_PUNCTUATIONS, REGEX_TAGS, Settings } from '../constants'
import { isInternalLink } from '../device/router'
import decodeThoughtsUrl from '../selectors/decodeThoughtsUrl'
import findDescendant from '../selectors/findDescendant'
import { anyChild, filterAllChildren } from '../selectors/getChildren'
import getContexts from '../selectors/getContexts'
import getThoughtById from '../selectors/getThoughtById'
import getUserSetting from '../selectors/getUserSetting'
import editingValueStore from '../stores/editingValue'
import ellipsizeUrl from '../util/ellipsizeUrl'
import equalPath from '../util/equalPath'
import fastClick from '../util/fastClick'
import hashPath from '../util/hashPath'
import head from '../util/head'
import isURL from '../util/isURL'
import isVisibleContext from '../util/isVisibleContext'
import { resolveArray } from '../util/memoizeResolvers'
import parentOf from '../util/parentOf'
import publishMode from '../util/publishMode'
import useMultiline from './Editable/useMultiline'
import StaticSuperscript from './StaticSuperscript'
import UrlIcon from './icons/UrlIcon'

/** Adds https to the url if it is missing. Ignores urls at localhost. */
const addMissingProtocol = (url: string) =>
  (!url.startsWith('http:') && !url.startsWith('https:') && !url.startsWith('localhost:') ? 'https://' : '') + url

/** A Url icon that links to the url. */
const UrlIconLink = React.memo(({ url }: { url: string }) => {
  const dispatch = useDispatch()
  return (
    <a
      href={addMissingProtocol(url)}
      rel='noopener noreferrer'
      target='_blank'
      className='external-link'
      {...fastClick(e => {
        e.stopPropagation() // prevent Editable onMouseDown
        if (isInternalLink(url)) {
          dispatch((dispatch, getState) => {
            const { path, contextViews } = decodeThoughtsUrl(getState(), {
              exists: true,
              url,
            })
            dispatch(setCursor({ path, replaceContextViews: contextViews }))
          })
          e.preventDefault()
        }
      })}
    >
      <UrlIcon />
    </a>
  )
})
UrlIconLink.displayName = 'UrlIconLink'

/** A non-interactive annotation overlay that contains intrathought links (superscripts and underlining). */
const ThoughtAnnotationContainer = React.memo(
  ({
    path,
    simplePath,
    minContexts = 2,
    invalidState,
    style,
    // only applied to the .subthought container
    styleAnnotation,
  }: {
    env?: LazyEnv
    focusOffset?: number
    invalidState?: boolean
    minContexts?: number
    path: Path
    showContextBreadcrumbs?: boolean
    simplePath: SimplePath
    style?: React.CSSProperties
    styleAnnotation?: React.CSSProperties
  }) => {
    // delay calculation of contexts for performance
    // recalculate after the component has mounted
    // filtering on isNotArchive is very slow: O(totalNumberOfContexts * depth)
    const [calculateContexts, setCalculateContexts] = useState(false)

    const value: string | undefined = useSelector(state => {
      const thought = getThoughtById(state, head(path))
      return thought?.value || ''
    })

    const isEditing = useSelector(state => equalPath(state.cursor, path))
    const invalidStateIfEditing = useMemo(() => isEditing && invalidState, [isEditing, invalidState])

    const liveValueIfEditing = editingValueStore.useSelector((editingValue: string | null) =>
      isEditing ? editingValue : null,
    )

    // if a thought has the same value as editValue, re-render its ThoughtAnnotation in order to get the correct number of contexts
    editingValueStore.useSelector((editingValue: string | null) => value === editingValue)

    const hideSuperscriptsSetting = useSelector(getUserSetting(Settings.hideSuperscripts))

    const isExpanded = useSelector(state => !!state.expanded[hashPath(simplePath)])

    const numContexts = useSelector(
      moize(
        (state: State) => {
          if (!calculateContexts || hideSuperscriptsSetting) return 0

          // only show real time update if being edited while having meta validation error
          // do not increase numContexts when in an invalid state since the thought has not been updated in state
          const isRealTimeContextUpdate = isEditing && invalidStateIfEditing && liveValueIfEditing !== null

          const contexts = getContexts(state, isRealTimeContextUpdate ? liveValueIfEditing! : value)
          return value === ''
            ? 0
            : contexts.filter(id => isVisibleContext(state, id)).length + (isRealTimeContextUpdate ? 1 : 0)
        },
        {
          maxSize: 1000,
          profileName: 'numContexts',
          transformArgs: ([state]) => {
            const isRealTimeContextUpdate = isEditing && invalidStateIfEditing && liveValueIfEditing !== null
            return [resolveArray(getContexts(state, isRealTimeContextUpdate ? liveValueIfEditing! : value))]
          },
        },
      ),
    )

    const showSuperscript =
      !hideSuperscriptsSetting &&
      (REGEX_PUNCTUATIONS.test(value.replace(REGEX_TAGS, '')) ? false : minContexts === 0 || numContexts > 1)

    const url = useSelector(state => {
      const childrenUrls = filterAllChildren(state, head(simplePath), child => isURL(child.value))
      const urlValue = isURL(value)
        ? value
        : // if the only subthought is a url and the thought is not expanded, link the thought
        !isExpanded && childrenUrls.length === 1 && (!state.cursor || !equalPath(simplePath, parentOf(state.cursor)))
        ? childrenUrls[0].value
        : null
      return urlValue
    })

    // if a thought has the same value as editValue, re-render its ThoughtAnnotation in order to get the correct number of contexts
    editingValueStore.useSelector((editingValue: string | null) => value === editingValue)

    useEffect(() => {
      setCalculateContexts(true)
    }, [])

    return showSuperscript || url ? (
      <ThoughtAnnotation
        {...{
          simplePath,
          isEditing,
          numContexts,
          showSuperscript,
          style,
          styleAnnotation,
          url,
          value,
        }}
      />
    ) : null
  },
)

/** A non-interactive annotation overlay that contains intrathought links (superscripts and underlining). */
const ThoughtAnnotation = React.memo(
  ({
    isEditing,
    numContexts,
    showSuperscript,
    simplePath,
    style,
    // only applied to the .subthought container
    styleAnnotation,
    url,
    value,
  }: {
    isEditing?: boolean
    numContexts: number
    showSuperscript?: boolean
    simplePath: SimplePath
    style?: React.CSSProperties
    styleAnnotation?: React.CSSProperties
    url?: string | null
    value: string
  }) => {
    const contentRef = React.useRef<HTMLInputElement>(null)

    const fontSize = useSelector(state => state.fontSize)
    const liveValueIfEditing = editingValueStore.useSelector((editingValue: string | null) =>
      isEditing ? editingValue ?? value : null,
    )

    /**
     * Adding dependency on lexemeIndex as the fetch for thought is async await.
     * ThoughtAnnotation wasn't waiting for all the lexemeIndex to be set before it was rendered.
     * And hence the superscript wasn't rendering properly on load.
     * So now subscribing to get context so that StaticSuperscript is not re-rendered for all lexemeIndex change.
     * It will re-render only when respective Lexeme is changed.
     * Changed as part of fix for issue 1419 (https://github.com/cybersemics/em/issues/1419).
     */

    const textMarkup = useSelector(state => {
      const labelId = findDescendant(state, head(simplePath), '=label')
      const labelChild = anyChild(state, labelId || undefined)
      return isEditing ? liveValueIfEditing ?? value : labelChild ? labelChild.value : ellipsizeUrl(value)
    })

    const multiline = useMultiline(contentRef, simplePath, isEditing)

    return (
      <div
        className='thought-annotation'
        ref={contentRef}
        style={{
          // must match marginLeft of StaticThought
          marginLeft: fontSize - 13,
        }}
      >
        <div
          className={classNames({
            'editable-annotation': true,
            multiline,
            // disable intrathought linking until add, edit, delete, and expansion can be implemented
            // 'subthought-highlight': isEditing && focusOffset != null && subthought.contexts.length > (subthought.text === value ? 1 : 0) && subthoughtUnderSelection() && subthought.text === subthoughtUnderSelection().text
          })}
          style={{
            // add a little padding for highlighting
            padding: '0 3px',
            marginLeft: -3,
            ...styleAnnotation,
          }}
        >
          <span className='editable-annotation-text' style={style} dangerouslySetInnerHTML={{ __html: textMarkup }} />
          {
            // do not render url icon on root thoughts in publish mode
            url && !(publishMode() && simplePath.length === 1) && <UrlIconLink url={url} />
          }
          {
            // with real time context update we increase context length by 1 // with the default minContexts of 2, do not count the whole thought
            showSuperscript ? <StaticSuperscript n={numContexts} style={style} /> : null
          }
        </div>
      </div>
    )
  },
)

ThoughtAnnotationContainer.displayName = 'ThoughtAnnotationContainer'
ThoughtAnnotation.displayName = 'ThoughtAnnotation'

export default ThoughtAnnotationContainer
