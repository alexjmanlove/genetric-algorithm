// this script handles the chimes that play when progress is made.

var audioFilePath = '';
var tones = [];

tones[0] = new Audio("audio/EMajor/EChord.wav");
for(a=1;a<22;a++){
    audioFilePath="audio/EMajor/E"+a+".wav";
    tones[a]=new Audio(audioFilePath); 
}
checkStoredVolume();

// checks the stored volume level to prevent volume resetting after page reload.
function checkStoredVolume(){
    var vol = localStorage.getItem("toneVolume");
    if(localStorage.getItem("toneVolume")==null){
        localStorage.setItem("toneVolume",25);
        vol = localStorage.getItem("toneVolume");
    }
    adjustVolume(vol);
    document.getElementById("volumeControl").value = vol;
}

// adjusts volume of tones and changes the volume icon to match.
function adjustVolume(vol){
    localStorage.setItem('toneVolume', vol);
    for(t=0;t<tones.length;t++){
        tones[t].volume= localStorage.toneVolume/100;
    }
    if(vol>66){
        document.getElementById("volumeIcon").src = "image/Loud.svg";
    }else if(vol>33){
        document.getElementById("volumeIcon").src = "image/Medium.svg";
    }else if(vol>0){
        document.getElementById("volumeIcon").src = "image/Quiet.svg";
    }else{
        document.getElementById("volumeIcon").src = "image/Mute.svg";
    }
}

