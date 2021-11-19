/* eslint-disable no-unmodified-loop-condition */
import React, { useState } from 'react'
import * as murmurHash3 from 'murmurhash3js'
import Modal from './Modal'
import { BETA_HASH, EM_TOKEN } from '../constants'
import { ActionButton } from './ActionButton'
import { useDispatch, useSelector } from 'react-redux'
import { tutorial } from '../action-creators'
import { getAllChildren } from '../selectors'
import { storage } from '../util/storage'
import { View, TextInput, TouchableOpacity } from 'react-native'
import { Text } from './Text.native'
import { State } from '../@types'
import tw from 'twrnc'

const isLocalNetwork = Boolean(__DEV__)

/** Wait for a fixed number of milliseconds. */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** Validates an invite code entered by the user. */
const validateInviteCode = (code: string) =>
  murmurHash3.x64.hash128(code.substring(code.lastIndexOf('-') + 1)) === BETA_HASH

/** Shrink modal text and logos to fit container vertically. */
// const onRef = (el: HTMLDivElement) => {
//   if (!el) return
//   const BOTTOM_MARGIN = 20
//   const MIN_FONT_SIZE = 10
//   const LOGO_SCALE_PX_PER_PERCENTAGE = 0.3

//   const contentEl = el.querySelector('.modal-content') as HTMLElement

//   if (!contentEl) return

//   const logoEls = el.querySelectorAll('.logo') as NodeListOf<SVGGraphicsElement & HTMLElement & { width: number }>
//   let fontSize = 100 // eslint-disable-line fp/no-let
//   let width = logoEls[0] && logoEls[0].width // eslint-disable-line fp/no-let

//   /** Returns true if the text overflows past the window height. */
//   const overflow = () => {
//     const { y, height } = contentEl.getBoundingClientRect()
//     return y + height + BOTTOM_MARGIN > window.innerHeight
//   }

/** Decreases the font size of the element. */
// const shrinkFontSize = (el: HTMLElement) => (el.style.fontSize = --fontSize + '%') // eslint-disable-line no-return-assign

// /** Decreases the width of the element. */
// const shrinkWidth = (el: HTMLElement) => (el.style.width = (width -= LOGO_SCALE_PX_PER_PERCENTAGE) + 'px') // eslint-disable-line no-return-assign

// if (fontSize) {
//   // eslint-disable-next-line fp/no-loops
//   while (overflow() && fontSize >= MIN_FONT_SIZE) {
//     // eslint-disable-line fp/no-loops, no-unmodified-loop-condition
//     shrinkFontSize(contentEl)
//     logoEls.forEach(shrinkWidth)
//   }
// }
// }

/** A modal that welcomes the user to em. */
const ModalWelcome = () => {
  const [inviteCode, setInviteCode] = useState(storage.getItem('inviteCode') || '')
  const [, setLoading] = useState(false)
  const [invited, setInvited] = useState(isLocalNetwork || validateInviteCode(inviteCode))
  const [, setInviteTransition] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isTutorialSettingsLoaded = useSelector(
    (state: State) => getAllChildren(state, [EM_TOKEN, 'Settings', 'Tutorial']).length > 0,
  )
  const dispatch = useDispatch()

  /** Submit a beta invite code. */
  const submitInviteCode = async () => {
    if (!inviteCode) {
      setError('Invite code required')
      return
    }

    setError(null)
    setLoading(true)

    await delay(1000)
    setLoading(false)

    if (!validateInviteCode(inviteCode)) {
      setError('Invalid code')
      return
    }

    storage.setItem('inviteCode', inviteCode)

    // wait for fade animation to complete
    setInviteTransition(true)
    await delay(1000)
    setInvited(true)
    await delay(100)
    setInviteTransition(false)
  }

  /** Handle invite code change event. */
  const onInviteCodeChange = (text: string) => {
    setError(null)
    setInviteCode(text)
  }

  /** Handles KeyDown event. */
  const onKeyDown = () => {
    submitInviteCode()
  }

  /**
   * End tutorial.
   */
  const endTutorial = () =>
    dispatch(
      tutorial({
        value: false,
      }),
    )

  return (
    <Modal
      id='welcome'
      title='Welcome to em'
      hideModalActions={!invited}
      center
      preventCloseOnEscape={true}
      actions={({ close }) => (
        <View style={tw`flex-col items-center text-center`}>
          <ActionButton title='START TUTORIAL' onClick={() => close()} />
          {
            <TouchableOpacity
              onPress={
                isTutorialSettingsLoaded
                  ? () => {
                      endTutorial()
                      close()
                    }
                  : undefined
              }
              style={tw`mt-4.5 opacity-50`}
            >
              <Text style={tw`underline text-gray-700 dark:text-gray-200`}>This ain’t my first rodeo. Skip it.</Text>
            </TouchableOpacity>
          }
        </View>
      )}
    >
      <View style={tw`text-center my-10`}>
        {invited ? (
          <Text style={tw`text-center`}>
            <Text style={tw`font-bold`}>em</Text> is a process-oriented writing tool for personal sensemaking.
          </Text>
        ) : (
          <View>
            <Text style={tw`mb-15 text-white text-center font-xs mb-4`}>Oh, you’re here early.</Text>
            <View>
              <TextInput
                placeholder='Enter an invite code'
                value={inviteCode}
                placeholderTextColor='#ddd'
                onSubmitEditing={onKeyDown}
                returnKeyType='done'
                onChangeText={onInviteCodeChange}
                style={tw`
                  bg-gray-800
                  rounded-2xl
                  text-white
                  font-lg
                  mb-5
                  p-4
                  text-center
                  w-full
                `}
              />
              <ActionButton title={'Submit'} style={tw`w-full mt-5`}></ActionButton>
              {error && <Text style={tw`text-red-500`}>{error}</Text>}
            </View>
          </View>
        )}
      </View>
    </Modal>
  )
}

export default ModalWelcome
