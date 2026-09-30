// UI view model only. Wire transport once docs/API_CONTRACT.md is agreed.
export interface MomentContext {
  customer: string
  version: string
  situation: string
  evidence: { title: string; detail: string }[]
}

export const fixtureMode = import.meta.env.DEV && import.meta.env.MODE === 'fixture'

export const api = {
  async getContext(): Promise<MomentContext | null> {
    if (!fixtureMode) {
      throw new Error('Live connection is not configured. The shared API contract is required before connecting this screen.')
    }
    return {
      customer: 'Alex',
      version: 'fixture-1',
      situation: 'You might be planning a move',
      evidence: [
        { title: 'A home-related payment', detail: 'An example payment to a moving company. It could also be a one-off expense.' },
        { title: 'A change in your routine', detail: 'Example activity in a new neighbourhood. This does not tell us that you are moving.' },
      ],
    }
  },
}
