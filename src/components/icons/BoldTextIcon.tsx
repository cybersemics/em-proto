import React from 'react'
import Icon from '../../@types/Icon'

/** Bold icon. */
const BoldTextIcon = ({ style, size = 20 }: Icon) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      version='1.1'
      x='0'
      y='0'
      viewBox='-200 -210 900 900'
      className='icon'
      width={size}
      height={size}
      style={{ ...style }}
    >
      <path d='m404.313 266.52c-9.383-11.541-19.191-19.99-27.108-25.837 18.534-25.621 28.924-58.348 28.924-92.28 0-46.274-17.756-84.799-51.349-111.41-29.672-23.504-71.334-36.642-117.311-36.993h-162.31v512s212.5.009 212.503.009c36.95 0 74.207-15.054 102.216-41.302 30.291-28.386 46.973-67.011 46.973-108.76-.001-36.764-10.948-68.871-32.538-95.427zm-238.154-175.52 71.409-.001c21.432-.306 29.869-.037 40.465 4.206 10.466 4.139 19.681 11.152 25.949 19.749l.246.329c13.362 17.309 15.674 42.932 5.621 62.309l-.149.296c-9.743 19.844-31.044 33.116-53.09 33.115-.118 0-90.451-.001-90.451-.001zm175.504 292.772-.138.333c-8.66 21.68-31.841 37.158-55.172 36.896l-120.194-.001v-120s91.557.057 98.017.007c13.222-.103 26.9-.208 33.651 1.154 11.55 2.313 22.208 8.011 30.886 16.54 16.693 16.214 22.14 43.58 12.95 65.071z'></path>
    </svg>
  )
}

export default BoldTextIcon
