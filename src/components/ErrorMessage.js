import React from 'react'
import { connect } from 'react-redux'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import error from '../action-creators/error'

const mapStateToProps = ({ error }) => ({ value: error })

const ErrorMessage = ({ value, dispatch }) =>
  <TransitionGroup>
    {value
      ? <CSSTransition key={0} timeout={200} classNames='fade'>
        <div className='error-message'>
          {value.toString()}
          <a className='upper-right status-close-x text-small' onClick={() => dispatch(error(null))}>✕</a>
        </div>
      </CSSTransition>
      : null}
  </TransitionGroup>

export default connect(mapStateToProps)(ErrorMessage)
