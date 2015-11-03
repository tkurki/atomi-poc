import React from "react"
import Bacon from "baconjs"
import {Model as Atom} from "bacon.model"

export const Model = () => {
  const weightAtom = Atom(70)
  const heightAtom = Atom(170)
  return {weightAtom,
          heightAtom,
          bmiStream: Bacon.combineWith(weightAtom, heightAtom, (w, h) =>
                                       Math.round(w/(h * h * 0.0001)))}
}

const Slider = (title, units, min, max, atom) =>
  atom.map(value =>
    <div>
      {title}: {value}{units}
      <div>
        <input type="range" min={min} max={max} value={value}
           onChange={e => atom.set(e.target.value)}/>
      </div>
    </div>)

export const WebControl = ({weightAtom, heightAtom, bmiStream}) =>
  Bacon.combineTemplate(
    <div>
      {Slider("Weight", "kg", 40, 140, weightAtom)}
      {Slider("Height", "cm", 140, 210, heightAtom)}
      BMI: {bmiStream}
    </div>)
