import React from 'react'
import { showModal } from '../action-creators'
import { Icon as IconType, Shortcut } from '../types'
// import { isTouch } from '../browser'
import Svg, { G, Path } from 'react-native-svg'

// eslint-disable-next-line jsdoc/require-jsdoc
const Icon = ({ fill = 'black', size = 20, style }: IconType) => <Svg width={size} height={size} fill={fill} viewBox='0 0 400 400'>
  <G>
    <Path d='M358.8,272.2v70.3c0,1.4-0.2,2.7-0.5,3.9v0c0,0,0,0,0,0c-1.4,6.9-7.5,12.1-14.7,12.1H56.3c-7.7,0-14.1-5.9-14.9-13.4   c-0.2-0.9-0.2-1.7-0.2-2.7v-70.3c0-8.3,6.8-15,15-15c4.1,0,7.9,1.7,10.6,4.4c2.7,2.7,4.4,6.5,4.4,10.6v56.3h257.7v-56.3   c0-8.3,6.8-15,15-15c4.1,0,7.9,1.7,10.6,4.4C357.1,264.3,358.8,268.1,358.8,272.2z' />
    <Path d='M286.5,201.8l-73.7,73.7c-0.1,0.2-0.3,0.3-0.4,0.4c-2.7,2.7-6.2,4.4-9.7,4.9c-0.3,0-0.6,0.1-0.9,0.1   c-0.6,0.1-1.2,0.1-1.8,0.1h0l-1.7-0.1c-0.3,0-0.6-0.1-0.9-0.1c-3.6-0.5-7-2.2-9.7-4.9c-0.1-0.1-0.3-0.3-0.4-0.4l-73.7-73.7   c-3.4-3.4-5.1-7.9-5.1-12.4c0-4.5,1.7-9,5.1-12.4c6.8-6.8,17.9-6.8,24.8,0l44.3,44.3V59c0-9.6,7.9-17.5,17.5-17.5   c4.8,0,9.2,2,12.4,5.1c3.2,3.2,5.1,7.5,5.1,12.4v162.3l44.3-44.3c6.8-6.8,17.9-6.8,24.8,0C293.3,183.9,293.3,195,286.5,201.8z' />
  </G>
</Svg>

// eslint-disable-next-line jsdoc/require-jsdoc
// const ShareIcon = ({ fill = 'black', size = 20, style }: IconType) => <Svg width={size} height={size} fill={fill} viewBox='0 0 11 10' >
//   <G>
//     <Path d='M5.07799385,1.57822638 L5.07799385,6.00195683 C5.07799385,6.25652943 4.87308997,6.46290127 4.61635805,6.46290127 C4.36140363,6.46290127 4.15472224,6.25632412 4.15472224,6.00195683 L4.15472224,1.57673073 L3.63332249,2.09813049 C3.45470505,2.27674793 3.16501806,2.27665705 2.98348118,2.09512018 C2.80320118,1.91484018 2.80426532,1.62148443 2.98047088,1.44527887 L4.29219473,0.133555019 C4.38100979,0.0447399441 4.49728613,0.000109416918 4.61407318,0 L4.61759666,0.0013781583 C4.73483522,0.00162826335 4.85141208,0.0459413813 4.93902573,0.133555019 L6.25074959,1.44527887 C6.42936703,1.62389632 6.42927613,1.91358331 6.24773926,2.09512018 C6.06745926,2.27540018 5.77410353,2.27433604 5.59789795,2.09813049 L5.07799385,1.57822638 Z M0.92327161,8.54026239 L8.30944449,8.54026239 L8.30944449,5.3066871 C8.30944449,5.05290609 8.51434837,4.84717595 8.77108029,4.84717595 C9.02603471,4.84717595 9.2327161,5.05449945 9.2327161,5.3066871 L9.2327161,9.00402285 C9.2327161,9.13081036 9.18157324,9.24560465 9.09837549,9.32874375 C9.01393142,9.41215029 8.89896465,9.463534 8.77170544,9.463534 L0.461010662,9.463534 C0.334057222,9.463534 0.219089304,9.41259023 0.135717961,9.32967926 C0.05158592,9.24480666 0,9.1300136 0,9.00402285 L0,5.3066871 C0,5.05290609 0.204903893,4.84717595 0.461635805,4.84717595 C0.71659022,4.84717595 0.92327161,5.05449945 0.92327161,5.3066871 L0.92327161,8.54026239 Z'></Path>
//   </G>
// </Svg>

const exportContextShortcut: Shortcut = {
  id: 'exportContext',
  name: 'Export Context',
  description: 'Export the current context as plaintext or html',
  svg: Icon,
  exec: dispatch => dispatch(showModal({ id: 'export' }))
}

export default exportContextShortcut
