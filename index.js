// init
const AudioContext = window.AudioContext || window.webkitAudioContext;

const audioContext = new AudioContext();

// nodes
const audioElement = document.querySelector('audio');

const track = audioContext.createMediaElementSource(audioElement);

const gainNode = audioContext.createGain();

const analyserL = audioContext.createAnalyser();
const analyserR = audioContext.createAnalyser();

const channelSplitter = audioContext.createChannelSplitter(2);
const channelMerger = audioContext.createChannelMerger(2);

track.connect(gainNode).connect(channelSplitter);

channelSplitter.connect(analyserL, 0).connect(channelMerger, 0, 0);
channelSplitter.connect(analyserR, 1).connect(channelMerger, 0, 1);

channelMerger.connect(audioContext.destination);

// ------ controls ------ //

// play button
const playButton = document.querySelector('button');

playButton.addEventListener('click', function() {

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    if (this.dataset.playing === 'false') {
        audioElement.play();
        this.dataset.playing = 'true';
    } else if (this.dataset.playing === 'true') {
        audioElement.pause();
        this.dataset.playing = 'false';
    }

}, false);

audioElement.addEventListener('ended', () => {
    playButton.dataset.playing = 'false';
}, false);

// volume control
const volumeControl = document.querySelector('#volume');

volumeControl.addEventListener('input', function() {
    gainNode.gain.value = this.value;
}, false);

volumeControl.addEventListener('dblclick', function() {
    this.value = 1;
    gainNode.gain.value = this.value;
}, false);

// intensity control
const intensityControl = document.querySelector('#intensity');

intensityControl.addEventListener('dblclick', function() {
    this.value = 0.6;
}, false);

// blur control
const blurControl = document.querySelector('#blur');

blurControl.addEventListener('dblclick', function() {
    this.value = 0.2;
}, false);

// ------ oscilloscope ------ //

analyserL.fftSize = 2048;
let bufferLengthL = analyserL.frequencyBinCount;
let dataArrayL = new Uint8Array(bufferLengthL);

analyserR.fftSize = 2048;
let bufferLengthR = analyserR.frequencyBinCount;
let dataArrayR = new Uint8Array(bufferLengthR);

const waveformCanvas = document.querySelector('canvas');
const canvasCtx = waveformCanvas.getContext('2d');

canvasCtx.fillStyle = 'rgba(0, 0, 0, 1)';
canvasCtx.fillRect(0, 0, 500, 500);

function oscilloDraw() {

    const drawVisual = requestAnimationFrame(oscilloDraw);
    analyserL.getByteTimeDomainData(dataArrayL);
    analyserR.getByteTimeDomainData(dataArrayR);

    canvasCtx.fillStyle = `rgba(0, 0, 0, ${blurControl.value})`;
    canvasCtx.fillRect(0, 0, 500, 500);
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = `rgba(0, 255, 0, ${intensityControl.value})`;
    canvasCtx.beginPath();
    for(let i = 0; i < bufferLengthL; i++) {

        let v = dataArrayL[i] / 128.0;
        let w = dataArrayR[i] / 128.0;
        let y = 500 - w * 500/2;
        let x = v * 500/2;

        if(i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

    }
    canvasCtx.stroke();

  };

oscilloDraw();
