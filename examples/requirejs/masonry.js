/**
 * Created by avim on 22/12/2016.
 */
define(['react'], function (React) {
    const css = `
.container {
  position: relative;
  width: 600px;
}
.box {
    color: white;
    text-align: center;
    font-size: 18pt;
    width: 180px;
    margin: 10px;
    position: absolute;
    background: red;
    box-sizing: border-box;
}
`;

    function randInt(v) {
        return Math.floor(Math.random() * v);
    }


    const Masonry = (props) => React.createElement('div', Object.assign({ref: masonryRef => {
        masonryRef.invokeNative('masonry', props.columns)
    }}, props), props.children);


    const App = React.createClass({
        getInitialState: ()=> {
            return {
                items: Array(20).fill().map(() => {
                    return randInt(20) * 10 + 20;
                })
            };
        },
        render: function () {
            console.log(this.state.items);
            return React.createElement(
                "div",
                { style: { minHeight: 50 } },
                React.createElement("style", { dangerouslySetInnerHTML: { __html: css } }),
                React.createElement(
                    Masonry,
                    { columns: 3, className: "container" },
                    this.state.items.map((h, index) => React.createElement(
                        "div",
                        { className: "box", style: { height: h + 'px' }, key: 'box' + index },
                        index
                    ))
                )
            );
        }
    });

    return App;
});