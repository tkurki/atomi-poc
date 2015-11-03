import React from "react"
import Bacon from "baconjs"
import {Model} from "bacon.model"
import {findIndex, flatten, map} from "lodash"

import * as ThreeWayBMI from "./components/three-way-bmi"
import * as BMI from "./components/bmi"

////////////////////////////////////////////////////////////////////////////////

const EnumSelectInput = (alts, selModel) => {
  const options = alts
    .map(alt =>
       <option key={alt.value}
               value={alt.value}>
         {alt.value}
       </option>)

  return selModel.map(alt =>
    <select value={alt.value}
            onChange={e =>
             selModel.set(alts[
               findIndex(alts,
                         alt => alt.value === e.target.value)])}>
      {options}
    </select>)}

const Checkbox = boolModel =>
  boolModel.map(bool =>
    <input type="checkbox"
           onChange={_ => boolModel.set(!bool)}
           checked={bool}/>)

const TextInput = ({type, placeholder, disableds, text: textModel}) =>
  Bacon.combineWith(disableds || Bacon.constant(false), textModel,
                    (disabled, text) =>
    <input type={type || "text"}
           value={text}
           placeholder={placeholder || ""}
           disabled={disabled}
           onChange={e => textModel.set(e.target.value)}/>)

////////////////////////////////////////////////////////////////////////////////

const Counter = countModel =>
  countModel.map(count =>
    <div>
      Counter value is: {count}
      <div>
        <button onClick={_ => countModel.set(count+1)}>+</button>
        <button onClick={_ => countModel.set(count-1)}>-</button>
      </div>
    </div>)

////////////////////////////////////////////////////////////////////////////////

const ThreeCounters = sharedCountModel =>
  Bacon.combineTemplate({
    counter1: Counter(sharedCountModel),
    counter2: Counter(sharedCountModel),
    counter3: Counter(Model(1))
  }).map(s =>
    <div>
      {s.counter1}
      {s.counter2}
      {s.counter3}
    </div>)

////////////////////////////////////////////////////////////////////////////////

const LoginModel = () => {
  const usernameModel = Model("")
  const passwordModel = Model("")
  const loginStatusModel = Model("logged-out")
  return {usernameModel,
          passwordModel,
          loginStatusStream: loginStatusModel,
          login: _  =>
            loginStatusModel.set("request") &&
            Bacon.combineWith(usernameModel, passwordModel, (username, password) =>
                              username === "Model" &&
                              password === "FTW")
              .take(1)
              .flatMap(s => Bacon.later(2000, s))
              .onValue(s => loginStatusModel.set(s ? "logged-in" : "failed")),
          logout: _ => loginStatusModel.set("logged-out")}
}

const Login = ({usernameModel, passwordModel, loginStatusStream, login, logout}) =>
  loginStatusStream.flatMapLatest(loginStatus => {
    switch (loginStatus) {
    case "logged-in":
      return Bacon.constant(<button onClick={logout}>Logout</button>)
    case "request":
      return Bacon.constant(<div>Attempting login...</div>)
    default:
      return Bacon.combineTemplate({
        usernameEdit: TextInput({placeholder: "username", text: usernameModel}),
        passwordEdit: TextInput({type: "password",
                                 placeholder: "password",
                                 text: passwordModel}),
        issues: Bacon.combineWith(usernameModel, passwordModel, (username, password) =>
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
      create: () => ClassyCounter(Model(0))},
     {value: "BMI",
      create: () => BMI.WebControl(BMI.Model())}]

  const createModel = Model(componentCreates[0])

  const componentList =
    componentsModel.flatMapLatest(
      components =>
        Bacon.combineAsArray(components)
        .map(componentDOMs =>
          <ul>
            {(i => map(componentDOMs, componentDOM =>
               <li key={i++}>{componentDOM}</li>))(0)}
          </ul>))

  return Bacon.combineWith(
    EnumSelectInput(componentCreates, createModel),
    componentList,
    createModel,
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
      DOMs: Counter(Model(0))},
     {value: "ClassyCounter",
      path: "/page/classy-counter",
      DOMs: ClassyCounter(Model(0))},
     {value: "ThreeCounters",
      path: "/page/three-counters",
      DOMs: ThreeCounters(Model(0))},
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
      DOMs: ComponentList(Model([]))}]

  const pageIndexOfLocation = () => {
    let path = /^\/page\/[a-z0-9_-]+/.exec(document.location.pathname)
    path = path ? path[0] : ""
    return Math.max(0, findIndex(pages, p => path === p.path))
  }
  const pageModel = Model(pages[pageIndexOfLocation()])
  const pageSelectDOMs = EnumSelectInput(pages, pageModel)

  window.onpopstate = e => pageModel.set(pages[pageIndexOfLocation()])

  return pageModel
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
