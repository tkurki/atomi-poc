import React from "react"
import Bacon from "baconjs"
import {Model as Atom} from "bacon.model"

export const Model = Atom

export const WebControl = countModel =>
  countModel.map(count =>
    <div>
      Counter value is: {count}
      <div>
        <button onClick={_ => countModel.set(count+1)}>+</button>
        <button onClick={_ => countModel.set(count-1)}>-</button>
      </div>
    </div>)
