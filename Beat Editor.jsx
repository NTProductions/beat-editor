// beat detector
// import song(s) and footage (video and/or images), then run script

// global vars
var project = app.project;
var comp = project.activeItem;
var solidsFolder;
var audioArray = [];
var audioArrayNames = [];

function calculateAverage(averageArray) {
        var average = 0;
    for(var u = 0; u < averageArray.length; u++){
        average = average + averageArray[u];
        }

    average = average / averageArray.length;
    
    return average;
    }

// Main UI
var mainWindow = new Window("palette", "Beat Editor", undefined);
mainWindow.orientation = "column";

var group = mainWindow.add("group", undefined, "group");
group.orientation = "row";
group.add("statictext", undefined, "Audio:");

// check for files in project window
for(var q = 1; q <= project.numItems; q++){
    if(app.project.item(q).hasAudio == true && app.project.item(q).hasVideo != true){
            audioArray.push(app.project.item(q));
            audioArrayNames.push(app.project.item(q).name);
        }
    if(app.project.item(q) instanceof FolderItem && app.project.item(q).name == "Solids"){
            solidsFolder = app.project.item(q);
        }
    }

// UI continued
var audioDropDown = group.add("dropdownlist", undefined, audioArrayNames);
audioDropDown.selection = 0;
audioDropDown.size = [120, 25];
var infoButton = group.add("button", undefined, "?");
infoButton.size = [25, 25];

var groupOne = mainWindow.add("group", undefined, "groupOne");
groupOne.orientation = "row";
groupOne.add("statictext", undefined, "Edit Speed");
var speedSlider = groupOne.add("slider", undefined, "");
speedSlider.value = 1;
speedSlider.minvalue = 1;
speedSlider.maxvalue = 10;
var speedSliderText = groupOne.add("statictext", undefined, "1");
speedSliderText.size = [50, 25];
speedSlider.onChange = function() {
        speedSliderText.text = Math.round(speedSlider.value);
    }

var groupTwo = mainWindow.add("group", undefined, "groupTwo");
var button = groupTwo.add("button", undefined, "Edit!");

// show and center main ui
mainWindow.center();
mainWindow.show();

// show about window
infoButton.onClick = function() {
    aboutWindow.show();
    }

// about window UI
var aboutWindow = new Window("palette", "Beat Editor", undefined, {closeButton: false});
aboutWindow.orientation = "column";
var aboutOne = aboutWindow.add("group", undefined, "aboutOne");
aboutOne.orientation = "row";
var includeImages = aboutOne.add("checkbox", undefined, "Include Images");
includeImages.value = 0;
var aboutTwo = aboutWindow.add("group", undefined, "aboutTwo");
aboutTwo.orientation = "row";
var closeButton = aboutTwo.add("button", undefined, "Close");

// close about window
closeButton.onClick = function(){
        aboutWindow.hide();
    }

button.onClick = function() {
    app.beginUndoGroup("Editing");
    
    var audioLayer = audioArray[audioDropDown.selection.index];
    var editComp = project.items.addComp(audioArrayNames[audioDropDown.selection.index].toString(), 1920, 1080, 1, audioLayer.duration, 30);
    editComp.openInViewer();
    
    addAudioFile(audioLayer, editComp);

// set variables equal to generated audio keyframes left and right channels
var left = editComp.layer(1).Effects.property("Left Channel").property("Slider");
var right =  editComp.layer(1).Effects.property("Right Channel").property("Slider");

// 1 second
var second = Math.round(editComp.frameRate);

// (number of frames to analyse)
var numSamples = Math.round(editComp.duration * editComp.frameRate - 1);

// number of blocks to separate audio into
var numPasses = Math.round(numSamples / second);

var cutPoints = detectBlocks(editComp, left, right, numPasses, second);

var avArray = collectFootage();
var newLength = Math.round(speedSlider.value);

        for(var p = 0; p < cutPoints.length; p+=newLength) {
addVideos(editComp, cutPoints, second, avArray, p, newLength);
            }
        alert("Generated Successfully!");
    app.endUndoGroup();

    }



function addVideos(comp, beatFrames, second, videoArray, index, newLength) {
        var tempIndex;
        var layerDuration;

            tempIndex = Math.floor(Math.random() * (videoArray.length - 1)) + 0;
                comp.layers.add(videoArray[tempIndex]);
                
                fixScale(comp);

                comp.layer(1).audioEnabled = false;
                layerDuration = comp.layer(1).outPoint - comp.layer(1).startTime;
                comp.layer(1).startTime = (beatFrames[index] / second) - Math.floor(Math.random() * (layerDuration)) + 0;
                comp.layer(1).inPoint = beatFrames[index] / second;

                if(comp.layer(1).outPoint < beatFrames[index + newLength] / second){
                    comp.layer(1).remove();

                    addVideos(comp, beatFrames, second, videoArray, index, newLength);

                    }
                else{
                comp.layer(1).outPoint = beatFrames[index + newLength] / second;
             if(comp.layer(1).source.duration == 0){
                randomScale(comp.layer(1), comp.layer(1).inPoint, comp.layer(1).outPoint);
                }
               }
                }
            
function fixScale(comp) {
            // fixes incorrectly scaled imgs properly to comp
			var myRect = comp.layer(1).sourceRectAtTime(0, false);
			var myScale = comp.layer(1).property("Scale").value;
			var myNewScale = myScale * Math.min (comp.width / myRect.width, comp.height / myRect.height);
			comp.layer(1).property("Scale").setValue(myNewScale);
    }

function randomScale(layer, inPoint, outPoint) {
    var random = Math.round(Math.random());
    var scaleFactor = 1.15;
        // scale down
        if(random == 0) {
            
            var currentLayer = layer;
						var keyProperty = currentLayer.property("ADBE Transform Group").property("ADBE Scale");
						var twoKeys = 2;
						var addTheseKeys = [inPoint, outPoint];
						var currentScale = currentLayer.property("Transform").property("Scale").value[0];
						var scaleKeys = [currentScale * scaleFactor, currentScale * scaleFactor, 100];
						var scaleKeysTwo = [currentScale, currentScale, 100];
						var storeKeys = [scaleKeys, scaleKeysTwo, 100]
						
					for (var i = 0; i < twoKeys; i++){
						keyProperty.setValueAtTime(addTheseKeys[i], storeKeys[i]);
    }
            
            }
        // scale up
        if(random == 1) {
            
						var currentLayer = layer;
						var keyProperty = currentLayer.property("ADBE Transform Group").property("ADBE Scale");
						var twoKeys = 2;
						var addTheseKeys = [inPoint, outPoint];
						var currentScale = currentLayer.property("Transform").property("Scale").value[0];
						var scaleKeys = [currentScale, currentScale, 100];
						var scaleKeysTwo = [currentScale * scaleFactor, currentScale * scaleFactor, 100];
						var storeKeys = [scaleKeys, scaleKeysTwo, 100]
						
					for (var i = 0; i < twoKeys; i++){
						keyProperty.setValueAtTime(addTheseKeys[i], storeKeys[i]);
    }
		
            
            }
    }

function addAudioFile(audioLayer, comp) {
    comp.layers.add(audioLayer);
app.executeCommand(app.findMenuCommandId("Convert Audio to Keyframes"));
    }

function detectBlocks(comp, left, right, passes, second) {
        // block detection vars
var currentSecond = 0;
var leftBlockArray = [];
var rightBlockArray = [];
var beatFrames = [];
var blockAverages = [];
var calculatedChange;
var tempAverage;

        for(var i = 1; i <= passes; i++) {
        // analysis of current block
        blockAverages = [];
        for(var ii = currentSecond; ii <= i * second; ii++) {
            leftBlockArray.push(left.valueAtTime(ii / second, false));
            rightBlockArray.push(right.valueAtTime(ii / second, false));
            tempAverage = (leftBlockArray[ii] + rightBlockArray[ii]) / 2;
            blockAverages.push(tempAverage);
            for(var e = 0; e < blockAverages.length; e++) {
            calculatedChange = Math.abs(((calculateAverage(blockAverages) - blockAverages[e]) / calculateAverage(blockAverages)) * 100);
             
            if(calculatedChange > 40) {
                beatFrames.push(ii);
               blockAverages = [];
                }

            }

            }
    currentSecond += second;

    }
    return beatFrames;
    }

function collectFootage() {
    // collect footage
        var videoArray = [];
    for(var w = 1; w <= app.project.numItems; w++){
            if(includeImages.value == 0){
        if(app.project.item(w).hasVideo == true && app.project.item(w).duration > 1 && !(app.project.item(w) instanceof CompItem)){
                videoArray.push(app.project.item(w));
            }
        }
            if(includeImages.value == 1) {
                   if((app.project.item(w).hasVideo == true && app.project.item(w).duration > 1 && !(app.project.item(w) instanceof CompItem)) || (app.project.item(w).hasVideo == true && app.project.item(w).hasAudio == false && app.project.item(w).duration == 0 && app.project.item(w).parentFolder != solidsFolder)){
                videoArray.push(app.project.item(w));
            } 
                }
        }
    return videoArray;
    }