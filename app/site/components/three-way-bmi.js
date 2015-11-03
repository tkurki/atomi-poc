import React from "react"
import Bacon from "baconjs"
import {Model as Atom} from "bacon.model"

export const Model = () => {
  const complete = m =>
    !m.bmi ? {...m, bmi: Math.round(m.weight / (m.height * m.height * 0.0001))}
    : !m.height ? {...m, height: Math.round(Math.sqrt(m.weight / m.bmi) * 100)}
    : {...m, weight: Math.round(m.bmi * m.height * m.height * 0.0001)}

  const partialAtom = Atom({weight: 70, height: 170})

  return {partialAtom, completedStream: partialAtom.map(complete)}
}

export const WebControl = ({partialAtom, completedStream}) => {
  const lockedAtom = Atom('bmi')

  const Slider = (title, units, prop, min, max) =>
    Bacon.combineWith(completedStream, lockedAtom, (c, locked) =>
      <div>
        <input type="checkbox"
               onChange={_ => lockedAtom.set(prop)}
               disabled={locked === prop}
               checked={locked === prop}/>
        {title}: {c[prop]}{units}
        <div>
          <input type="range" min={min} max={max} value={c[prop]}
             disabled={locked === prop}
             onChange={e => {
               const m = {weight: c.weight, height: c.height, bmi: c.bmi}
               delete m[locked]
               m[prop] = e.target.value
               partialAtom.set(m)}}/>
        </div>
      </div>)

  return Bacon.combineTemplate(
    <div>
      {Slider("Weight", "kg", 'weight', 40, 140)}
      {Slider("Height", "cm", 'height', 140, 210)}
      {Slider("BMI: ", "kg/m^2", 'bmi', 10, 40)}
    </div>)
}
