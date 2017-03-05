import React from 'react'
import ReactDOM from 'react-dom'
import remoteDOM from 'remoteDOM'
import App from './app'

self.window = remoteDOM.window
self.document = remoteDOM.document
remoteDOM.setChannel(self)

class AppContainer {
    constructor(items = [], onItemClick = (item)=> console.log(item), onImageClick = (item)=> console.log(item), onButtonClick = (item)=> console.log(item)) {
        this.items = items
        this.onItemClick = onItemClick
        this.onImageClick = onImageClick
        this.onButtonClick = onButtonClick   
    }
}

const items = [
    {index:0, title: 'title 1', description: 'description 1', button: 'click me', img: 'https://static.wixstatic.com/media/c7ad2b64020342d0ae1a1feace158fe9.jpg/v1/fill/w_330,h_200,al_c,q_80,usm_0.66_1.00_0.01/c7ad2b64020342d0ae1a1feace158fe9.webp'},
    {index:1, title: 'title 2', description: 'description 2', button: 'press here', img: 'https://static.wixstatic.com/media/8d13be_36d622561b4c453794c71ba4de8aea99.png/v1/fill/w_330,h_200,al_c,usm_0.66_1.00_0.01/8d13be_36d622561b4c453794c71ba4de8aea99.png'}
]

const props = new AppContainer(items)
const renderElement = props => ReactDOM.render(React.createElement(App, props), remoteDOM.createContainer())
renderElement(props)


self.API = {
    getItems: function () {
        return items
    },
    setItems: function (items) {
        props.items = items
        renderElement(props)
    },
    onItemClick: function (onItemClick) {
        props.onItemClick = onItemClick
        renderElement(props)
    },
    onImageClick: function (onImageClick) {
        props.onImageClick = onImageClick
        renderElement(props)
    },
    onButtonClick: function (onButtonClick) {
        props.onButtonClick = onButtonClick
        renderElement(props)
    }
}