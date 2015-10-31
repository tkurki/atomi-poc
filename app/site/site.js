import ReactDOM from "react-dom"
import getAppDOMs from "./application"

const appElem = document.getElementById("app")
getAppDOMs().onValue(appDOM => ReactDOM.render(appDOM, appElem))
