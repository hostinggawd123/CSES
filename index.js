const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;

// File to persist selected problems
const SELECTED_PROBLEMS_FILE = 'selected_problems.json';

let problems = [];
try {
  const data = fs.readFileSync('cses_problems.json', 'utf8'); // Read the JSON file
  problems = JSON.parse(data);
} catch (err) {
  console.error('Error reading problems file:', err);
}

const problemsByType = problems.reduce((acc, problem) => {
  const type = problem.type;
  if (!acc[type]) acc[type] = [];
  acc[type].push(problem);
  return acc;
}, {});

let selectedTypes = [];
let selectedProblems = {};
let displayedProblems = {};

// Function to shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // Select a random index
    [array[i], array[j]] = [array[j], array[i]]; // Swap
  }
}

// Select "Graph Algorithms" and "Dynamic Programming" and 5 unique problems from each
function selectRandomTypesAndProblems() {
  // Specify the desired types
  const desiredTypes = ["Graph Algorithms", "Dynamic Programming"];
  
  // Ensure the specified types are available in the problemsByType
  selectedTypes = desiredTypes.filter(type => problemsByType[type]);

  selectedProblems = {};
  selectedTypes.forEach(type => {
    let availableProblems = problemsByType[type].filter(problem => {
      return !displayedProblems[problem.problem];
    });

    // Shuffle and select 5 problems
    shuffleArray(availableProblems);
    selectedProblems[type] = availableProblems.slice(0, 5);

    // Mark selected problems as displayed
    selectedProblems[type].forEach(problem => {
      displayedProblems[problem.problem] = type;
    });
  });

  // Save selected problems to file
  saveSelectedProblems();
}

// Save selected problems to a file
function saveSelectedProblems() {
  fs.writeFileSync(SELECTED_PROBLEMS_FILE, JSON.stringify({ selectedTypes, selectedProblems }), 'utf8');
}

// Load selected problems from a file
function loadSelectedProblems() {
  if (fs.existsSync(SELECTED_PROBLEMS_FILE)) {
    const data = fs.readFileSync(SELECTED_PROBLEMS_FILE, 'utf8');
    const savedData = JSON.parse(data);
    selectedTypes = savedData.selectedTypes;
    selectedProblems = savedData.selectedProblems;
  } else {
    // If file does not exist, select problems immediately
    selectRandomTypesAndProblems();
  }
}

// Calculate the time until the next 10 PM
function timeUntilNext10PM() {
  const now = new Date();
  const next10PM = new Date(now);
  next10PM.setHours(22, 0, 0, 0); // Set time to 10:00 PM

  if (now >= next10PM) {
    // If the current time is past today's 10 PM, set to 10 PM tomorrow
    next10PM.setDate(next10PM.getDate() + 1);
  }

  return next10PM - now; // Return the milliseconds until next 10 PM
}

// Refresh problems initially and set interval for daily refresh at 10 PM
function scheduleDailyRefresh() {
  // Load previously selected problems or select new ones
  loadSelectedProblems();

  // Set timeout to refresh at the next 10 PM
  setTimeout(() => {
    // Refresh problems at the next 10 PM
    selectRandomTypesAndProblems();
    // Set interval to refresh every 24 hours after the initial refresh
    setInterval(selectRandomTypesAndProblems, 24 * 60 * 60 * 1000);
  }, timeUntilNext10PM());
}

// Schedule the daily refresh
scheduleDailyRefresh();

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index', { selectedTypes, selectedProblems });
});

app.listen(port, () => {
  console.log("Server running on port 3000");
});
