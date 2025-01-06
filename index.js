// import express from 'express';
// import cors from 'cors';
// import ollama from 'ollama';
// import { v4 as uuidv4 } from 'uuid';
// import { VM } from 'vm2';
// import JSON5 from "json5";
//
// const app = express();
// const router = express.Router();
//
// app.use(cors());
// app.use(express.json());
//
// const MODEL_NAME = 'llama3';
// const practiceProblems = new Map();
//
// // Function to generate fallback code
// function generateFallbackCode(errorMessage) {
//     return `
// // This is a sample code that might produce the error: "${errorMessage}"
// function sampleFunction() {
//   const array = [1, 2, 3];
//   console.log(array[10]); // This will cause an "Index out of bounds" error
// }
//
// sampleFunction();
// `;
// }
//
// // Utility function to sanitize and validate the parsed JSON
// function sanitizeAndValidatePracticeProblem(problem) {
//     const requiredFields = ['description', 'initialCode', 'instructions', 'expectedOutput', 'hints', 'solution'];
//     const sanitizedProblem = {};
//
//     for (const field of requiredFields) {
//         if (typeof problem[field] === 'string') {
//             sanitizedProblem[field] = problem[field].trim();
//         } else if (Array.isArray(problem[field])) {
//             sanitizedProblem[field] = problem[field].map(item => typeof item === 'string' ? item.trim() : '');
//         } else {
//             sanitizedProblem[field] = '';
//         }
//     }
//
//     return sanitizedProblem;
// }
//
// const generateResponse = async (model, systemPrompt, userPrompt) => {
//     try {
//         const response = await ollama.chat({
//             model: model,
//             messages: [
//                 { role: 'system', content: systemPrompt },
//                 { role: 'user', content: userPrompt },
//             ],
//         });
//         console.log('Ollama Response:', response);
//         // Adjust based on actual response structure
//         if (response && response.message?.content) {
//             return response.message.content.trim();
//         } else {
//             throw new Error('Invalid response structure from ollama.chat');
//         }
//     } catch (error) {
//         console.error('Error in generateResponse:', error);
//         throw error;
//     }
// };
//
// router.post('/process-error', async (req, res) => {
//     const { errorMessage } = req.body;
//     console.log('User Error:', errorMessage);
//
//     try {
//         const solution = await generateResponse(
//             MODEL_NAME,
//             'You are an AI assistant that provides solutions to coding errors.',
//             `Provide a concise and deep solution for the following error message:\n\n${errorMessage}`
//         );
//
//         const reason = await generateResponse(
//             MODEL_NAME,
//             'You are an AI assistant that explains coding errors.',
//             `Explain the reason for the following error message:\n\n${errorMessage}`
//         );
//
//         const reproductionSteps = await generateResponse(
//             MODEL_NAME,
//             'You are an AI assistant that provides step-by-step instructions to reproduce coding errors.',
//             `Provide step-by-step instructions to reproduce the following error message:\n\n${errorMessage}`
//         );
//
//         res.json({
//             solution,
//             reason,
//             reproductionSteps: reproductionSteps.split('\n').filter(step => step.trim() !== ''),
//         });
//     } catch (error) {
//         console.error('Error:', error.message);
//         res.status(500).json({ error: 'Error processing the error message' });
//     }
// });
// router.post('/generate-practice', async (req, res) => {
//     const { errorMessage } = req.body;
//     console.log('Generate Practice for Error:', errorMessage);
//
//     try {
//         const practicePrompt = `
// Based on the following error message, create a coding practice problem that helps the user learn how to fix and avoid this error:
//
// Error: ${errorMessage}
//
// Note: Please provide your response in valid JSON format. Include:
// 1. A brief description of the problem related to this specific error.
// 2. A complete initial code snippet that contains this error and demonstrates how the error occurs.
// 3. Instructions for how the user can correct the error in the code.
// 4. Expected output or behavior once the error is fixed.
// 5. Hints to help the user troubleshoot the error.
// 6. The correct solution to fix the error (hidden from the user initially).
//
// Ensure that the initial code snippet directly relates to the provided error and uses realistic code that would cause the specified error.
// Respond ONLY with a properly formatted JSON object. Do NOT include any explanation text or commentary, only the JSON object.
// `;
//
//         const practiceResponse = await generateResponse(
//             MODEL_NAME,
//             'You are an AI assistant that creates coding practice problems.',
//             practicePrompt
//         );
//
//         console.log('LLM Response:', practiceResponse);
//
//         let practiceProblem;
//         try {
//             const rawContent = practiceResponse?.message?.content;
//             if (!rawContent) {
//                 throw new Error('Response content is undefined or null.');
//             }
//
//             // Try parsing with JSON first, fall back to JSON5 if that fails
//             try {
//                 practiceProblem = JSON.parse(rawContent);
//             } catch (jsonError) {
//                 console.warn('Standard JSON parsing failed, attempting with JSON5');
//                 practiceProblem = JSON5.parse(rawContent);
//             }
//
//             // Sanitize and validate the parsed problem
//             practiceProblem = sanitizeAndValidatePracticeProblem(practiceProblem);
//
//             // Check if the initial code is a placeholder and replace if necessary
//             if (practiceProblem.initialCode.includes('Add initial code here') || practiceProblem.initialCode.length < 10) {
//                 practiceProblem.initialCode = generateFallbackCode(errorMessage);
//             }
//         } catch (parseError) {
//             console.error('Error parsing JSON:', parseError);
//             practiceProblem = {
//                 description: `Practice problem based on the error: ${errorMessage}`,
//                 initialCode: generateFallbackCode(errorMessage),
//                 instructions: "Identify and correct the issue in the code that's causing the error.",
//                 expectedOutput: "The code should run without producing the specified error.",
//                 hints: ["Check array indices", "Ensure variables are properly initialized", "Look for off-by-one errors"],
//                 solution: "// Correct solution will be provided after you attempt the problem"
//             };
//         }
//
//         console.log('Final practice problem sent to frontend:', practiceProblem);
//
//         const problemId = uuidv4();
//         // Assume practiceProblems is a Map defined elsewhere to store problems
//         practiceProblems.set(problemId, practiceProblem);
//         res.json({ id: problemId, ...practiceProblem });
//     } catch (error) {
//         console.error('Error:', error.message);
//         res.status(500).json({ error: 'Error generating practice problem', details: error.message });
//     }
// });
// router.post('/evaluate-code', async (req, res) => {
//     const { userCode: code } = req.body;
//     console.log('User Code:', code);
//
//     if (typeof code !== 'string' || code.trim() === '') {
//         return res.status(400).json({ error: 'Invalid code input' });
//     }
//
//     try {
//         const logs = [];
//         const vm = new VM({
//             timeout: 1000,
//             sandbox: {
//                 console: {
//                     log: (...args) => {
//                         logs.push(args.join(' '));
//                     },
//                     error: (...args) => {
//                         logs.push('Error: ' + args.join(' '));
//                     },
//                     // Add other console methods if needed
//                 }
//             }
//         });
//
//         let result;
//         try {
//             result = vm.run(code);
//             console.log('Execution Result:', result);
//         } catch (vmError) {
//             console.error('Failed to execute user code:', vmError.message);
//             return res.status(400).json({ error: 'Failed to execute user code: ' + vmError.message });
//         }
//
//         res.json({
//             consoleOutput: logs.join('\n'),
//             result: result !== undefined ? JSON.stringify(result) : null
//         });
//     } catch (error) {
//         console.error('Error evaluating code:', error.message);
//         res.status(500).json({ error: 'Error evaluating code' });
//     }
// });
// app.use('/api', router);
//
// const PORT = process.env.PORT || 8000;
// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });


import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { VM } from 'vm2';
import fs from 'fs/promises';
import bodyParser from "body-parser";


const app = express();
const router = express.Router();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Parse JSON if needed
app.use(cors());
app.use(express.json());

const practiceProblems = new Map();

// Load pre-generated responses
async function loadResponses() {
    try {
        const data = await fs.readFile('pre_generated_responses.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading pre-generated responses:', error);
        return [];
    }
}

// Function to find the best matching response
function findBestMatch(errorMessage, responses) {
    return responses.find(r => r.error.toLowerCase().includes(errorMessage.toLowerCase())) || responses[0];
}
router.get('/gama', async (req, res) => {
    console.log('sadss')
    return res.status(200).json({ response: 'Error processing the error message' });
})

// Endpoint to handle JazzCash callback
// JazzCash callback endpoint
router.post("/jazzcash-callback", (req, res) => {
    console.log("JazzCash Callback Received");
    console.log("Request Body:", req.body);

    const {
        pp_ResponseCode,
        pp_ResponseMessage,
        pp_TxnRefNo,
        pp_Amount,
        pp_BillReference,
        pp_TxnDateTime,
    } = req.body;

    // Prepare essential info as query parameters
    const queryParams = new URLSearchParams({
        responseCode: pp_ResponseCode,
        responseMessage: pp_ResponseMessage,
        txnRefNo: pp_TxnRefNo,
        amount: pp_Amount,
        billReference: pp_BillReference,
        txnDateTime: pp_TxnDateTime,
    }).toString();

    // Redirect to React app with query parameters
    const redirectURL = `http://localhost:5173/transaction-result?${queryParams}`;
    console.log("Redirecting to:", redirectURL);

    res.redirect(302, redirectURL);
});


// router.post("/jazzcash-callback", (req, res) => {
//     console.log("JazzCash Callback Received");
//     console.log("Request Body:", req.body);
  
//     const transactionDetails = req.body;
    
//     // Redirect to React app with transaction details
//     const redirectURL = `http://localhost:5173/jazz-form?${new URLSearchParams(transactionDetails).toString()}`;
//     res.redirect(302, redirectURL);
//   });

router.post('/process-error', async (req, res) => {
    const { errorMessage } = req.body;
    console.log('User Error:', errorMessage);

    try {
        const responses = await loadResponses();
        const bestMatch = findBestMatch(errorMessage, responses);

        res.json({
            solution: bestMatch.solution,
            reason: bestMatch.reason,
            reproductionSteps: bestMatch.reproductionSteps,
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Error processing the error message' });
    }
});

router.post('/generate-practice', async (req, res) => {
    const { errorMessage } = req.body;
    console.log('Generate Practice for Error:', errorMessage);

    try {
        const responses = await loadResponses();
        const bestMatch = findBestMatch(errorMessage, responses);

        const practiceProblem = bestMatch.practiceProblem;

        console.log('Selected practice problem:', practiceProblem);

        const problemId = uuidv4();
        practiceProblems.set(problemId, practiceProblem);
        res.json({ id: problemId, ...practiceProblem });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Error generating practice problem', details: error.message });
    }
});

router.post('/evaluate-code', async (req, res) => {
    const { userCode: code } = req.body;
    console.log('User Code:', code);

    if (typeof code !== 'string' || code.trim() === '') {
        return res.status(400).json({ error: 'Invalid code input' });
    }

    try {
        const logs = [];
        const vm = new VM({
            timeout: 1000,
            sandbox: {
                console: {
                    log: (...args) => {
                        logs.push(args.join(' '));
                    },
                    error: (...args) => {
                        logs.push('Error: ' + args.join(' '));
                    },
                }
            }
        });

        let result;
        try {
            result = vm.run(code);
            console.log('Execution Result:', result);
        } catch (vmError) {
            console.error('Failed to execute user code:', vmError.message);
            return res.status(400).json({ error: 'Failed to execute user code: ' + vmError.message });
        }

        res.json({
            consoleOutput: logs.join('\n'),
            result: result !== undefined ? JSON.stringify(result) : null
        });
    } catch (error) {
        console.error('Error evaluating code:', error.message);
        res.status(500).json({ error: 'Error evaluating code' });
    }
});

app.use('/api', router);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});