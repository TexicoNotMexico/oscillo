// init
const AudioContext = window.AudioContext || window.webkitAudioContext;

const audioContext = new AudioContext();

// nodes
let audioElement = document.querySelector("audio");

let track = audioContext.createMediaElementSource(audioElement);

let gainNode = audioContext.createGain();

let analyserL = audioContext.createAnalyser();
let analyserR = audioContext.createAnalyser();

let channelSplitter = audioContext.createChannelSplitter(2);
let channelMerger = audioContext.createChannelMerger(2);

//let oscillatorL = audioContext.createOscillator();
//let oscillatorR = audioContext.createOscillator();

track.connect(gainNode).connect(channelSplitter);
/*oscillatorL.type = "sine";
oscillatorL.frequency.setValueAtTime(440, audioContext.currentTime);

oscillatorR.type = "sine";
oscillatorR.frequency.setValueAtTime(660, audioContext.currentTime);*/

//oscillatorL.connect(analyserL, 0).connect(channelMerger, 0, 0);
//oscillatorR.connect(analyserR, 0).connect(channelMerger, 0, 1);
channelSplitter.connect(analyserL, 0).connect(channelMerger, 0, 0);
channelSplitter.connect(analyserR, 1).connect(channelMerger, 0, 1);

channelMerger.connect(audioContext.destination);

// ------ controls ------ //

// file selector
const fileSelector = document.querySelector("#fileselector");

fileSelector.addEventListener("change", function(e) {

    let srcInput = e.target;
    if (srcInput.files.length === 0) {
        return;
    }

    if (playButton.dataset.playing === "true") {
        audioElement.pause();
        playButton.dataset.playing = "false";
    }
    
    let srcFile = srcInput.files[0];
    let reader = new FileReader();
    reader.onload = () => {
        audioElement.setAttribute("src", reader.result);
    }
    reader.readAsDataURL(srcFile);

}, false);

// play button
const playButton = document.querySelector("button");

playButton.addEventListener("click", function() {

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    if (this.dataset.playing === "false") {
        audioElement.play();
        //oscillatorL.start();
        //oscillatorR.start();
        this.dataset.playing = "true";
    } else if (this.dataset.playing === "true") {
        audioElement.pause();
        //oscillatorL.stop();
        //oscillatorR.stop();
        this.dataset.playing = "false";
    }

}, false);

audioElement.addEventListener("ended", () => {
    playButton.dataset.playing = "false";
}, false);

// volume control
const volumeControl = document.querySelector("#volume");

volumeControl.addEventListener("input", function() {
    gainNode.gain.value = this.value;
}, false);

volumeControl.addEventListener("dblclick", function() {
    this.value = 1;
    gainNode.gain.value = this.value;
}, false);

// intensity control
const intensityControl = document.querySelector("#intensity");

intensityControl.addEventListener("dblclick", function() {
    this.value = 0.2;
}, false);

// blur control
const blurControl = document.querySelector("#blur");

blurControl.addEventListener("dblclick", function() {
    this.value = 0.5;
}, false);

// ------ oscilloscope ------ //

analyserL.fftSize = 2048;
let bufferLengthL = analyserL.frequencyBinCount;
let dataArrayL = new Uint8Array(bufferLengthL);

analyserR.fftSize = 2048;
let bufferLengthR = analyserR.frequencyBinCount;
let dataArrayR = new Uint8Array(bufferLengthR);

const waveformCanvas = document.querySelector("canvas");
const canvasCtx = waveformCanvas.getContext("2d");

canvasCtx.fillStyle = "rgba(0, 0, 0, 1)";
canvasCtx.fillRect(0, 0, 500, 500);

var j = 0;

function oscilloDraw() {

    const drawVisual = requestAnimationFrame(oscilloDraw);
    analyserL.getByteTimeDomainData(dataArrayL);
    analyserR.getByteTimeDomainData(dataArrayR);

    canvasCtx.fillStyle = `rgba(0, 0, 0, ${1 - blurControl.value})`;
    canvasCtx.fillRect(0, 0, 500, 500);
    canvasCtx.lineWidth = 2;

    for(var i = 0; i < bufferLengthL; i++) {

        canvasCtx.beginPath();

        if(j === 0) {
            x = 500 / 2;
            y = 500 / 2;
        }

        var beforeX = x;
        var beforeY = y;

        var v = dataArrayL[i] / 128.0;
        var w = dataArrayR[i] / 128.0;
        var y = 500 - w * 500 / 2;
        var x = v * 500 / 2;

        var strokeAlpha = 1 - Math.round( Math.sqrt( Math.pow( x-beforeX, 2 ) + Math.pow( y-beforeY, 2 ) ) / Math.sqrt( 500000 ) * 100 ) / 100;

        canvasCtx.strokeStyle = `rgba(0, 255, 0, ${strokeAlpha * intensityControl.value})`;

        canvasCtx.moveTo(beforeX, beforeY);
        canvasCtx.lineTo(x, y);

        canvasCtx.stroke();

    }

    j++;

};

oscilloDraw();
