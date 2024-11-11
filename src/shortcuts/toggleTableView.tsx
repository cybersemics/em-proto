import Shortcut from '../@types/Shortcut'
import { toggleAttributeActionCreator as toggleAttribute } from '../actions/toggleAttribute'
import TableViewIcon from '../components/icons/TableViewIcon'
import attributeEquals from '../selectors/attributeEquals'
import hasMulticursor from '../selectors/hasMulticursor'
import rootedParentOf from '../selectors/rootedParentOf'
import simplifyPath from '../selectors/simplifyPath'
import head from '../util/head'
import isRoot from '../util/isRoot'

const toggleTableViewShortcut: Shortcut = {
  id: 'toggleTableView',
  label: 'Table View',
  description: 'Display the current thought as a table, where each subthought is a separate column.',
  gesture: 'rdlu',
  keyboard: { key: 't', alt: true, shift: true },
  multicursor: true,
  svg: TableViewIcon,
  canExecute: state => {
    return !!state.cursor || hasMulticursor(state)
  },
  exec: (dispatch, getState) => {
    const state = getState()
    const { cursor } = state
    if (!cursor) return

    const simplePath = simplifyPath(state, rootedParentOf(state, cursor))

    dispatch(
      toggleAttribute({
        path: simplePath,
        values: ['=view', 'Table'],
      }),
    )
  },
  isActive: state => {
    if (!state.cursor || isRoot(state.cursor)) return false
    const path = simplifyPath(state, rootedParentOf(state, state.cursor))
    return attributeEquals(state, head(path), '=view', 'Table')
  },
}

export default toggleTableViewShortcut
