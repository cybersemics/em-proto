import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DropTargetMonitor, useDrop } from 'react-dnd'
import { NativeTypes } from 'react-dnd-html5-backend'
import { useDispatch, useSelector } from 'react-redux'
import { css, cx } from '../../../styled-system/css'
import { anchorButtonRecipe, extendTapRecipe, modalRecipe } from '../../../styled-system/recipes'
import Command from '../../@types/Command'
import DragAndDropType from '../../@types/DragAndDropType'
import DragShortcutZone from '../../@types/DragShortcutZone'
import DragToolbarItem from '../../@types/DragToolbarItem'
import { alertActionCreator as alert } from '../../actions/alert'
import { closeModalActionCreator as closeModal } from '../../actions/closeModal'
import { dragShortcutZoneActionCreator as dragShortcutZone } from '../../actions/dragShortcutZone'
import { initUserToolbarActionCreator as initUserToolbar } from '../../actions/initUserToolbar'
import { removeToolbarButtonActionCreator as removeToolbarButton } from '../../actions/removeToolbarButton'
import { showModalActionCreator as showModal } from '../../actions/showModal'
import { isTouch } from '../../browser'
import { AlertText, AlertType } from '../../constants'
import { shortcutById } from '../../shortcuts'
import fastClick from '../../util/fastClick'
import FadeTransition from '../FadeTransition'
import ShortcutTableOnly from '../ShortcutTableOnly'
import ShortcutTable from './../ShortcutTable'
import Toolbar from './../Toolbar'
import ModalComponent from './ModalComponent'

/** Collects props from the DropTarget. */
const dropCollect = (monitor: DropTargetMonitor) => {
  const { zone } = (monitor.getItem() || {}) as Partial<DragToolbarItem>
  return {
    isHovering: monitor.isOver({ shallow: true }),
    sourceZone: zone,
  }
}

/** A drag-and-drop wrapper component that will remove the toolbar-button from the toolbar when dropped on. */
const DropToRemoveFromToolbar = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch()
  const [{ isHovering, sourceZone }, dropTarget] = useDrop({
    accept: [DragAndDropType.ToolbarButton, NativeTypes.FILE],
    drop: (item: DragToolbarItem) => {
      dispatch(removeToolbarButton(item.shortcut.id))
    },
    collect: dropCollect,
  })
  const dragShortcut = useSelector(state => state.dragShortcut)

  useEffect(() => {
    // clear toolbar drag-and-drop alert when dragShortcut disappears
    if (!dragShortcut) {
      dispatch((dispatch, getState) => {
        const state = getState()
        const alertType = state.alert?.alertType
        if (
          alertType === AlertType.ToolbarButtonRemoveHint ||
          alertType === AlertType.DragAndDropToolbarAdd ||
          alertType === AlertType.DragAndDropToolbarHint
        ) {
          dispatch(alert(null))
        }
      })
      return
    }

    dispatch(dragShortcutZone(isHovering ? DragShortcutZone.Remove : DragShortcutZone.Toolbar))

    // get the screen-relative y coordinate of the toolbar
    // do not show the alert if the toolbar is within 50px of the top of screen, otherwise it blocks the toolbar
    const toolbarTop = document.querySelector('#toolbar')?.getBoundingClientRect().top || 0

    if (toolbarTop < 50) {
      dispatch(alert(null))
    } else if (sourceZone === DragShortcutZone.Remove) {
      dispatch(
        alert(AlertText.DragAndDropToolbarAdd, {
          alertType: AlertType.ToolbarButtonRemoveHint,
          showCloseLink: false,
        }),
      )
    } else if (sourceZone === DragShortcutZone.Toolbar) {
      if (isHovering) {
        dispatch([
          alert(`Drop to remove ${shortcutById(dragShortcut).label} from toolbar`, {
            alertType: AlertType.ToolbarButtonRemoveHint,
            showCloseLink: false,
          }),
        ])
      }
    }
  }, [dispatch, dragShortcut, isHovering, sourceZone])

  return (
    <div data-drop-to-remove-from-toolbar-hovering={isHovering ? '' : undefined} ref={dropTarget}>
      {children}
    </div>
  )
}

/** Customize Toolbar modal. */
const ModalCustomizeToolbar: FC = () => {
  const [selectedShortcut, setSelectedShortcut] = useState<Command | null>(null)
  /** Toggles a shortcut selected. */
  const toggleSelectedShortcut = useCallback(
    (shortcut: Command) => setSelectedShortcut(oldShortcut => (oldShortcut === shortcut ? null : shortcut)),
    [],
  )

  const dispatch = useDispatch()

  const shortcutsContainerRef = useRef<HTMLDivElement>(null)
  const shortcuts = useMemo(() => [selectedShortcut], [selectedShortcut])

  const id = 'customizeToolbar'
  const modalClasses = modalRecipe({ id })

  return (
    <ModalComponent
      id={id}
      // omit title since we need to make room for the toolbar
      title=''
    >
      <h1 className={modalClasses.title}>Customize Toolbar</h1>
      <p className={css({ marginTop: '-1em', marginBottom: '1em' })}>
        &lt;{' '}
        <a {...fastClick(() => dispatch(showModal({ id: 'settings' })))} className={extendTapRecipe()}>
          Back to Settings
        </a>
      </p>

      <div
        className={css({
          // mask the selected bar that is rendered outside thn left edge of the ShortcutRow
          backgroundColor: selectedShortcut ? 'bg' : undefined,
          position: 'sticky',
          top: '0px',
          marginBottom: '1em',
          // extend element to mask the selected bar that is rendered outside thn left edge of the ShortcutRow
          marginLeft: '-modalPadding',
          paddingLeft: 'modalPadding',
          // above ShortcutRow, which has position: relative for the selected bar
          zIndex: 1,
        })}
      >
        <Toolbar customize onSelect={toggleSelectedShortcut} selected={selectedShortcut?.id} />

        {/* selected toolbar button details */}
        <FadeTransition
          duration='fast'
          nodeRef={shortcutsContainerRef}
          in={!!selectedShortcut}
          exit={false}
          unmountOnExit
        >
          <div
            ref={shortcutsContainerRef}
            className={css({
              backgroundColor: 'bg',
              // add bottom drop-shadow
              // mask gap between this and the toolbar
              // do not overlap modal close x
              boxShadow: `0 -8px 20px 15px {colors.bg}`,
            })}
          >
            <div
              className={css({
                backgroundColor: 'gray15',
                marginTop: '0.5em',
                padding: '1em 0 1em 1em',
                position: 'relative',
              })}
            >
              <ShortcutTableOnly shortcuts={shortcuts} />
            </div>
          </div>
        </FadeTransition>
      </div>

      <FadeTransition duration='fast' in={!selectedShortcut} exit={false} unmountOnExit>
        <div className={css({ marginTop: '2em', marginBottom: '2.645em', color: 'dim' })}>
          <p>Drag-and-drop to rearrange toolbar.</p>
          <p>{isTouch ? 'Tap' : 'Click'} a command for details.</p>
        </div>
      </FadeTransition>

      <DropToRemoveFromToolbar>
        <ShortcutTable customize selectedShortcut={selectedShortcut ?? undefined} onSelect={setSelectedShortcut} />
      </DropToRemoveFromToolbar>

      <p className={css({ marginTop: '2em', marginBottom: '2em' })}>
        &lt;{' '}
        <a {...fastClick(() => dispatch(showModal({ id: 'settings' })))} className={extendTapRecipe()}>
          Back to Settings
        </a>
      </p>

      <div className={css({ textAlign: 'center' })}>
        <a
          {...fastClick(() => dispatch(closeModal()))}
          className={cx(
            anchorButtonRecipe({
              actionButton: true,
            }),
            css({ color: 'bg', marginBottom: '1em', marginTop: '2em' }),
          )}
        >
          Close
        </a>

        <div className={css({ fontSize: 'sm', marginTop: '4em' })}>
          <p className={css({ color: 'gray66', marginTop: '0.5em' })}>
            Reset the toolbar to its factory settings. Your current toolbar customization will be permanently deleted.
          </p>
          <a
            {...fastClick(() => {
              if (window.confirm('Reset toolbar to factory settings?')) {
                dispatch([initUserToolbar({ force: true }), alert('Toolbar reset', { clearDelay: 8000 })])
              }
            })}
            className={cx(extendTapRecipe(), css({ color: 'red' }))}
          >
            Reset toolbar
          </a>
        </div>
      </div>
    </ModalComponent>
  )
}

export default ModalCustomizeToolbar
