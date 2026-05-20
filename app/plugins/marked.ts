// plugins/marked.ts
import { marked, Renderer } from 'marked'

export default defineNuxtPlugin(() => {
  const renderer = new Renderer()

  renderer.heading = ({ text, depth }) => {
    const sizes: Record<number, string> = {
      1: 'text-2xl font-semibold text-zinc-900 mb-8',
      2: 'text-2xl font-semibold text-zinc-900 mb-8',
      3: 'text-xl font-semibold text-zinc-800 mt-4 mb-8',
    }
    return `<h3 class="${sizes[depth] || 'text-lg font-semibold'}">${text}</h3>`
  }

renderer.paragraph = ({ text }) => {
  // If the paragraph only contains an image, don't wrap it in <p>
  if (text.trimStart().startsWith('<img')) {
    return text
  }
  return `<p class="text-zinc-600 text-base leading-relaxed mb-8">${text}</p>`
}

  renderer.strong = ({ text }) =>
    `<strong class="font-semibold text-zinc-900">${text}</strong>`

  renderer.link = ({ href, text }) =>
    `<a href="${href}" class="text-indigo-600 underline hover:text-indigo-800 transition-colors" target="_blank">${text}</a>`

  renderer.list = ({ body, ordered }) => {
    const tag = ordered ? 'ol' : 'ul'
    const classes = ordered
      ? 'list-decimal list-inside space-y-1 mb-4 text-zinc-600'
      : 'list-disc list-inside space-y-1 mb-4 text-zinc-600'
    return `<${tag} class="${classes}">${body}</${tag}>`
  }

  renderer.listitem = ({ text }) =>
    `<li class="text-base leading-relaxed">${text}</li>`

 
  renderer.image = ({ href, title, text }) => {
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
})