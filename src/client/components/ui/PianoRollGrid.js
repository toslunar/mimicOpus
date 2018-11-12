import Immutable from 'immutable';
import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from '@material-ui/core/Tooltip';

import SimpleGrid from './SimpleGrid';
import NoteBlock from './NoteBlock';
import PositionBar from './PositionBar';
import Note from '../../data/note';

class PianoRollGrid extends React.Component { // グリッドエリア + yラベル
  /*
    pitchRange: [最小ノートナンバー, 最大ノートナンバー]
  */
  constructor(props) {
    const { pitchRange } = props;
    super(props);
    this.state = {
      uw: 28, // unit width (1 column width)
      uh: 20, // unit height (1 row height)
      rows: pitchRange[1] - pitchRange[0] + 1,
      cols: 32,
      xMargin: 36,
      selectRange: null,
      beatPerCol: 0.5, // グリッド刻み（拍数）
    };
    // 上下キー対応
    window.onkeydown = (e => this.keyDown(e));

    this.wheel = this.wheel.bind(this);
    this.mouseDown = this.mouseDown.bind(this);
    this.mouseUp = this.mouseUp.bind(this);
    this.mouseMove = this.mouseMove.bind(this);

    this.timer = setInterval(this.updateCurrentPosition.bind(this), 50);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  updateCurrentPosition() {
    const { soundPlayer, } = this.props;
    const { xMargin, cols, beatPerCol } = this.state;
    if (typeof this.positionBar !== 'undefined') {
      let currentBeat = soundPlayer.position(); // 拍数
      currentBeat = Math.min(currentBeat, cols * beatPerCol);
      const currentPosition = xMargin + this.beatPitchToRelPos([currentBeat, 0])[0]; // x絶対座標
      this.positionBar.updateCurrentPosition(currentPosition);
    }
  }

  keyDown(event) {
    const { shiftPitchRange } = this.props;
    if (event.keyCode === 38) { // up key
      shiftPitchRange(1);
    } else if (event.keyCode === 40) { // down key
      shiftPitchRange(-1);
    }
  }

  wheel(event) {
    const { pitchRange, shiftPitchRange } = this.props;
    if (event.deltaY < 0 && pitchRange[1] < 127) {
      shiftPitchRange(1);
    } else if (event.deltaY > 0 && pitchRange[0] > 0) {
      shiftPitchRange(-1);
    }
  }

  mouseDown(event) {
    const { xMargin } = this.state;

    // 要素の位置を取得
    const clientRect = this.mainPianoRoll.getBoundingClientRect();
    const originPos = [
      clientRect.left + window.pageXOffset + xMargin,
      clientRect.top + window.pageYOffset,
    ];
    const relPos = [
      event.pageX - originPos[0],
      event.pageY - originPos[1],
    ];
    this.setState({
      dragInfo: {
        originPos,
        startRelPos: relPos,
      },
      selectRange: this.calculateSelectRangeByTwoRelPos(relPos, relPos),
    });
  }

  mouseMove(event) {
    const { dragInfo } = this.state;
    if (dragInfo !== undefined) {
      const currentRelPos = [
        event.pageX - dragInfo.originPos[0],
        event.pageY - dragInfo.originPos[1],
      ];
      this.setState({
        selectRange: this.calculateSelectRangeByTwoRelPos(dragInfo.startRelPos, currentRelPos),
      });
    }
  }

  mouseUp() {
    const { addNote, soundPlayer } = this.props;
    const { selectRange } = this.state;

    // ノーツを発生させる
    if (selectRange !== null) {
      if (selectRange[0] < selectRange[2]) { // 長さゼロ区間の場合を除く
        if (soundPlayer) { // 音プレビュー
          soundPlayer.preview(selectRange[1]);
        }
        const note = new Note({
          start: selectRange[0],
          end: selectRange[2],
          pitch: selectRange[1],
        });
        addNote(note);
        this.setState({ dragInfo: undefined, selectRange: null });
      }
    }
  }

  relPosToBeatPitch(relPos) { // relPos: グリッド左上からの座標ずれ, beatPitch: 拍とピッチ
    const { pitchRange } = this.props;
    const { uw, uh, beatPerCol } = this.state;
    return [
      relPos[0] / uw * beatPerCol,
      pitchRange[1] + 0.5 - relPos[1] / uh,
    ];
  }

  beatPitchToRelPos(beatPitch) { // beatPitch: 拍とピッチ, relPos: グリッド左上からの座標ずれ
    const { pitchRange } = this.props;
    const { uw, uh, beatPerCol } = this.state;
    return [
      beatPitch[0] / beatPerCol * uw,
      (pitchRange[1] + 0.5 - beatPitch[1]) * uh,
    ];
  }

  calculateSelectRangeByTwoRelPos(relPos1, relPos2, onePitch = true) {
    const { cols, beatPerCol } = this.state;

    const tp1 = this.relPosToBeatPitch(relPos1);
    const tp2 = this.relPosToBeatPitch(relPos2);
    let range;
    if (onePitch) {
      range = [
        Math.max(0, Math.floor(Math.min(tp1[0], tp2[0]) / beatPerCol) * beatPerCol),
        Math.max(0, Math.round(tp1[1])),
        Math.min(cols, Math.ceil(Math.max(tp1[0], tp2[0]) / beatPerCol) * beatPerCol),
        Math.min(127, Math.round(tp1[1])),
      ];
    } else {
      range = [
        Math.max(0, Math.floor(Math.min(tp1[0], tp2[0]) / beatPerCol) * beatPerCol),
        Math.max(0, Math.round(Math.min(tp1[1], tp2[1]))),
        Math.min(cols, Math.ceil(Math.max(tp1[0], tp2[0]) / beatPerCol) * beatPerCol),
        Math.min(127, Math.round(Math.max(tp1[1], tp2[1]))),
      ];
    }
    return range;
  }

  render() {
    const {
      pitchRange, notes, delNote, soundPlayer,
    } = this.props;
    const {
      rows, cols, uw, uh, xMargin, selectRange, beatPerCol,
    } = this.state;

    const elementList = [];

    // grid
    const isBlackKey = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
    const bgr = [];
    for (let i = 0; i < rows; i += 1) {
      const pitch = pitchRange[1] - i;
      bgr.push(isBlackKey[pitch % 12] ? '#EEEEFF' : '#FFFFFF');
    }
    const hlw = [...Array(rows + 1).keys()].map(i => 1 + (
      ((pitchRange[1] + 1 - i) % 12) ? 0 : 1
    ));
    const vlw = [...Array(cols + 1).keys()].map(
      i => 0.25 + ((i % 2) ? 0 : 0.75) + ((i % 8) ? 0 : 1)
    );
    elementList.push(

      <Tooltip title="ドラッグして音を入力">
        <div
          key={elementList.length}
          style={{
            position: 'absolute',
            left: xMargin,
            width: uw * cols,
            height: uh * rows,
          }}
        >
          <SimpleGrid rows={rows} cols={cols} uw={uw} uh={uh} hlw={hlw} vlw={vlw} bgr={bgr} />
        </div>
      </Tooltip>,
    );

    // yLabel (i.e. pitch name)
    const pitchName = ['C', '', 'D', '', 'E', 'F', '', 'G', '', 'A', '', 'B'];
    for (let i = 0; i < rows; i += 1) {
      const pitch = pitchRange[1] - i;
      let label = pitchName[pitch % 12];
      if (label === 'C') label += (pitch / 12 - 1);
      elementList.push(
        <div
          key={elementList.length}
          style={{
            position: 'absolute',
            left: 0,
            top: uh * i,
          }}
          draggable={false}
        >
          {label}
        </div>,
      );
    }

    // notes
    for (let i = 0; i < notes.size; i += 1) {
      const note = notes.get(i);
      if (pitchRange[0] <= note.pitch && note.pitch <= pitchRange[1]) {
        const leftBottom = this.beatPitchToRelPos([
          note.start, note.pitch - 0.5,
        ]);
        const rightTop = this.beatPitchToRelPos([
          note.end, note.pitch + 0.5,
        ]);
        const divStyle = {
          position: 'absolute',
          top: rightTop[1],
          left: xMargin + leftBottom[0],
        };
        elementList.push(
          <div key={elementList.length} style={divStyle}>
            <NoteBlock
              start={note.start}
              end={note.end}
              uw={uw}
              beatPerCol={beatPerCol}
              uh={uh}
              pitch={note.pitch}
              parent={this}
              dictKey={i}
              delNote={() => delNote(i)}
            />
          </div>,
        );
      }
    }

    // current position bar
    elementList.push(
      <PositionBar
        soundPlayer={soundPlayer}
        height={uh * rows}
        parent={this}
        ref={(node) => { this.positionBar = node; }}
      />
    );

    // selection
    if (selectRange !== null) {
      // [startBeat (decimal), minPitch (integer), endBeat (decimal), maxPitch (integer)]
      const leftBottom = this.beatPitchToRelPos([
        selectRange[0], selectRange[1] - 0.5,
      ]);
      const rightTop = this.beatPitchToRelPos([
        selectRange[2], selectRange[3] + 0.5,
      ]);
      const divStyle = {
        width: rightTop[0] - leftBottom[0],
        height: leftBottom[1] - rightTop[1],
        border: '1px dashed #f00',
        borderRadius: 10,
        position: 'absolute',
        top: rightTop[1],
        left: xMargin + leftBottom[0],
      };
      elementList.push(<div key={elementList.length} style={divStyle} />);
    }

    return (
      <div
        role="presentation"
        style={{ position: 'absolute', top: 100, cursor: 'pointer' }}
        ref={(mainPianoRoll) => { this.mainPianoRoll = mainPianoRoll; }}
        onWheel={this.wheel}
        onMouseDown={this.mouseDown}
        onMouseUp={this.mouseUp}
        onMouseMove={this.mouseMove}
      >
        {elementList}
      </div>
    );
  }
}

PianoRollGrid.propTypes = {
  notes: PropTypes.instanceOf(Immutable.List).isRequired,
  pitchRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  shiftPitchRange: PropTypes.func.isRequired,
  addNote: PropTypes.func.isRequired,
  delNote: PropTypes.func.isRequired,
  soundPlayer: PropTypes.object.isRequired,
};

export default PianoRollGrid;
