import React from "react"
import Bacon from "baconjs"
import {findIndex, flatten, map} from "lodash"

////////////////////////////////////////////////////////////////////////////////

function Atom(initial) {
  const bus = new Bacon.Bus()
  const stream = bus.scan(initial, (state, fn) => fn(state))
  stream.reset = v => bus.push(_ => v)
  stream.swap = fn => bus.push(fn)
  return stream
}

////////////////////////////////////////////////////////////////////////////////

const EnumSelectInput = (alts, selAtom) => {
  const options = alts
    .map(alt =>
       <option key={alt.value}
               value={alt.value}>
         {alt.value}
       </option>)

  return selAtom.map(alt =>
    <select value={alt.value}
            onChange={e =>
             selAtom.reset(alts[
               findIndex(alts,
                         alt => alt.value === e.target.value)])}>
      {options}
    </select>)}

const Checkbox = boolAtom =>
  boolAtom.map(bool =>
    <input type="checkbox"
           onChange={_ => boolAtom.reset(!bool)}
           checked={bool}/>)

const TextInput = ({type, placeholder, disableds, text: textAtom}) =>
  Bacon.combineWith(disableds || Bacon.constant(false), textAtom,
                    (disabled, text) =>
    <input type={type || "text"}
           value={text}
           placeholder={placeholder || ""}
           disabled={disabled}
           onChange={e => textAtom.reset(e.target.value)}/>)

////////////////////////////////////////////////////////////////////////////////

const Counter = countAtom =>
  countAtom.map(count =>
    <div>
      Counter value is: {count}
      <div>
        <button onClick={_ => countAtom.reset(count+1)}>+</button>
        <button onClick={_ => countAtom.reset(count-1)}>-</button>
      </div>
    </div>)

////////////////////////////////////////////////////////////////////////////////

const ThreeCounters = sharedCountAtom =>
  Bacon.combineTemplate({
    counter1: Counter(sharedCountAtom),
    counter2: Counter(sharedCountAtom),
    counter3: Counter(Atom(1))
  }).map(s =>
    <div>
      {s.counter1}
      {s.counter2}
      {s.counter3}
    </div>)

////////////////////////////////////////////////////////////////////////////////

const LoginModel = () => {
  const usernameAtom = Atom("")
  const passwordAtom = Atom("")
  const loginStatusAtom = Atom("logged-out")
  return {usernameAtom,
          passwordAtom,
          loginStatusStream: loginStatusAtom,
          login: _  =>
            loginStatusAtom.reset("request") &&
            Bacon.combineWith(usernameAtom, passwordAtom, (username, password) =>
                              username === "Atomi" &&
                              password === "Rulez")
              .take(1)
              .flatMap(s => Bacon.later(2000, s))
              .onValue(s => loginStatusAtom.reset(s ? "logged-in" : "failed")),
          logout: _ => loginStatusAtom.reset("logged-out")}
}

const Login = ({usernameAtom, passwordAtom, loginStatusStream, login, logout}) =>
  loginStatusStream.flatMapLatest(loginStatus => {
    switch (loginStatus) {
    case "logged-in":
      return Bacon.constant(<button onClick={logout}>Logout</button>)
    case "request":
      return Bacon.constant(<div>Attempting login...</div>)
    default:
      return Bacon.combineTemplate({
        usernameEdit: TextInput({placeholder: "username", text: usernameAtom}),
        passwordEdit: TextInput({type: "password",
                                 placeholder: "password",
                                 text: passwordAtom}),
        issues: Bacon.combineWith(usernameAtom, passwordAtom, (username, password) =>
                                  flatten([username.length > 0 ? [] : ["Name?"],
                                           password.length > 0 ? [] : ["Pass?"]])),
      }).map(s =>
           <div>
             {s.usernameEdit}<br/>
             {s.passwordEdit}<br/>
             <button onClick={login}
                     disabled={s.issues.length > 0}>
               {s.issues.length > 0 ? s.issues.join(' ') : "Login"}
             </button>
           </div>)
    }})

////////////////////////////////////////////////////////////////////////////////

const BMIModel = () => {
  const weightAtom = Atom(70)
  const heightAtom = Atom(170)
  return {weightAtom,
          heightAtom,
          bmiStream: Bacon.combineWith(weightAtom, heightAtom, (w, h) =>
                                       Math.round(w/(h * h * 0.0001)))}
}

const BMI = ({weightAtom, heightAtom, bmiStream}) => {
  const Slider = (title, units, min, max, atom) =>
    atom.map(value =>
      <div>
        {title}: {value}{units}
        <div>
          <input type="range" min={min} max={max} value={value}
             onChange={e => atom.reset(e.target.value)}/>
        </div>
      </div>)

  return Bacon.combineWith(
    Slider("Weight", "kg", 40, 140, weightAtom),
    Slider("Height", "cm", 140, 210, heightAtom),
    bmiStream,
    (weightSlider, heightSlider, bmi) =>
      <div>
        {weightSlider}
        {heightSlider}
        BMI: {bmi}
      </div>)
}

////////////////////////////////////////////////////////////////////////////////

const ThreeWayBMIModel = () => {
  const complete = m => {
    if (m.weight && m.height) {
      return {...m, bmi: Math.round(m.weight / (m.height * m.height * 0.0001))}
    } else if (m.weight && m.bmi) {
      return {...m, height: Math.round(Math.sqrt(m.weight / m.bmi) * 100)}
    } else {
      return {...m, weight: Math.round(m.bmi * m.height * m.height * 0.0001)}
    }
  }

  const modelAtom = Atom({weight: 70, height: 170})

  return {modelAtom, completedStream: modelAtom.map(complete)}
}

const ThreeWayBMI = ({modelAtom, completedStream}) => {
  const lockedAtom = Atom('bmi')

  const Slider = (title, units, prop, min, max) =>
    Bacon.combineWith(completedStream, lockedAtom, (c, locked) =>
      <div>
        <input type="checkbox"
               onChange={_ => lockedAtom.reset(prop)}
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
               modelAtom.reset(m)}}/>
        </div>
      </div>)

  return Bacon.combineWith(
    Slider("Weight", "kg", 'weight', 40, 140),
    Slider("Height", "cm", 'height', 140, 210),
    Slider("BMI: ", "kg/m^2", 'bmi', 10, 40),
    (weightSlider, heightSlider, bmiSlider) =>
      <div>
        {weightSlider}
        {heightSlider}
        {bmiSlider}
      </div>)
}

////////////////////////////////////////////////////////////////////////////////

const ComponentList = componentsAtom => {
  const componentCreates =
    [{value: "Counter",
      create: () => Counter(Atom(0))},
     {value: "BMI",
      create: () => BMI(BMIModel())}]

  const createAtom = Atom(componentCreates[0])

  const componentList =
    componentsAtom.flatMapLatest(
      components =>
        Bacon.combineAsArray(components)
        .map(componentDOMs =>
          <ul>
            {(i => map(componentDOMs, componentDOM =>
               <li key={i++}>{componentDOM}</li>))(0)}
          </ul>))

  return Bacon.combineWith(
    EnumSelectInput(componentCreates, createAtom),
    componentList,
    createAtom,
    (componentSelect, componentList, create) =>
      <div>
        {componentSelect}
        <button
           onClick={_ =>
             componentsAtom.swap(cs => cs.concat([create.create()]))}>
          Create New
        </button>
        {componentList}
      </div>)
}


////////////////////////////////////////////////////////////////////////////////

export default () => {

  const pages =
    [{value: "Counter",
      path: "/page/counter",
      DOMs: Counter(Atom(0))},
     {value: "ThreeCounters",
      path: "/page/three-counters",
      DOMs: ThreeCounters(Atom(0))},
     {value: "BMI",
      path: "/page/bmi",
      DOMs: BMI(BMIModel())},
     {value: "3-way BMI",
      path: "/page/3-way-bmi",
      DOMs: ThreeWayBMI(ThreeWayBMIModel())},
     {value: "Login",
      path: "/page/login",
      DOMs: Login(LoginModel())},
     {value: "Component List",
      path: "/page/component-list",
      DOMs: ComponentList(Atom([]))}]

  const pageIndexOfLocation = () => {
    const path = document.location.pathname
    return Math.max(0, findIndex(pages, p => path.indexOf(p.path) === 0))
  }
  const pageAtom = Atom(pages[pageIndexOfLocation()])
  const pageSelectDOMs = EnumSelectInput(pages, pageAtom)

  window.onpopstate = e => pageAtom.reset(pages[pageIndexOfLocation()])

  return pageAtom
    .flatMapLatest(page => {
      if (document.location.pathname !== page.path)
        window.history.pushState(null, "", page.path)
      return Bacon.combineWith(
        pageSelectDOMs, page.DOMs,
        (pageSelectDOM, pageDOM) =>
          <div>
            {pageSelectDOM}
            <hr/>
            {pageDOM}
          </div>)
    })
}
