// Import the express library here
const express = require('express');
// Instantiate the app here
const app = express();
const cors = require('cors'); // Import CORS middleware
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use(cors()); // Enable CORS for all origins
// global variables

let envelopes = [];
let totalBudget = 0;
// test hello world

// Open a call to `app.get()` below:
app.get('/', (req, res, next) => {

  res.send('hello world');

});

app.post('/envelopes', (req, res) => {
  const { title, budget } = req.query; // Access query parameters

  // Validate request data
  if (!title || isNaN(budget) || budget < 0) {
    return res.status(400).json({ error: 'Invalid input: Title and positive budget are required.' });
  }

  // Create a new envelope object
  const newEnvelope = {
    id: envelopes.length + 1,
    title,
    budget: parseFloat(budget) // Convert budget to a number
  };

  // Add the new envelope to the list and update the total budget
  envelopes.push(newEnvelope);
  totalBudget += newEnvelope.budget;

  res.status(201).json({ message: 'Envelope created successfully!', envelope: newEnvelope });
});


// GET endpoint to retrieve all envelopes
app.get('/envelopes', (req, res) => {
  res.status(200).json({ envelopes, totalBudget });
});

// GET endpoint to retrieve a specific envelope by ID
app.get('/envelopes/:id', (req, res) => {
  const { id } = req.params; // Extract ID from the URL parameter

  // Find the envelope with the matching ID
  const envelope = envelopes.find((env) => env.id === parseInt(id));

  // Check if the envelope exists
  if (!envelope) {
    return res.status(404).json({ error: 'Envelope not found' });
  }

  // Return the envelope details
  res.status(200).json({ envelope });
});

app.put('/envelopes/:id/update', (req, res) => {
  const envelopeId = parseInt(req.params.id);  // Get envelope ID from the URL parameter
  const amount = parseFloat(req.query.budget); // Get amount to subtract from query parameter
  const newTitle = req.query.title; // Get new title from query parameter

  // Validate the amount to ensure it's a positive number
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount. It must be a positive number.' });
  }

  // Find the envelope with the corresponding ID
  let envelope = null;
  for (let i = 0; i < envelopes.length; i++) {
    if (envelopes[i].id === envelopeId) {
      envelope = envelopes[i];
      break;
    }
  }

  // If the envelope is not found, send a 404 error response
  if (!envelope) {
    return res.status(404).json({ error: 'Envelope not found' });
  }

  // Ensure there are enough funds to subtract
  if (envelope.budget >= amount) {
    envelope.budget -= amount;  // Subtract the amount from the envelope's budget
    totalBudget -= amount;  // Update the total budget
  } else {
    return res.status(400).json({ error: 'Insufficient funds in the envelope.' });
  }

  // If a new title was provided, update the envelope's title
  if (newTitle) {
    envelope.title = newTitle;
  }

  // Send a success response with the updated envelope and total budget
  res.status(200).json({
    message: 'Envelope updated successfully!',
    envelope,
    totalBudget
  });
});

app.delete('/envelopes/:id', (req, res) => {
  const envelopeId = parseInt(req.params.id);  // Get envelope ID from the URL parameter

  // Find the index of the envelope to delete
  const envelopeIndex = envelopes.findIndex(envelope => envelope.id === envelopeId);

  if (envelopeIndex !== -1) {
    const envelopeToDelete = envelopes[envelopeIndex];  // Get the envelope being deleted
    totalBudget -= envelopeToDelete.budget;  // Subtract the envelope's budget from the total budget
    envelopes.splice(envelopeIndex, 1); // Remove the envelope from the array
    res.status(204).send(); // No content to send, just indicate success
  } else {
    res.status(404).send(); // Envelope not found
  }
});

app.post('/envelopes/transfer/:from_id/:to_id', (req, res) => {
  const amount = parseFloat(req.query.amount); // Correctly get the amount from query parameters
  const fromEnvelopeId = parseInt(req.params.from_id); // Get 'from' envelope ID
  const toEnvelopeId = parseInt(req.params.to_id); // Get 'to' envelope ID

  // Find the indices of both envelopes
  const fromEnvelopeIndex = envelopes.findIndex(envelope => envelope.id === fromEnvelopeId);
  const toEnvelopeIndex = envelopes.findIndex(envelope => envelope.id === toEnvelopeId);

  // Check if both envelopes exist and if the amount is valid
  if (fromEnvelopeIndex !== -1 && toEnvelopeIndex !== -1 && amount > 0) {
    const fromEnvelope = envelopes[fromEnvelopeIndex];
    const toEnvelope = envelopes[toEnvelopeIndex];

    // Check if there's enough budget in the 'from' envelope
    if (fromEnvelope.budget >= amount) {
      fromEnvelope.budget -= amount; // Subtract from the 'from' envelope
      toEnvelope.budget += amount; // Add to the 'to' envelope

      res.status(200).json({
        message: 'Transfer successful',
        envelopes,
      });
    } else {
      res.status(400).json({
        error: 'Insufficient funds in the source envelope',
      });
    }
  } else {
    res.status(404).json({
      error: 'One or both envelopes not found, or invalid amount',
    });
  }
});



// Invoke the app's `.listen()` method below:
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});