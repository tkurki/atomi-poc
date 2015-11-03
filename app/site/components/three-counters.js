import React from "react"
import Bacon from "baconjs"
import {Model as Atom} from "bacon.model"

import * as Counter from "./counter"

export const Model = Atom

export const WebControl = sharedCounterModel =>
  Bacon.combineTemplate(
    <div>
      {Counter.WebControl(sharedCounterModel)}
      {Counter.WebControl(sharedCounterModel)}
      {Counter.WebControl(Counter.Model(1))}
    </div>)
