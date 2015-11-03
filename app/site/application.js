import React from "react"
import Bacon from "baconjs"
import {Model as Atom} from "bacon.model"
import {findIndex, flatten, map} from "lodash"

import * as ThreeWayBMI from "./components/three-way-bmi"
import * as BMI from "./components/bmi"
import * as Counter from "./components/counter"
import * as ThreeCounters from "./components/three-counters"
import OptionSelect from "./components/option-select"

////////////////////////////////////////////////////////////////////////////////

const Checkbox = boolModel =>
  boolModel.map(bool =>
    <input type="checkbox"
           onChange={_ => boolModel.set(!bool)}
           checked={bool}/>)

const TextInput = ({type, placeholder, disableds, text: textAtom}) =>
  Bacon.combineWith(disableds || Bacon.constant(false), textAtom,
                    (disabled, text) =>
    <input type={type || "text"}
           value={text}
           placeholder={placeholder || ""}
           disabled={disabled}
           onChange={e => textAtom.set(e.target.value)}/>)

////////////////////////////////////////////////////////////////////////////////

const LoginModel = () => {
  const usernameAtom = Atom("")
  const passwordAtom = Atom("")
  const loginStatusAtom = Atom("logged-out")
  return {usernameAtom,
          passwordAtom,
          loginStatusStream: loginStatusAtom,
          login: _  =>
            loginStatusAtom.set("request") &&
            Bacon.combineWith(usernameAtom, passwordAtom, (username, password) =>
                              username === "Model" &&
                              password === "FTW")
              .take(1)
              .flatMap(s => Bacon.later(2000, s))
              .onValue(s => loginStatusAtom.set(s ? "logged-in" : "failed")),
          logout: _ => loginStatusAtom.set("logged-out")}
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

const ComponentList = componentsModel => {
  const componentCreates =
    [{value: "ClassyCounter",
      create: () => ClassyCounter(Atom(0))},
     {value: "BMI",
      create: () => BMI.WebControl(BMI.Model())}]

  const createAtom = Atom(componentCreates[0])

  const componentList =
    componentsModel.flatMapLatest(
      components =>
        Bacon.combineWith(
          components,
          (...componentDOMs) =>
          <ul>
            {(i => map(componentDOMs, componentDOM =>
               <li key={i++}>{componentDOM}</li>))(0)}
          </ul>))

  return Bacon.combineWith(
    OptionSelect(Bacon.constant(componentCreates), createAtom),
    componentList,
    createAtom,
    (componentSelect, componentList, create) =>
      <div>
        {componentSelect}
        <button
           onClick={_ =>
             componentsModel.modify(cs => cs.concat(create.create()))}>
          Create New
        </button>
        {componentList}
      </div>)
}

////////////////////////////////////////////////////////////////////////////////

const DivClass = React.createClass({
  componentDidMount: function() {
    this.props.didMount()
  },
  componentDidUpdate: function() {
    this.props.didUpdate()
  },
  render: function() {
    return <div>{this.props.children}</div>
  }
})

const ClassyCounter = countModel =>
  countModel.map(count =>
    <DivClass
      didMount={() => console.log("componentDidMount!")}
      didUpdate={() => console.log("componentDidUpdate!")}>
      Counter value is: {count}
      <div>
        <button onClick={_ => countModel.set(count+1)}>+</button>
        <button onClick={_ => countModel.set(count-1)}>-</button>
      </div>
    </DivClass>)

////////////////////////////////////////////////////////////////////////////////

export default () => {

  const pages =
    [{value: "Counter",
      path: "/page/counter",
      DOMs: Counter.WebControl(Counter.Model(0))},
     {value: "ClassyCounter",
      path: "/page/classy-counter",
      DOMs: ClassyCounter(Atom(0))},
     {value: "ThreeCounters",
      path: "/page/three-counters",
      DOMs: ThreeCounters.WebControl(ThreeCounters.Model(0))},
     {value: "BMI",
      path: "/page/bmi",
      DOMs: BMI.WebControl(BMI.Model())},
     {value: "3-way BMI",
      path: "/page/3-way-bmi",
      DOMs: ThreeWayBMI.WebControl(ThreeWayBMI.Model())},
     {value: "Login",
      path: "/page/login",
      DOMs: Login(LoginModel())},
     {value: "Component List",
      path: "/page/component-list",
      DOMs: ComponentList(Atom([]))}]

  const pageIndexOfLocation = () => {
    let path = /^\/page\/[a-z0-9_-]+/.exec(document.location.pathname)
    path = path ? path[0] : ""
    return Math.max(0, findIndex(pages, p => path === p.path))
  }
  const pageAtom = Atom(pages[pageIndexOfLocation()])
  const pageSelectDOMs =
    OptionSelect(Bacon.constant(pages), pageAtom)

  window.onpopstate = e => pageAtom.set(pages[pageIndexOfLocation()])

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
