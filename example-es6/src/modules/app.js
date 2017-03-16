import React from 'react';
import style from './style'

export default class App extends React.Component {
  constructor (props) {
    super(props);        
  }

  onMouseEnter (item) {
    console.log(item)
  }

  onButtonClick (item) {
      this.refs[item.index + 'video'].pause()
      //console.log(this.refs[item.index + 'video'].src)
  }


  render() {   
    const listItems = this.props.items.map((item) =>
      <li style={style.item} key={item.index} onClick={this.props.onItemClick.bind(this, item)}>
            <div style={style.item.img} onMouseOver={this.onMouseEnter.bind(this, item)}>
              <img src={item.img} onClick={this.props.onImageClick.bind(this, item)}/>
            </div>  
            <div style={style.item.flexColumn}>              
                <div style={style.item.item}>{item.title}</div>
                <div style={style.item.item1}>{item.description}</div>                  
              <div>
                <button onClick={this.onButtonClick.bind(this, item)}>{item.button}</button>
              </div>
              <div>
                  <video ref={item.index + 'video'} id={item.index + 'video'}
                         src="http://video.webmfiles.org/big-buck-bunny_trailer.webm"
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