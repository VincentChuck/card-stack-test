import * as React from 'react'
import { useState } from 'react'
import { useSprings, animated, to as interpolate } from '@react-spring/web'
import { useDrag } from 'react-use-gesture'

import styles from './styles.module.css'

const cards = [
  'https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/9/9b/RWS_Tarot_07_Chariot.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/RWS_Tarot_02_High_Priestess.jpg/690px-RWS_Tarot_02_High_Priestess.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg',
]

// These two are just helpers, they curate spring data, values that are later being interpolated into css
const to = (i: number) => ({
  x: 0,
  y: i * -4,
  scale: 1,
  rot: -10 + Math.random() * 20,
  delay: i * 100,
})
const from = (_i: number) => ({ x: 0, rot: 0, scale: 1.5, y: -1000 })
// This is being used down there in the view, it interpolates rotation and scale into a css transform
const trans = (r: number, s: number) =>
  `perspective(1500px) rotateX(30deg) rotateY(${r / 10}deg) rotateZ(${r}deg) scale(${s})`

function Deck() {
  const [gone] = useState(() => new Set()) // The set flags all the cards that are flicked out
  const [props, api] = useSprings(cards.length, i => ({
    ...to(i),
    from: from(i),
  })) // Create a bunch of springs using the helpers above
  // Create a gesture, we're interested in down-state, delta (current-pos - click-pos), direction and velocity
  const bind = useDrag(({ args: [index], down, movement: [mx, my], direction: [xDir, yDir], velocity }) => {
    const trigger = velocity > 0.2 // If you flick hard enough it should trigger the card to fly out

    const xSign = xDir < 0 ? -1 : 1
    const ySign = yDir < 0 ? -1 : 1

    let xGoneDest = 0
    let yGoneDest = 0

    // Target destination of cards flicked out of view
    const xGoneTarget = xSign * (window.innerWidth / 2 + 400)
    const yGoneTarget = ySign * (window.innerHeight / 2 + 400)

    if (!down && trigger) {
      gone.add(index) // If button/finger's up and trigger velocity is reached, we flag the card ready to fly out

      // Actual destination of cards calculated based on flick velocity and direction
      const travelDuration = Math.max(Math.abs(xGoneTarget - mx), Math.abs(yGoneTarget - my)) / velocity
      xGoneDest = mx + xDir * velocity * travelDuration
      yGoneDest = my + yDir * velocity * travelDuration
    }
    api.start(i => {
      if (index !== i) return // We're only interested in changing spring-data for the current spring
      const isGone = gone.has(index)

      const x = isGone ? xGoneDest : down ? mx : 0
      const y = isGone ? yGoneDest : down ? my : 0
      const rot = mx / 100 + (isGone ? xSign * 10 * velocity : 0) // How much the card tilts, flicking it harder makes it rotate faster
      const scale = down ? 1.1 : 1 // Active cards lift up a bit
      return {
        x,
        y,
        rot,
        scale,
        delay: undefined,
        config: { friction: 50, tension: down ? 800 : isGone ? 200 : 500 },
      }
    })
    if (!down && gone.size === cards.length)
      setTimeout(() => {
        gone.clear()
        api.start(i => to(i))
      }, 600)
  })
  // Now we're just mapping the animated values to our view, that's it. Btw, this component only renders once. :-)
  return (
    <>
      {props.map(({ x, y, rot, scale }, i) => (
        <animated.div className={styles.deck} key={i} style={{ x, y }}>
          {/* This is the card itself, we're binding our gesture to it (and inject its index so we know which is which) */}
          <animated.div
            {...bind(i)}
            style={{
              transform: interpolate([rot, scale], trans),
              backgroundImage: `url(${cards[i]})`,
            }}
          />
        </animated.div>
      ))}
    </>
  )
}

export default function App() {
  return (
    <div className={styles.container}>
      <Deck />
    </div>
  )
}
