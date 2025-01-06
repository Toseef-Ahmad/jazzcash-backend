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

app.use('/api', router);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
