import { useSelector } from 'react-redux'
import { css, cx } from '../../styled-system/css'
import { upperRightRecipe } from '../../styled-system/recipes'
import fastClick from '../util/fastClick'

/** A close button with an ✕. */
const CloseButton = ({
  onClose,
  disableSwipeToDismiss,
  size = 'md',
}: {
  onClose: () => void
  disableSwipeToDismiss?: boolean
  size?: 'sm' | 'md'
}) => {
  const fontSize = useSelector(state => state.fontSize)
  const padding = (fontSize / 2 + 2) / (size === 'sm' ? 2 : 1)
  return (
    <a
      {...fastClick(onClose)}
      className={cx(
        upperRightRecipe(),
        css({
          // inherit not yet supported by plugin
          // eslint-disable-next-line @pandacss/no-hardcoded-color
          color: 'inherit',
          textDecoration: 'none',
        }),
      )}
      style={{ fontSize: size === 'sm' ? fontSize / 2 : fontSize, padding: `${padding}px ${padding * 1.25}px` }}
      aria-label={disableSwipeToDismiss ? 'no-swipe-to-dismiss' : undefined}
      data-testid='close-button'
    >
      ✕
    </a>
  )
}

export default CloseButton
