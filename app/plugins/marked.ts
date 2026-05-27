import { marked, Renderer } from 'marked'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const strapiPublicUrl = config.public.strapi.strapiPublicUrl || 'http://localhost:1337'

  // Enable line breaks for standard Strapi editor behavior
  marked.setOptions({
    breaks: true,
    gfm: true
  })

  const renderer = new Renderer()

  // Version-agnostic signatures so it never renders 'undefined'
  renderer.heading = (textOrObj, level) => {
    const text = typeof textOrObj === 'object' ? textOrObj.text : textOrObj
    const depth = typeof textOrObj === 'object' ? textOrObj.depth : level
    
    const sizes: Record<number, string> = {
      1: 'text-2xl font-semibold text-zinc-900 mb-8',
      2: 'text-2xl font-semibold text-zinc-900 mb-8',
      3: 'text-xl font-semibold text-zinc-800 mt-4 mb-8',
    }
    return `<h3 class="${sizes[depth] || 'text-lg font-semibold'}">${text}</h3>`
  }

  renderer.paragraph = (textOrObj) => {
    const text = typeof textOrObj === 'object' ? textOrObj.text : textOrObj
    if (text.trimStart().startsWith('<img')) return text
    return `<p class="text-zinc-600 text-base leading-relaxed mb-8">${text}</p>`
  }

  renderer.strong = (textOrObj) => {
    const text = typeof textOrObj === 'object' ? textOrObj.text : textOrObj
    return `<strong class="font-semibold text-zinc-900">${text}</strong>`
  }

  renderer.link = (hrefOrObj, title, textArg) => {
    const href = typeof hrefOrObj === 'object' ? hrefOrObj.href : hrefOrObj
    const text = typeof hrefOrObj === 'object' ? hrefOrObj.text : textArg
    return `<a href="${href}" class="text-indigo-600 underline hover:text-indigo-800 transition-colors" target="_blank">${text}</a>`
  }

  renderer.list = (bodyOrObj, orderedArg) => {
    const body = typeof bodyOrObj === 'object' ? bodyOrObj.body : bodyOrObj
    const ordered = typeof bodyOrObj === 'object' ? bodyOrObj.ordered : orderedArg
    const tag = ordered ? 'ol' : 'ul'
    const classes = ordered
      ? 'list-decimal list-inside space-y-1 mb-4 text-zinc-600'
      : 'list-disc list-inside space-y-1 mb-4 text-zinc-600'
    return `<${tag} class="${classes}">${body}</${tag}>`
  }

  renderer.listitem = (textOrObj) => {
    const text = typeof textOrObj === 'object' ? textOrObj.text : textOrObj
    return `<li class="text-base leading-relaxed">${text}</li>`
  }

  renderer.image = (hrefOrObj, titleArg, textArg) => {
    const href = typeof hrefOrObj === 'object' ? hrefOrObj.href : hrefOrObj
    const text = typeof hrefOrObj === 'object' ? hrefOrObj.text : textArg
    const title = typeof hrefOrObj === 'object' ? hrefOrObj.title : titleArg
    
    const fixedHref = href?.replace(
      /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/,
      strapiPublicUrl
    )
    return `<img 
      src="${fixedHref}" 
      alt="${text || ''}" 
      title="${title || ''}"
      class="rounded-xl my-6 max-h-96 object-cover w-full border border-black/5 shadow-sm"
    />`
  }

  marked.use({ renderer })

  return {
    provide: {
      // Create a global template helper that strictly uses parse()
      md: (content: string) => marked.parse(content || '')
    }
  }
})