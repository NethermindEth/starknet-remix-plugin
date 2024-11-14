import { atom } from 'jotai'

const cairoVersionAtom = atom<string>('v2.8.4')

const versionsAtom = atom<string[]>([])

export { cairoVersionAtom, versionsAtom }
