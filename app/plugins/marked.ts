import { Marked } from 'marked'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const strapiPublicUrl = config.public.strapi.strapiPublicUrl || 'http://localhost:1337'

  const markedInstance = new Marked({
    breaks: true,
    gfm: true
  })

  // We ONLY override images to fix the localhost URL bug. 
  // Everything else parses natively and perfectly.
  markedInstance.use({
    renderer: {
      image(token: any) {
        const href = token.href || ''
        const text = token.text || ''
        const title = token.title || ''
        
        const fixedHref = href.replace(
          /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/,
          strapiPublicUrl
        )
        return `<img 
          src="${fixedHref}" 
          alt="${text}" 
          title="${title}"
          class="rounded-xl my-6 max-h-96 object-cover w-full border border-black/5 shadow-sm"
        />`
      }
    }
  })

  return {
    provide: {
      md: (content: string) => markedInstance.parse(content || '') as string
    }
  }
})