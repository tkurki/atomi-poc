import React from "react"
import Bacon from "baconjs"
import {Model as Atom} from "bacon.model"

import * as Counter from "./counter"

export const Model = Atom

export const WebControl = sharedCounterModel =>
  Bacon.combineTemplate({
    counter1: Counter.WebControl(sharedCounterModel),
    counter2: Counter.WebControl(sharedCounterModel),
    counter3: Counter.WebControl(Counter.Model(1))
  }).map(s =>
    <div>
      {s.counter1}
      {s.counter2}
      {s.counter3}
    </div>)
