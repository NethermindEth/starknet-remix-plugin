import { atom } from 'jotai'

const cairoVersionAtom = atom<string>('v2.6.3')

const versionsAtom = atom<string[]>([])

export { cairoVersionAtom, versionsAtom }
