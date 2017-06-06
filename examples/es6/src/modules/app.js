import React from 'react';
import style from './style'

export default class App extends React.Component {
  constructor (props) {
    super(props);
    console.log(document.body.clientWidth)
    this.state = { playing: true }
  }



  onMouseEnter (item) {
    //console.log(item)
  }

  onButtonClick (item) {
      if (this.state.playing) {
        this.refs[item.index + 'video'].pause()
      } else {
        this.refs[item.index + 'video'].play()
      }
      this.setState({
        playing: !this.state.playing
      })
  }


  render() {   
    const listItems = this.props.items.map((item) =>
      <li style={style.item} key={item.index} onClick={this.props.onItemClick.bind(this, item)}>
            <div style={style.item.img} onMouseOver={this.onMouseEnter.bind(this, item)}>
              <img src={item.img} onClick={this.props.onImageClick.bind(this, item)}/>
            </div>  
            <div style={style.item.flexColumn}>
              <div>
                <button onClick={this.onButtonClick.bind(this, item)}>{item.button}</button>
              </div>
              <div>
                  <video ref={item.index + 'video'} id={item.index + 'video'}
                         style={style.item.video}
                         src="http://download.blender.org/peach/trailer/trailer_1080p.ogg"
                         autoPlay
                         poster="http://www.webmfiles.org/wp-content/uploads/2010/05/webm-file.jpg"
                  ></video>
              </div>
            </div>
      </li>
    );
    return (
      <div style={style.container}>
        <ul>
          {listItems}
        </ul>
      </div>
    );    
  }
}