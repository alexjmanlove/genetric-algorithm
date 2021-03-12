// OVERVIEW
//  firstly, the user offers a string which we set as the targetOrganism.
//  then we spawn a population of completely random strings, which we call organisms.
//  we evaluate each organism and give it a fitness score. i.e how many characters in the string match the targetOrganism.
//  we select the 'fittest' organisms and pair them together for crossover.
//  we randomly select 'dna' from each organism to create a child.
//  the resulting offspring are then randomly mutated for variance.
//  repeat until we arrive at our targetOrganism. 


//this is the string containing all the characters which we consider.
const validCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz! ";
//the table which we write our significant results to
const resultsTable = document.getElementById('resultsTable');

var initialOrganismPopulationSize = 10; //allow user to set the original number of organisms in 1st gen 
var targetOrganism = ''; //the string the user inputs, the one we're aiming towards.
var currentRandomName = ''; //stores the current string being generated each time we call generateRandomName().
var fitness = 0; //fitness here is a measurement of how many characters in an organism match those in the target organism
var meanFitness = 0; // mean average fitness of all organisms in a given generation.
var currentGenerationNumber = -1; //which gen are we at right now. Initially -1 since the next generation is the first, and so it will take index [0]
var destinationGeneration = -1; //the generation we aim to reach by the end of the recusive loop.
var finishedEvolving = false; // to check if/when we've successfully hit our target.
var generationTimeouts = [];
var recursionCounter;
var blackSheep = false;
var mutant = '';
var livingOrganisms = []; //stores all of the current organisms i.e all survivors from previous generations and offspring of current generation. 
var hallOfFame = []; //stores the fittest organism from of generation.

// organism object
function Organism(generation, name, fitnessNumber) {
  this.generation = generation;
  this.name = name;
  this.fitness = fitnessNumber;
}


// the function called when one of the four main buttons is pressed
function go(numberOfGenerationsToProcess){
  disableButtons(); //we disable the buttons while running  
  destinationGeneration = currentGenerationNumber + numberOfGenerationsToProcess;
  recursionCounter=0;
  processGeneration(numberOfGenerationsToProcess);
}


// this is the main function. it operates recursively, calling itself again after execution if
// it hasn't yet processed enough generations to meet the request from the user.
function processGeneration(numberOfGenerationsToProcess){
  if(recursionCounter<numberOfGenerationsToProcess){
    generationTimeouts.push(setTimeout(function () {
      if(finishedEvolving){ //once we've hit the target we haltProgram(), clearing all timeouts in the queue.
        haltProgram();
        document.getElementById("genCounterDiv").innerHTML=("Successfully evolved <b>'"+targetOrganism+"'</b> after <b>"+currentGenerationNumber+"</b> generations!");
      }else{
        spawnGeneration();
        if (livingOrganisms[0].name == targetOrganism) { //check if we're finishedEvolving 
          finishedEvolving=true;
        }
        processGeneration(numberOfGenerationsToProcess);
      }
    }, 1));
  }else{
    enableButtons();
  }
  recursionCounter++;
}


function spawnGeneration(){
  currentGenerationNumber++;
  try {
    document.getElementById('generationCounter').innerHTML=currentGenerationNumber+"/"+destinationGeneration;
  }catch(err){}
  
  // check which generation we're on.
  if(currentGenerationNumber==0){ // If this is the first generation we set everything up by calling spawnFirstGeneration().
    spawnFirstGeneration();
  } else {
    spawnNextGeneration();
  }
  updateStatistics(); // calcaultes mean fitness and writes other stats like best organism and blacksheep to the page.

  // If an improvement to fitness has occurred, acknowledge it by updating the page and playing a chime.
  if(currentGenerationNumber == 0 || hallOfFame[currentGenerationNumber-1].name != hallOfFame[currentGenerationNumber].name){ //update table if it's the first gen or if we've made progress.
    acknowledgeProgress();
  }
}


function spawnFirstGeneration(){
  // we read the inputs, then disable them once we've started.
  initialOrganismPopulationSize = document.getElementById("initialOrganismPopulationSizeInput").value;
  targetOrganism = document.getElementById("targetOrganismInput").value;
  document.getElementById("targetOrganismInput").disabled=true;
  document.getElementById("initialOrganismPopulationSizeInput").disabled=true;

  // it generates strings by calling generateRandomName(), passing in the desired length of the string as an argument.  
  // The strings are stored along with their assessed fitness and the currentGenerationNumber as properties of a new organism object in the livingOrganisms[] array.
  for(let j=0; j<initialOrganismPopulationSize; j++) {
    currentRandomName = generateRandomName(targetOrganism.length);
    fitness = assessFitness(currentRandomName);
    livingOrganisms.push(new Organism(currentGenerationNumber,currentRandomName,fitness));
  }

  // the organisms are sorted according to their fitness and the overall fittest is stored in the hallOfFame[]. (tiebreak is random)
  livingOrganisms.sort((a, b) => b.fitness - a.fitness); //sort the livingOrganisms from most to least fit.
  hallOfFame.push(livingOrganisms[0]);
  
  // update table and line graph with data from the first generation.
  document.getElementById("bestNewOrganism").innerHTML=livingOrganisms[0].name;
  document.getElementById('lineGraph').style.display = "default";
  document.getElementById("stopButton").disabled = false;
}


//this function pulls random characters from validCharacters[] to create the name properties of our initial organism objects.
function generateRandomName(length) { 
   var result = '';
   for (let i = 0; i < length; i++) {
      result += validCharacters[Math.floor(Math.random() * validCharacters.length)];
   }
   return result;
}


// check how many characters match in target organism and organismToAssess
function assessFitness(organismToAssess){
  var fitnessScore = 0;
  for(var ii=0; ii < organismToAssess.length; ii++){
    if(organismToAssess[ii] == targetOrganism[ii]){
      fitnessScore++;
    }
  }
  return fitnessScore; 
}


function spawnNextGeneration(){ 
  var offspring = createOffspring();   // createOffpring returns an array of strings.
  var numberOfSurvivors = document.getElementById('survivingPopulationSizeInput').value;   // the user determines how many organisms survive after each generation is processed.
  var newGeneration = [];
  
  var namesOfNewGeneration = mutateOffspring(offspring);   // mutateOffspring() adds random variation to each name in offspring[];

  // assessing each new organisms and push it to the newGeneration[].
  for(var a=0; a < namesOfNewGeneration.length; a++) {
    fitness = assessFitness(namesOfNewGeneration[a]);
    newGeneration.push(new Organism(currentGenerationNumber,namesOfNewGeneration[a],fitness));
  }

  // Only the fittest survive.
  livingOrganisms = livingOrganisms.concat(newGeneration);
  livingOrganisms.sort((a, b) => b.fitness - a.fitness);
  livingOrganisms = livingOrganisms.slice(0, numberOfSurvivors);

  // write best newcomer to the page and save this generation's fittest in the hallOfFame.
  document.getElementById("bestNewOrganism").innerHTML=newGeneration.sort((a, b) => b.fitness - a.fitness)[0].name; // write best newcomer to the page.
  hallOfFame.push(livingOrganisms[0]);  
}


// in this function we match organisms for mating and perform crossover.
function createOffspring(){
  // the user determines how many offspring per couple.
  var numberOfOffspringPerCouple = document.getElementById('fertilityInput').value;

  // in this function we seek to pair all the living organisms together into couples.
  var couples = [];
  var numberOfCouples = (livingOrganisms.length/2);
  var offspring = [];

  // pairing livingOrganisms into couples. Each couple is simply an array of two strings. 
  for (let c = 0;c<numberOfCouples;c++){
    couples.push([livingOrganisms[2*c].name,livingOrganisms[1+(2*c)].name]);
  }//e.g. couples[4][0] is the name of parent A from couple 5, couples[2][1] is the name of parent B from couple 3 

  // generating offspring from each couple
  for(let d = 0;d<(numberOfCouples*numberOfOffspringPerCouple);d++){ //d iterates over all the offspring for all of the couples.
      offspring.push(randomlyInheritDNA(couples[Math.floor(d/numberOfOffspringPerCouple)])); //passing the array of 2 strings to the randomlyInheritDNA() function and pushing the resulting 'child' to offspring[].
  }
  return offspring;
}


// we pass in 'couple', an array of 2 organism names. We return a random combination of characters from each.
function randomlyInheritDNA(couple){ 
  var offspringDNASequence = '';
  for (var f=0;f<couple[0].length;f++){ //iterating over the length of the parent's name, so the child will have the same length.
    offspringDNASequence += ((Math.random() > 0.5) ? couple[0][f] : couple[1][f]); //fifty-fifty chance to take the character from parentA or parentB
  }
  return offspringDNASequence;
}


// this function randomly adjusts characters in organisms in offspring[].
function mutateOffspring(offspring){
  var maxPossibleNumberOfMutations = document.getElementById('mutationInput').value; // returns an integer
  maxPossibleNumberOfMutations++;
  var mutationLocations = [];
  var DNA;

  for (let iii=0;iii<offspring.length;iii++){ 
    mutant = generateRandomName(targetOrganism.length);
    if(blackSheep && iii==0){ //if blackSheep is enabled, simply set the first offspring in a generation to a random organism. 
     offspring[iii] = mutant;
    }else{
      DNA = offspring[iii].split('');
      for(let jjj = 0; jjj<Math.floor(Math.random()*maxPossibleNumberOfMutations); jjj++){ //randomise how many characters will mutate. 
        mutationLocations.push(Math.floor(Math.random()*targetOrganism.length)); //randomise where the mutations will be.
      }
      for(let xx = 0; xx<mutationLocations.length;xx++){
        DNA[mutationLocations[xx]] = mutant[mutationLocations[xx]];
      }
      offspring[iii] = DNA.join('');
    }
  }
  return offspring;
}


// enable/disable blacksheep spawning, this function is called when the setting is updated. 
function toggleBlackSheep(){
  blackSheep = document.getElementById('blackSheepInput').checked; //blacksheep is boolean that checks if we add a randomly generated mutant offspring to the pool
  if(blackSheep){
    document.getElementById("blackSheepDiv").style.display = "block";
  }else{
    document.getElementById("blackSheepDiv").style.display = "none";
  }
}


function acknowledgeProgress(){
  updateResultsTable();

  // try to play chime.
  var distanceFromTarget = targetOrganism.length - livingOrganisms[0].fitness;
  try{
    tones[distanceFromTarget].play();
  }catch(err){console.log("Error, could not play chime: "+err)}
  
  //update line charts
  addData(lineChart, 1, hallOfFame[currentGenerationNumber].name, currentGenerationNumber, hallOfFame[currentGenerationNumber].fitness);
  addData(lineChart, 0, hallOfFame[currentGenerationNumber].name, currentGenerationNumber, meanFitness);
}


// write information about the current generation to the results table.
function updateResultsTable(){
  var newRow = resultsTable.insertRow(2);
  newRow.className = "resultsTable";
  newRow.insertCell(0).innerHTML = currentGenerationNumber;
  newRow.insertCell(1).innerHTML = hallOfFame[currentGenerationNumber].name;
  newRow.insertCell(2).innerHTML = hallOfFame[currentGenerationNumber].fitness;
  newRow.insertCell(3).innerHTML = meanFitness;

  // set the row white but transition back to normal after 1 second.
  newRow.style.backgroundColor = "white";
  setTimeout(function () {
    newRow.style.backgroundColor = "#dae4eb";
  }, 1000);
}


function updateStatistics(){
  meanFitness = 0;
  for(var p=0;p<livingOrganisms.length;p++){
    meanFitness += livingOrganisms[p].fitness;
  }
  meanFitness /= livingOrganisms.length;
  document.getElementById("meanFitness").innerHTML=meanFitness;
  if(blackSheep){document.getElementById("blackSheep").innerHTML=mutant;}
}


// push new data to the line chart.
// this function is adapted from the chart.js documentation.
// available at: https://www.chartjs.org/docs/latest/developers/updates.html
function addData(chart, dataset, label, xVal, yVal) {
  chart.data.labels.push(label);
  chart.data.datasets[dataset].data.push({x: xVal, y: yVal}); 
  if(currentGenerationNumber!=0){chart.options.scales.xAxes[0].ticks.max = currentGenerationNumber;}
  chart.update();
}	


// this function clears the queue of ongoing calculations.
function haltProgram(){
  try{
    for (var q=0; q<generationTimeouts.length; q++) {
      clearTimeout(generationTimeouts[q]);
    }
    document.getElementById('generationCounter').innerHTML=currentGenerationNumber+"/"+destinationGeneration;
  }catch(err){}
  if(!finishedEvolving){
    enableButtons();
  }else{
    enableResetButton();
  }
}


function enableResetButton(){
    document.getElementById('resetButton').disabled = false;
}
function disableResetButton(){
  document.getElementById('resetButton').disabled = true;
}


function resetProgram(){
  var confirmedReset = confirm("Are you sure you want to reset?");
  if(confirmedReset){
    location.reload();
  }
}


// in certain situations we want to disable the buttons. 
function disableButtons(){
  var buttons = document.getElementsByClassName("button"); 
  for(var yyy = 0; yyy < buttons.length; yyy++) {
    buttons[yyy].disabled = true;
  }
}
function enableButtons(){
  var buttons = document.getElementsByClassName("button"); 
  for(var yyy = 0; yyy < buttons.length; yyy++) {
    buttons[yyy].disabled = false;
  }
}


// gets current day of the week to be used as target. more fun than simply "Hello World", but also defaults to Hello World if date cannot be read.
function inputDateOnLoad() {
  try{
    var d = new Date();
    var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    var d = weekday[d.getDay()];
    document.getElementById("targetOrganismInput").value = "Enjoy your "+d+"!";
  }catch(err){
    document.getElementById("targetOrganismInput").value = "Hello World";
  }
}


// checks if the user's input contains any invalid characters and attempts to restate without them.
function validateInputString(){
  var inputString = document.getElementById('targetOrganismInput').value;
  var validatedString = inputString.split('');
  var invalidChars = [];

  for(var s=0;s<validatedString.length;s++){
    if(!validCharacters.includes(validatedString[s])){
      if(!invalidChars.includes(validatedString[s])){
        invalidChars.push(validatedString[s]);
      }
      validatedString[s]='';
    }
  }
  validatedString = validatedString.join('');
  while(validatedString.endsWith(" ")){validatedString = validatedString.slice(0,-1)}

  var verb = ((invalidChars.length > 1) ? "' are": "' is");
  if(invalidChars.length!=0){
    document.getElementById('targetOrganismInput').value = validatedString;
    document.getElementById('validationExplanation').innerHTML = "<br />Changed '<b>"+inputString+"</b>' to '<b>"+validatedString+"</b>' because '"+invalidChars+verb+" not supported.)";
  }
}


// toggles the collapsible information dropdown. 
function toggleInformation(x){
  var content = x.nextElementSibling;
  if (content.style.height){
    content.style.height = null;
  } else {
    content.style.height = 400 + "px";
  } 
}