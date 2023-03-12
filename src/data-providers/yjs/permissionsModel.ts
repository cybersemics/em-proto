import Routes from '../../@types/Routes'
import Share from '../../@types/Share'
import alert from '../../action-creators/alert'
import clearActionCreator from '../../action-creators/clear'
import { accessTokenLocal, permissionsClientDoc } from '../../data-providers/yjs/index'
import { clear } from '../../data-providers/yjs/thoughtspace'
import store from '../../stores/app'
import createId from '../../util/createId'
import storage from '../../util/storage'
import timestamp from '../../util/timestamp'

const permissionsMap = permissionsClientDoc.getMap<Share>()

// permissions model that waps permissionsClientDoc
const permissionsModel: { [key in keyof Routes['share']]: any } = {
  add: ({ name, role }: Pick<Share, 'name' | 'role'>) => {
    const accessToken = createId()
    permissionsMap.set(accessToken, {
      created: timestamp(),
      name: name || '',
      role,
    })
    store.dispatch(alert(`Added ${name ? `"${name}"` : 'device'}`, { clearDelay: 2000 }))
    return { accessToken }
  },
  delete: (accessToken: string, { name }: { name?: string } = {}) => {
    permissionsMap.delete(accessToken)

    // removed other device
    if (accessToken !== accessTokenLocal) {
      store.dispatch(alert(`Removed ${name ? `"${name}"` : 'device'}`, { clearDelay: 2000 }))
    }
    // removed current device when there are others
    else if (permissionsMap.size > 1) {
      store.dispatch([clearActionCreator(), alert(`Removed this device from the thoughtspace`, { clearDelay: 2000 })])
    }
    // remove last device
    else {
      storage.clear()
      clear()
      store.dispatch(clearActionCreator())

      // TODO: Do a full reset without refreshing the page.
      window.location.reload()
    }
  },
  update: (accessToken: string, { name, role }: Share) => {
    const permission = permissionsMap.get(accessToken)!
    permissionsMap.set(accessToken, {
      ...(permission || null),
      created: timestamp(),
      ...(name ? { name } : null),
      ...(role ? { role } : null),
    })
    store.dispatch(alert(`${name ? ` "${name}"` : 'Device '} updated`, { clearDelay: 2000 }))
  },
}

export default permissionsModel
