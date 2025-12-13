import type { OpenNextConfig } from 'open-next/types/open-next'

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: 'cloudflare',
      converter: 'edge',
      incrementalCache: 'dummy',
      tagCache: 'dummy',
      queue: 'dummy',
    },
  },
}

export default config
