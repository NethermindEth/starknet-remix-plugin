import { atom } from "jotai";
import { type Transaction } from "../utils/types/transaction";

const transactions = atom<Transaction[]>([]);

export default transactions;
