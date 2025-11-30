import transformerDirectives from '@unocss/transformer-directives'
import { defineConfig } from 'unocss'

export default defineConfig({
  theme: {
    colors: {
      ket: '#167782',
      kettext: '#333333',
      
    }
  },
  transformers: [
    transformerDirectives(),
  ],
})