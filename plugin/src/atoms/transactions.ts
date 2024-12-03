import { atom } from "jotai";
import { type Transaction } from "../utils/types/transaction";

// Transaction History Context state variables
const transactions = atom<Transaction[]>([]);

export default transactions;
