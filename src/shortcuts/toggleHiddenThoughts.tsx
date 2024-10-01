import Shortcut from '../@types/Shortcut'
import { toggleHiddenThoughtsActionCreator as toggleHiddenThoughts } from '../actions/toggleHiddenThoughts'
import Icon from '../components/icons/HiddenThoughtsIcon'

const toggleHiddenThoughtsShortcut: Shortcut = {
  id: 'toggleHiddenThoughts',
  label: 'Show Hidden Thoughts',
  labelInverse: 'Hide Hidden Thoughts',
  description: 'Show all hidden thoughts.',
  descriptionInverse: 'Hide hidden thoughts.',
  keyboard: { key: 'h', shift: true, alt: true },
  svg: Icon,
  exec: dispatch => dispatch(toggleHiddenThoughts()),
  isActive: getState => getState().showHiddenThoughts,
}

export default toggleHiddenThoughtsShortcut
