import { atom } from "jotai";

export type VerifyStatus = "loading" | "success" | "error" | "";

export const verifyStatusAtom = atom<VerifyStatus>("");
