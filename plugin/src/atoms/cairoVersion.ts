import { atom } from 'jotai'

const cairoVersionAtom = atom<string>('v2.8.2')

const versionsAtom = atom<string[]>([])

export { cairoVersionAtom, versionsAtom }
