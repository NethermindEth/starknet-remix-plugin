import { atom } from 'jotai'

const cairoVersionAtom = atom<string>('v2.3.1')

const versionsAtom = atom<string[]>([])

export { cairoVersionAtom, versionsAtom }
